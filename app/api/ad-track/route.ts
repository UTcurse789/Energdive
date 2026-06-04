import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function classifyDevice(ua: string): "Mobile" | "Tablet" | "Desktop" {
  if (!ua) return "Desktop";
  const lower = ua.toLowerCase();

  if (
    /ipad|tablet|playbook|silk|kindle|sm-t|gt-p|gt-n|mediapad/i.test(lower) ||
    (/android/i.test(lower) && !/mobile/i.test(lower))
  ) {
    return "Tablet";
  }

  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi|iemobile/i.test(
      lower
    )
  ) {
    return "Mobile";
  }

  return "Desktop";
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-client-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

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

const recentImpressions = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000;

function buildImpressionKey(adDocumentId: string, ip: string) {
  return `${adDocumentId}:${ip}`;
}

function isDuplicate(adDocumentId: string, ip: string, eventType: string): boolean {
  if (eventType !== "impression") return false;

  const lastSeen = recentImpressions.get(buildImpressionKey(adDocumentId, ip));
  return Boolean(lastSeen && Date.now() - lastSeen < DEDUP_WINDOW_MS);
}

function rememberImpression(adDocumentId: string, ip: string, eventType: string) {
  if (eventType !== "impression") return null;

  const key = buildImpressionKey(adDocumentId, ip);
  recentImpressions.set(key, Date.now());

  if (recentImpressions.size > 10_000) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [currentKey, value] of recentImpressions) {
      if (value < cutoff) {
        recentImpressions.delete(currentKey);
      }
    }
  }

  return key;
}

function forgetImpression(key: string | null) {
  if (key) {
    recentImpressions.delete(key);
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { adDocumentId, eventType, referrer } = body;

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

    if (isDuplicate(adDocumentId, ip, eventType)) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const dedupeKey = rememberImpression(adDocumentId, ip, eventType);
    const deviceType = classifyDevice(ua);

    let insertResult;
    try {
      insertResult = await query<{ id: number }>(
        `INSERT INTO ad_events (ad_document_id, event_type, ip_address, user_agent, device_type, referrer)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [adDocumentId, eventType, ip, ua, deviceType, referrer || null]
      );
    } catch (error) {
      forgetImpression(dedupeKey);
      console.error("[ad-track] Failed to persist event:", error);
      return NextResponse.json({ ok: true, persisted: false });
    }

    const eventId = insertResult.rows[0]?.id;

    if (eventId && ip !== "unknown") {
      resolveRegion(ip).then(async (region) => {
        if (!region) {
          return;
        }

        try {
          await query(`UPDATE ad_events SET region = $1 WHERE id = $2`, [
            region,
            eventId,
          ]);
        } catch {
          // Region enrichment is non-critical.
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ad-track] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
