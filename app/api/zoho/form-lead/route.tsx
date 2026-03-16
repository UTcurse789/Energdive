import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";

const WEBHOOK_SECRET = process.env.ZOHO_FORM_WEBHOOK_SECRET || "";
const MAGIC_TOKEN_TTL_HOURS = 24;

/**
 * POST /api/zoho/form-lead
 *
 * Called by Zoho Form workflow immediately after a form submission creates
 * the first (original) CRM lead. This endpoint:
 *   1. Validates the webhook secret.
 *   2. Stores the lead as a "pending_verification" row.
 *   3. Generates a 24-hour magic link token.
 *   4. Sends the magic link email via Brevo.
 *
 * The duplicate (ITEN MEDIA) CRM lead is NOT created here — it is created
 * only after the user verifies via magic link + OTP.
 *
 * Expected body:
 * {
 *   email, name, phone, company,
 *   crm_lead_id   // original Zoho CRM lead id from the form workflow
 * }
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const log = (msg: string) => console.log(`[FORM-LEAD:${requestId}] ${msg}`);

  try {
    // ── 1. Validate secret ───────────────────────────────────────────
    const secret = req.headers.get("x-webhook-secret");
    if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse payload ─────────────────────────────────────────────
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || body.first_name || "").trim();
    const phone = (body.phone || "").trim();
    const company = (body.company || "").trim();
    const crmLeadId = (body.crm_lead_id || "").trim();
    const jobTitle = (body.job_title || body.Designation || body.designation || "").trim();
    const industry = (body.industry || body.Industry || "").trim();
    const rawCommunityPortal = body["Community-Portal"] || body.community_portal || body.Community_Portal;
    const communityPortal = Array.isArray(rawCommunityPortal)
      ? rawCommunityPortal.map((item: string) => String(item).trim()).filter(Boolean).join(",")
      : String(rawCommunityPortal || "").trim();
    const city = (body.city || body.City || body.state || body.State || "").trim();
    const country = (body.country || body.Country || "").trim();

    // Defensive parsing for communities (Zoho can send arrays or comma/semicolon strings)
    const parseArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") return val.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean);
      return [];
    };
    
    // Check for standard Zoho fields
    let communities = parseArray(body.Community || body.community);
    let subCommunities = parseArray(body.Sub_Community || body.sub_community);
    
    // Check for Community-Portal combined field (e.g. "Energy-Solar, Distribution-Microgrids")
    const communityPortalValues = parseArray(body["Community-Portal"] || body.community_portal || body.Community_Portal);
    if (communityPortalValues.length > 0) {
      const parsedComms = new Set<string>();
      const parsedSubs = new Set<string>();
      communityPortalValues.forEach((item: string) => {
        const parts = item.split("-").map((p: string) => p.trim());
        if (parts[0]) parsedComms.add(parts[0]);
        if (parts[1]) parsedSubs.add(parts[1]);
      });
      communities = Array.from(new Set([...Array.from(parsedComms), ...communities]));
      subCommunities = Array.from(new Set([...Array.from(parsedSubs), ...subCommunities]));
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    log(`Form submission received: ${email}, crm_lead_id=${crmLeadId}`);

    // ── 3. Generate magic token ──────────────────────────────────────
    const magicToken = crypto.randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + MAGIC_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    // ── 4. Upsert pending_verification row ───────────────────────────
    // ON CONFLICT on email — if same person submits again, refresh the token.
    const result = await query(
      `INSERT INTO pending_verifications
         (email, name, phone, company, source, verification_status,
          crm_lead_id, magic_token, magic_token_expires_at, communities, sub_communities,
          job_title, industry, community_portal, city, country, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'zoho_form','pending',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
       ON CONFLICT (email) DO UPDATE SET
         name                    = EXCLUDED.name,
         phone                   = EXCLUDED.phone,
         company                 = EXCLUDED.company,
         crm_lead_id             = EXCLUDED.crm_lead_id,
         magic_token             = EXCLUDED.magic_token,
         magic_token_expires_at  = EXCLUDED.magic_token_expires_at,
         communities             = COALESCE(EXCLUDED.communities, pending_verifications.communities),
         sub_communities         = COALESCE(EXCLUDED.sub_communities, pending_verifications.sub_communities),
         job_title               = COALESCE(EXCLUDED.job_title, pending_verifications.job_title),
         industry                = COALESCE(EXCLUDED.industry, pending_verifications.industry),
         community_portal        = COALESCE(EXCLUDED.community_portal, pending_verifications.community_portal),
         city                    = COALESCE(EXCLUDED.city, pending_verifications.city),
         country                 = COALESCE(EXCLUDED.country, pending_verifications.country),
         verification_status     = 'pending',
         otp_verified            = false,
         verified_at             = NULL,
         updated_at              = NOW()
       RETURNING id`,
      [
        email,
        name,
        phone,
        company,
        crmLeadId,
        magicToken,
        expiresAt,
        JSON.stringify(communities),
        JSON.stringify(subCommunities),
        jobTitle || null,
        industry || null,
        communityPortal || null,
        city || null,
        country || null,
      ]
    );

    const pendingId = result.rows[0]?.id;
    log(`Pending verification stored: id=${pendingId}`);

    // ── 5. Send magic link via Brevo ─────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const magicLink = `${appUrl}/verify-account?token=${encodeURIComponent(magicToken)}`;

    await sendMagicLinkEmail(email, name, magicLink);
    log(`Magic link email sent to ${email}`);

    return NextResponse.json({
      success: true,
      pendingId,
      message: "Verification email sent",
    });
    } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[FORM-LEAD:${requestId}] Error:`, error);
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
