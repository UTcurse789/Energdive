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
 * Scenario 1: Zoho Form submits user data via webhook.
 *
 * Flow:
 *   1. Validate webhook secret
 *   2. Store lead in database (MASTER) → pending_verifications (with enrichment data)
 *   3. Send Magic Link email via Brevo
 *   NOTE: NO CRM push happens here. CRM sync deferred to onboarding completion.
 *
 * Body: { email, name, phone, company, crm_lead_id?, job_title?, industry?, community_portal?, city?, country? }
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
        const email = (body.email || "").trim().toLowerCase();
        const name = (body.name || body.first_name || "").trim();
        const phone = (body.phone || "").trim();
        const company = (body.company || "").trim();
        const crmLeadId = (body.crm_lead_id || "").trim();

        const parseArray = (value: unknown): string[] => {
            if (Array.isArray(value)) {
                return value.map((item) => String(item).trim()).filter(Boolean);
            }
            if (typeof value === "string") {
                return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
            }
            return [];
        };

        const portalValues = parseArray(body.community_portal || body.Community_Portal || body["Community-Portal"]);
        const parsedCommunities = new Set(parseArray(body.Community || body.community));
        const parsedSubCommunities = new Set(parseArray(body.Sub_Community || body.sub_community));

        for (const entry of portalValues) {
            const hyphenIndex = entry.indexOf("-");
            if (hyphenIndex > 0) {
                const community = entry.slice(0, hyphenIndex).trim();
                const subCommunity = entry.slice(hyphenIndex + 1).trim();
                if (community) parsedCommunities.add(community);
                if (subCommunity) parsedSubCommunities.add(subCommunity);
            }
        }

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        log(`Webhook received: ${email}`);
        await logEvent("WEBHOOK_RECEIVED", email, `Zoho Form webhook for ${name}`, { source: "zoho_form" });

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

        // ── 4. Store in DB (MASTER) with enrichment + generate magic link ─
        const { token, pendingId } = await createMagicLink(
            email, name, phone, company, "zoho_form", crmLeadId,
            {
                communities: Array.from(parsedCommunities),
                subCommunities: Array.from(parsedSubCommunities),
            }
        );

        log(`Pending verification stored: id=${pendingId}`);
        // NOTE: No CRM push here — deferred to onboarding completion

        // ── 5. Initialize abandoned cart drip sequence ────────────────────
        await (await import("@/lib/db")).query(
            `UPDATE pending_verifications
             SET drip_started_at = NOW(),
                 drip_next_send_at = NOW() + INTERVAL '1 hour',
                 drip_step = 0
             WHERE id = $1 AND (drip_started_at IS NULL)`,
            [pendingId]
        );
        log(`Drip sequence initialized for pending_id=${pendingId}`);

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
