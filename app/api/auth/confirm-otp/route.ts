import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { query, getClient } from "@/lib/db";
import { createZohoDuplicateLead } from "@/lib/zoho-leads";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { sendMembershipWelcomeEmail } from "@/lib/email";

/**
 * POST /api/auth/confirm-otp
 *
 * Step 2 of double opt-in: verifies the OTP and completes the verification.
 *
 * On success:
 *   1. Marks pending_verification as verified.
 *   2. Creates or upserts the full user record in the DB.
 *   3. Assigns a membership ID (ENCL-STN-xxx) via DB trigger.
 *   4. Creates the DUPLICATE CRM lead in Zoho (owner = ITEN MEDIA).
 *   5. Syncs contact to Brevo with membership_id attribute.
 *   6. Stores crm_duplicate_lead_id back on the user record.
 *
 * Body: { pendingId: number, otp: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
    const requestId = Math.random().toString(36).slice(2, 8);
    const log = (msg: string) => console.log(`[CONFIRM-OTP:${requestId}] ${msg}`);

    try {
        const { pendingId, otp } = await req.json();

        if (!pendingId || !otp) {
            return NextResponse.json(
                { error: "pendingId and otp are required" },
                { status: 400 }
            );
        }

        // ── 1. Load pending verification ─────────────────────────────────
        const pendingResult = await query(
            `SELECT id, email, name, phone, company, source, crm_lead_id,
              verification_status, otp_verified
       FROM pending_verifications
       WHERE id = $1 LIMIT 1`,
            [pendingId]
        );

        if (pendingResult.rows.length === 0) {
            return NextResponse.json({ error: "Verification not found" }, { status: 404 });
        }

        const pending = pendingResult.rows[0];

        if (pending.verification_status === "verified") {
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: "Already verified",
            });
        }

        // ── 2. Verify OTP ────────────────────────────────────────────────
        const isValid = verifyOtp(pending.email, otp);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid or expired OTP. Please try again." },
                { status: 400 }
            );
        }

        log(`OTP verified for ${pending.email}`);

        const client = await getClient();
        let userId: number;
        let membershipId: string;

        try {
            await client.query("BEGIN");

            // ── 3. Upsert user in main users table ───────────────────────────
            // Split name into first/last
            const nameParts = (pending.name || "").trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            const userResult = await client.query(
                `INSERT INTO users (
           email, first_name, last_name, phone, organization,
           source, verification_status, crm_lead_id,
           onboarding_completed, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'verified',$7,false,NOW())
         ON CONFLICT (email) DO UPDATE SET
           verification_status = 'verified',
           crm_lead_id         = COALESCE(EXCLUDED.crm_lead_id, users.crm_lead_id),
           phone               = COALESCE(EXCLUDED.phone, users.phone),
           organization        = COALESCE(EXCLUDED.organization, users.organization)
         RETURNING id, membership_id`,
                [
                    pending.email,
                    firstName,
                    lastName,
                    pending.phone || null,
                    pending.company || null,
                    pending.source || "zoho_form",
                    pending.crm_lead_id || null,
                ]
            );

            userId = userResult.rows[0].id;
            membershipId = userResult.rows[0].membership_id;

            // ── 4. Mark pending_verification as verified ─────────────────────
            await client.query(
                `UPDATE pending_verifications SET
           verification_status = 'verified',
           otp_verified        = true,
           verified_at         = NOW(),
           user_id             = $1,
           updated_at          = NOW()
         WHERE id = $2`,
                [userId, pendingId]
            );

            await client.query("COMMIT");
            log(`User upserted: id=${userId}, membership_id=${membershipId}`);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

        // ── 5. Create DUPLICATE CRM lead in Zoho (owner = ITEN MEDIA) ────
        // This happens OUTSIDE the DB transaction — non-blocking, non-fatal.
        let crmDuplicateLeadId: string | null = null;
        try {
            crmDuplicateLeadId = await createZohoDuplicateLead({
                email: pending.email,
                name: pending.name,
                phone: pending.phone,
                company: pending.company,
                source: pending.source,
                originalLeadId: pending.crm_lead_id,
                membershipId,
            });
            log(`Zoho duplicate lead created: ${crmDuplicateLeadId}`);

            // Store duplicate lead ID back on the user record
            if (crmDuplicateLeadId) {
                await query(
                    `UPDATE users SET crm_duplicate_lead_id = $1 WHERE id = $2`,
                    [crmDuplicateLeadId, userId]
                );
            }
        } catch (zohoErr: any) {
            console.warn(
                `[CONFIRM-OTP:${requestId}] Zoho duplicate lead creation failed (non-fatal):`,
                zohoErr.message
            );
        }

        // ── 6. Sync to Brevo with membership_id ──────────────────────────
        try {
            await syncVerifiedUserToBrevo({
                email: pending.email,
                name: pending.name,
                phone: pending.phone,
                company: pending.company,
                membershipId,
                source: pending.source,
            });
            log(`Brevo synced for ${pending.email}`);
        } catch (brevoErr: any) {
            console.warn(
                `[CONFIRM-OTP:${requestId}] Brevo sync failed (non-fatal):`,
                brevoErr.message
            );
        }

        // ── 7. Update BOTH Zoho leads with membership_id ─────────────────
        try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
            await fetch(`${appUrl}/api/zoho/update-lead-membership`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalLeadId: pending.crm_lead_id || undefined,
                    duplicateLeadId: crmDuplicateLeadId || undefined,
                    membershipId,
                    secret: process.env.ZOHO_WEBHOOK_SECRET,
                }),
            });
            log(`Zoho leads updated with membership_id ${membershipId}`);
        } catch (zohoUpdateErr: any) {
            console.warn(`[CONFIRM-OTP:${requestId}] Zoho membership update failed (non-fatal):`, zohoUpdateErr.message);
        }

        // ── 8. Send membership welcome email ─────────────────────────────
        try {
            await sendMembershipWelcomeEmail(pending.email, pending.name || "Member", membershipId);
            log(`Welcome email sent to ${pending.email}`);
        } catch (emailErr: any) {
            console.warn(`[CONFIRM-OTP:${requestId}] Welcome email failed (non-fatal):`, emailErr.message);
        }

        return NextResponse.json({
            success: true,
            userId,
            membershipId,
            message: "Verification complete. Welcome to EnergClub!",
        });
    } catch (error: any) {
        console.error(`[CONFIRM-OTP:${requestId}] Unhandled error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}