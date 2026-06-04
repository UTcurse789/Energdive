import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { query, getClient } from "@/lib/db";
import { sendMembershipWelcomeCardEmail } from "@/lib/email";
import { issueMagicToken } from "@/lib/queries";
import { getPostHogClient } from "@/lib/posthog-server";

function getPrimaryCommunityLabel(value: unknown): string | null {
    if (!value) {
        return null;
    }

    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).find(Boolean) || null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item).trim()).find(Boolean) || null;
            }
        } catch {
            // Fall through to delimiter parsing.
        }

        return trimmed
            .split(/[;,]/)
            .map((item) => item.trim())
            .find(Boolean) || null;
    }

    return null;
}

/**
 * POST /api/auth/confirm-otp
 *
 * Step 2 of double opt-in: verifies the OTP and completes the verification.
 *
 * On success:
 *   1. Marks pending_verification as verified.
 *   2. Creates or upserts the full user record in the DB (with enrichment data).
 *   3. Assigns a membership ID (ENCL-STN-xxx) via DB trigger.
 *   4. Sends membership welcome email.
 *
 * NOTE: Brevo and CRM sync are NO LONGER done here.
 * They are deferred to /api/onboarding/submit after the user completes their profile.
 *
 * Body: { pendingId: number, otp: string }
 */
export async function POST(req: NextRequest) {
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

        // ── 1. Load pending verification (with enrichment fields) ────────
        const pendingResult = await query(
            `SELECT id, email, name, phone, company, source, crm_lead_id,
              verification_status, otp_verified,
              job_title, industry, community_portal, city, country
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
           source, crm_lead_id, job_title, sync_status,
           onboarding_completed, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',false,NOW())
         ON CONFLICT (email) DO UPDATE SET
           verification_status = 'verified',
           crm_lead_id         = COALESCE(EXCLUDED.crm_lead_id, users.crm_lead_id),
           phone               = COALESCE(EXCLUDED.phone, users.phone),
           organization        = COALESCE(EXCLUDED.organization, users.organization),
           job_title           = COALESCE(EXCLUDED.job_title, users.job_title)
         RETURNING id, membership_id`,
                [
                    pending.email,
                    firstName,
                    lastName,
                    pending.phone || null,
                    pending.company || null,
                    pending.source || "zoho_form",
                    pending.crm_lead_id || null,
                    pending.job_title || null,
                ]
            );

            userId = userResult.rows[0].id;
            membershipId = userResult.rows[0].membership_id;

            // Fresh INSERT → trigger didn't fire (BEFORE UPDATE only).
            // Force verification_status change to trigger membership_id assignment.
            if (!membershipId) {
                const verifyResult = await client.query(
                    `UPDATE users SET verification_status = 'verified', updated_at = NOW()
                     WHERE id = $1 AND (verification_status IS NULL OR verification_status <> 'verified')
                     RETURNING membership_id`,
                    [userId]
                );
                membershipId = verifyResult.rows[0]?.membership_id || membershipId;
            }

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

        // ── 5. Send membership welcome email ─────────────────────────────
        // NOTE: Brevo sync and CRM sync are deferred to /api/onboarding/submit
        // to ensure full enriched data (job_title, community, etc.) is available.
        try {
            const { token: accessToken } = await issueMagicToken(userId);
            await sendMembershipWelcomeCardEmail(
                pending.email,
                pending.name || "Member",
                membershipId,
                {
                    company: pending.company || null,
                    community: getPrimaryCommunityLabel(pending.community_portal),
                    joinedAt: new Date(),
                    accessToken,
                }
            );
            log(`Welcome email sent to ${pending.email}`);
        } catch (emailErr: unknown) {
            const message = emailErr instanceof Error ? emailErr.message : String(emailErr);
            console.warn(`[CONFIRM-OTP:${requestId}] Welcome email failed (non-fatal):`, message);
        }

        getPostHogClient().capture({
            distinctId: pending.email,
            event: "user_registration_completed",
            properties: {
                email: pending.email,
                membership_id: membershipId,
                source: pending.source || "website",
                has_company: !!pending.company,
                has_phone: !!pending.phone,
            },
        });

        getPostHogClient().identify({
            distinctId: pending.email,
            properties: {
                email: pending.email,
                name: pending.name,
                membership_id: membershipId,
                source: pending.source || "website",
            },
        });

        return NextResponse.json({
            success: true,
            userId,
            membershipId,
            message: "Verification complete. Welcome to EnergClub!",
        });
    } catch (error: unknown) {
        console.error(`[CONFIRM-OTP:${requestId}] Unhandled error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
