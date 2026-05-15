import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// ── Simple UA-based device classifier ────────────────────────────────
function classifyDevice(ua: string): "Mobile" | "Tablet" | "Desktop" {
  if (!ua) return "Desktop";
  const lower = ua.toLowerCase();
  // Tablets first (before mobile, since some tablets have "mobile" in UA)
  if (
    /ipad|tablet|playbook|silk|kindle|sm-t|gt-p|gt-n|mediapad/i.test(lower) ||
    (/android/i.test(lower) && !/mobile/i.test(lower))
  ) {
    return "Tablet";
  }
  // Mobile
  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi|iemobile/i.test(
      lower
    )
  ) {
    return "Mobile";
  }
  return "Desktop";
}

// ── Extract client IP ────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-client-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

// ── Geo-IP lookup (free ip-api.com, limited to 45 req/min) ──────────
// Returns region name or null. Non-blocking; won't delay the response.
async function resolveRegion(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=regionName`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.regionName || null;
  } catch {
    return null;
  }
}

// ── Deduplication: in-memory set (per-instance, clears on restart) ──
// Prevents the same IP from logging the same impression within 60s.
const recentImpressions = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000;

function isDuplicate(adDocumentId: string, ip: string, eventType: string): boolean {
  if (eventType !== "impression") return false; // don't dedup clicks
  const key = `${adDocumentId}:${ip}`;
  const lastSeen = recentImpressions.get(key);
  if (lastSeen && Date.now() - lastSeen < DEDUP_WINDOW_MS) return true;
  recentImpressions.set(key, Date.now());
  // Periodic cleanup (keep map small)
  if (recentImpressions.size > 10_000) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [k, v] of recentImpressions) {
      if (v < cutoff) recentImpressions.delete(k);
    }
  }
  return false;
}

// ── POST /api/ad-track ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adDocumentId, eventType, referrer } = body;

    // Validate
    if (!adDocumentId || typeof adDocumentId !== "string") {
      return NextResponse.json(
        { error: "adDocumentId is required" },
        { status: 400 }
      );
    }
    if (eventType !== "impression" && eventType !== "click") {
      return NextResponse.json(
        { error: 'eventType must be "impression" or "click"' },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const ua = req.headers.get("user-agent") || "";

    // Dedup impressions
    if (isDuplicate(adDocumentId, ip, eventType)) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const deviceType = classifyDevice(ua);

    // Resolve region asynchronously — don't block response
    // We INSERT first with region=null, then UPDATE if geo succeeds
    const insertResult = await query(
      `INSERT INTO ad_events (ad_document_id, event_type, ip_address, user_agent, device_type, referrer)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [adDocumentId, eventType, ip, ua, deviceType, referrer || null]
    );

    const eventId = insertResult.rows[0]?.id;

    // Fire-and-forget region resolution
    if (eventId && ip !== "unknown") {
      resolveRegion(ip).then(async (region) => {
        if (region) {
          try {
            await query(
              `UPDATE ad_events SET region = $1 WHERE id = $2`,
              [region, eventId]
            );
          } catch {
            // Non-critical — ignore
          }
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ad-track] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
