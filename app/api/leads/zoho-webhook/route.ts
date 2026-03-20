import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import { createMagicLink } from "@/lib/magic-link-db";
import { sendMagicLinkEmail } from "@/lib/email";
import { logEvent } from "@/lib/system-logger";

const WEBHOOK_SECRET = process.env.ZOHO_FORM_WEBHOOK_SECRET || process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/leads/zoho-webhook
 *
 * Scenario 1: Zoho Form submits user data via Deluge workflow webhook.
 *
 * Flow:
 *   1. Validate webhook secret
 *   2. Parse community data from Community, Sub_Community, AND community_portal fields
 *   3. Store lead in pending_verifications with all enrichment fields
 *   4. Send Magic Link email via Brevo
 *
 * NOTE: NO Brevo contact sync or CRM lead creation happens here.
 *       Those happen in /api/auth/magic-otp-verify AFTER the user verifies.
 *
 * Body (from Deluge form-lead-webhook.dg):
 *   { email, name, phone, company, crm_lead_id,
 *     job_title, industry, community_portal, Community, Sub_Community, city, country }
 */
export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[ZOHO-WEBHOOK:${requestId}] ${msg}`);

    try {
        // ── 1. Validate webhook secret ───────────────────────────────────
        const secret = req.headers.get("x-webhook-secret");
        if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── 2. Parse payload ─────────────────────────────────────────────
        const body = await req.json();
        log(`Raw body keys: ${Object.keys(body).join(", ")}`);
        log(`Raw phone fields: phone=${body.phone}, Phone=${body.Phone}, Mobile=${body.Mobile}, mobile=${body.mobile}, mobile_number=${body.mobile_number}, Mobile_Number=${body.Mobile_Number}`);

        const email = (body.email || "").trim().toLowerCase();
        const name = (body.name || body.first_name || "").trim();
        // Check multiple phone field name variants — Zoho Form's "Mobile Number" maps
        // to CRM field "Mobile", and the Deluge script sends it as "phone".
        // Be resilient to any naming.
        const phone = (
            body.phone || body.Phone || body.Mobile || body.mobile ||
            body.mobile_number || body.Mobile_Number || ""
        ).toString().trim();
        const company = (body.company || "").trim();
        const crmLeadId = (body.crm_lead_id || "").trim();

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        // ── Parse community data ─────────────────────────────────────────
        // The Deluge script (form-lead-webhook.dg) sends three fields:
        //   - Community        : e.g. "Oil & Gas;Power Generation"
        //   - Sub_Community    : e.g. "Upstream;Solar"
        //   - community_portal : e.g. "Oil & Gas-Upstream;Power Generation-Solar"
        //
        // We merge all three sources so that communities and sub-communities are
        // captured regardless of which fields Zoho has populated.

        const parseDelimitedString = (value: unknown): string[] => {
            if (Array.isArray(value)) {
                return value.map((item) => String(item).trim()).filter(Boolean);
            }
            if (typeof value === "string" && value.trim()) {
                // Zoho multi-select fields serialize as semicolon or comma-separated strings
                return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
            }
            return [];
        };

        const parsedCommunities = new Set<string>(parseDelimitedString(body.Community || body.community));
        const parsedSubCommunities = new Set<string>(parseDelimitedString(body.Sub_Community || body.sub_community));

        // Also parse community_portal (e.g. "Oil & Gas-Upstream") as a fallback
        // so any communities not in Community/Sub_Community fields are still captured.
        const portalValues = parseDelimitedString(
            body.community_portal || body.Community_Portal || body["Community-Portal"]
        );
        for (const entry of portalValues) {
            const hyphenIndex = entry.indexOf("-");
            if (hyphenIndex > 0) {
                const community = entry.slice(0, hyphenIndex).trim();
                const subCommunity = entry.slice(hyphenIndex + 1).trim();
                if (community) parsedCommunities.add(community);
                if (subCommunity) parsedSubCommunities.add(subCommunity);
            } else if (entry.trim()) {
                // No hyphen — treat whole value as community name
                parsedCommunities.add(entry.trim());
            }
        }

        const communities = Array.from(parsedCommunities);
        const subCommunities = Array.from(parsedSubCommunities);

        // Preserve the raw community_portal values (e.g. "Oil & Gas-Upstream;Power Gen-Solar")
        // so they can be sent to CRM later without regenerating wrong combinations.
        const rawCommunityPortalValues = parseDelimitedString(
            body.community_portal || body.Community_Portal || body["Community-Portal"]
        );

        log(`Webhook received: ${email} | communities=[${communities}] | subs=[${subCommunities}] | phone=${phone} | rawPortal=[${rawCommunityPortalValues}]`);
        await logEvent("WEBHOOK_RECEIVED", email, `Zoho Form webhook for ${name}`, { source: "zoho_form", communities, subCommunities });

        // ── 3. Check for existing verified user ──────────────────────────
        const existingUser = await query(
            `SELECT id, verification_status, membership_id FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (existingUser.rows.length > 0 && existingUser.rows[0].verification_status === "verified") {
            log(`User already verified: ${email}`);
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: "User already verified",
            });
        }

        // ── 4. Store pending verification with enrichment data ───────────
        // createMagicLink upserts the pending_verifications row (ON CONFLICT email)
        // and stores communities/sub_communities as JSONB for use at verify time.
        const { token, pendingId } = await createMagicLink(
            email, name, phone, company, "zoho_form", crmLeadId,
            { communities, subCommunities }
        );

        log(`Pending verification stored: id=${pendingId}`);

        // ── 5. Store enrichment fields on pending_verifications ──────────
        // job_title, industry, city, country are not part of the createMagicLink
        // signature — update the row directly.
        const jobTitle = (body.job_title || "").trim() || null;
        const industry = (body.industry || "").trim() || null;
        const city = (body.city || "").trim() || null;
        const country = (body.country || "").trim() || null;
        // UTMs sent from Zoho
        const utmSource = (body.utm_source || "").trim() || null;
        const utmMedium = (body.utm_medium || "").trim() || null;
        const utmCampaign = (body.utm_campaign || "").trim() || null;
        const utmTerm = (body.utm_term || "").trim() || null;
        const utmContent = (body.utm_content || "").trim() || null;
        
        // Store raw community_portal so magic-otp-verify can send paired values to CRM
        const communityPortalStr = rawCommunityPortalValues.length > 0
            ? rawCommunityPortalValues.join(";")
            : null;

        if (jobTitle || industry || city || country || communityPortalStr || utmSource || utmMedium || utmCampaign) {
            await query(
                `UPDATE pending_verifications
                 SET job_title = COALESCE($2, job_title),
                     industry  = COALESCE($3, industry),
                     city      = COALESCE($4, city),
                     country   = COALESCE($5, country),
                     community_portal = COALESCE($6, community_portal),
                     utm_source = COALESCE($7, utm_source),
                     utm_medium = COALESCE($8, utm_medium),
                     utm_campaign = COALESCE($9, utm_campaign),
                     utm_term = COALESCE($10, utm_term),
                     utm_content = COALESCE($11, utm_content),
                     updated_at = NOW()
                 WHERE id = $1`,
                [pendingId, jobTitle, industry, city, country, communityPortalStr, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]
            );
        }

        // ── 6. Send Magic Link email ─────────────────────────────────────
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
        const magicLink = `${appUrl}/verify-account?token=${encodeURIComponent(token)}`;

        await sendMagicLinkEmail(email, name || "Member", magicLink);
        log(`Magic link email sent to ${email}`);

        return NextResponse.json({
            success: true,
            pendingId,
            message: "Verification email sent",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ZOHO-WEBHOOK:${requestId}] Error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 }
        );
    }
}