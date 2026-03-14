import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import { createMagicLink } from "@/lib/magic-link-db";
import { sendMagicLinkEmail } from "@/lib/email";
import { logEvent } from "@/lib/system-logger";
import { enqueueJob } from "@/lib/job-queue";
import { createZohoLead, ZohoLeadData } from "@/lib/zoho-leads";

const WEBHOOK_SECRET = process.env.ZOHO_FORM_WEBHOOK_SECRET || process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/leads/zoho-webhook
 *
 * Scenario 1: Zoho Form submits user data via webhook.
 *
 * Flow:
 *   1. Validate webhook secret
 *   2. Store lead in database (MASTER) → pending_verifications
 *   3. Create original CRM lead (Lead Owner = Event Owner) via background job
 *   4. Send Magic Link email via Brevo
 *
 * Body: { email, name, phone, company, crm_lead_id? }
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

        // ── 4. Store in DB (MASTER) and generate magic link ──────────────
        const { token, expiresAt, pendingId } = await createMagicLink(
            email, name, phone, company, "zoho_form", crmLeadId
        );

        log(`Pending verification stored: id=${pendingId}`);

        // ── 5. Create ORIGINAL CRM lead via background job ───────────────
        // (Lead Owner = Event Owner — default Zoho assignment)
        if (!crmLeadId) {
            enqueueJob("CRM_CREATE_ORIGINAL_LEAD", async () => {
                const nameParts = name.split(/\s+/);
                const leadData: ZohoLeadData = {
                    First_Name: nameParts[0] || "Lead",
                    Last_Name: nameParts.slice(1).join(" ") || ".",
                    Email: email,
                    Phone: phone || undefined,
                    Company: company || undefined,
                    Lead_Source: "Zoho Form",
                };
                const result = await createZohoLead(leadData);
                // Store CRM lead ID back on the pending record
                await query(
                    `UPDATE pending_verifications SET crm_lead_id = $1, updated_at = NOW() WHERE id = $2`,
                    [result.id, pendingId]
                );
                log(`Original CRM lead created: ${result.id}`);
            }, email);
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
    } catch (error: any) {
        console.error(`[ZOHO-WEBHOOK:${requestId}] Error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
