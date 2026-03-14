import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { markTokenUsed } from "@/lib/magic-link-db";
import { query, getClient } from "@/lib/db";
import { createZohoDuplicateLead } from "@/lib/zoho-leads";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { sendMembershipWelcomeEmail } from "@/lib/email";
import { enqueueJob } from "@/lib/job-queue";
import { logEvent } from "@/lib/system-logger";

/**
 * POST /api/auth/verify-otp
 *
 * Verifies the OTP and completes the double opt-in verification.
 *
 * On success:
 *   1. Marks pending_verification as verified
 *   2. Creates/upserts user record in DB with membership_id (via trigger)
 *   3. Marks magic token as used (single-use)
 *   4. Enqueues background jobs for CRM duplicate lead + Brevo sync
 *   5. Sends membership welcome email
 *
 * Body: { email: string, otp: string }
 */
export async function POST(req: NextRequest) {
    const requestId = Math.random().toString(36).slice(2, 8);
    const log = (msg: string) => console.log(`[VERIFY-OTP:${requestId}] ${msg}`);

    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "email and otp are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // ── 1. Load pending verification ─────────────────────────────────
        const pendingResult = await query(
            `SELECT id, email, name, phone, company, source, crm_lead_id,
                    verification_status, otp_verified, communities, sub_communities
             FROM pending_verifications
             WHERE email = $1 LIMIT 1`,
            [normalizedEmail]
        );

        if (pendingResult.rows.length === 0) {
            return NextResponse.json({ error: "No pending verification found" }, { status: 404 });
        }

        const pending = pendingResult.rows[0];

        if (pending.verification_status === "verified") {
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: "Already verified",
            });
        }

        // ── 2. Verify OTP (DB-backed) ────────────────────────────────────
        const isValid = await verifyOtp(normalizedEmail, otp);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid or expired OTP. Please try again." },
                { status: 400 }
            );
        }

        log(`OTP verified for ${normalizedEmail}`);

        // ── 3. Transaction: create user + assign membership ID ───────────
        const client = await getClient();
        let userId: number;
        let membershipId: string;

        try {
            await client.query("BEGIN");

            // Split name into first/last
            const nameParts = (pending.name || "").trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            const userResult = await client.query(
                `INSERT INTO users (
                   email, first_name, last_name, phone, organization,
                   source, crm_lead_id,
                   onboarding_completed, created_at, updated_at
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,false,NOW(),NOW())
                 ON CONFLICT (email) DO UPDATE SET
                   verification_status = 'verified',
                   crm_lead_id         = COALESCE(EXCLUDED.crm_lead_id, users.crm_lead_id),
                   phone               = COALESCE(EXCLUDED.phone, users.phone),
                   organization        = COALESCE(EXCLUDED.organization, users.organization),
                   updated_at          = NOW()
                 RETURNING id, membership_id`,
                [
                    normalizedEmail,
                    firstName,
                    lastName,
                    pending.phone || null,
                    pending.company || null,
                    pending.source || "website",
                    pending.crm_lead_id || null,
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

            // Mark pending_verification as verified
            await client.query(
                `UPDATE pending_verifications SET
                   verification_status = 'verified',
                   otp_verified        = true,
                   verified_at         = NOW(),
                   user_id             = $1,
                   updated_at          = NOW()
                 WHERE id = $2`,
                [userId, pending.id]
            );

            // ── Map and insert Community Data ──
            let finalCommunities: any[] = [];
            let parsedComms = pending.communities;
            let parsedSubs = pending.sub_communities;
            
            if (typeof parsedComms === 'string') parsedComms = JSON.parse(parsedComms);
            if (typeof parsedSubs === 'string') parsedSubs = JSON.parse(parsedSubs);
            
            if (Array.isArray(parsedComms) && parsedComms.length > 0) {
                const scResult = await client.query(
                    `SELECT sc.id as sub_id, sc.name as sub_name, c.id as comm_id, c.name as comm_name 
                     FROM sub_communities sc
                     JOIN communities c ON sc.community_id = c.id
                     WHERE sc.name = ANY($1) OR c.name = ANY($2)`,
                    [Array.isArray(parsedSubs) ? parsedSubs : [], parsedComms]
                );
                
                if (scResult.rows.length > 0) {
                    for (const row of scResult.rows) {
                        await client.query(
                            `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                             VALUES ($1, $2, $3)
                             ON CONFLICT DO NOTHING`,
                            [userId, row.comm_id, row.sub_id]
                        );
                        finalCommunities.push({
                            community_id: row.comm_id,
                            community_name: row.comm_name,
                            sub_community_id: row.sub_id,
                            sub_community_name: row.sub_name
                        });
                    }
                }
            }
            // Bind resolved communities to pending object so background jobs can use them
            pending.resolved_communities = finalCommunities;

            await client.query("COMMIT");
            log(`User verified: id=${userId}, membership_id=${membershipId}`);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

        // ── 4. Mark magic token as used ──────────────────────────────────
        await markTokenUsed(pending.id);

        // ── 5. Log verification event ────────────────────────────────────
        await logEvent("USER_VERIFIED", normalizedEmail, `User verified, membership_id=${membershipId}`, {
            userId,
            membershipId,
            source: pending.source,
        });
        await logEvent("MEMBERSHIP_GENERATED", normalizedEmail, `Membership ID: ${membershipId}`);

        // ── 6. Enqueue background jobs ───────────────────────────────────
        // 6a. Create DUPLICATE CRM lead (owner = ITEN MEDIA)
        enqueueJob("CRM_CREATE_DUPLICATE_LEAD", async () => {
            const resolvedComms = pending.resolved_communities || [];
            const duplicateLeadId = await createZohoDuplicateLead({
                email: normalizedEmail,
                name: pending.name,
                phone: pending.phone,
                company: pending.company,
                source: pending.source,
                originalLeadId: pending.crm_lead_id,
                membershipId,
                communities: resolvedComms.map((c: any) => c.community_name),
                subCommunities: resolvedComms.map((c: any) => c.sub_community_name)
            });

            if (duplicateLeadId) {
                await query(
                    `UPDATE users SET crm_duplicate_lead_id = $1, duplicate_created = true, updated_at = NOW() WHERE id = $2`,
                    [duplicateLeadId, userId]
                );
                log(`Zoho duplicate lead created: ${duplicateLeadId}`);
            }
        }, normalizedEmail);

        // 6b. Sync to Brevo
        enqueueJob("BREVO_SYNC_CONTACT", async () => {
            const resolvedComms = pending.resolved_communities || [];
            await syncVerifiedUserToBrevo({
                email: normalizedEmail,
                name: pending.name,
                phone: pending.phone,
                company: pending.company,
                membershipId,
                source: pending.source,
                communities: resolvedComms.map((c: any) => c.community_name),
                subCommunities: resolvedComms.map((c: any) => c.sub_community_name)
            });
            log(`Brevo synced for ${normalizedEmail}`);
        }, normalizedEmail);

        // ── 7. Send membership welcome email (non-blocking) ──────────────
        try {
            await sendMembershipWelcomeEmail(
                normalizedEmail,
                pending.name || "Member",
                membershipId
            );
            log(`Welcome email sent to ${normalizedEmail}`);
        } catch (emailErr: any) {
            console.warn(`[VERIFY-OTP:${requestId}] Welcome email failed (non-fatal):`, emailErr.message);
        }

        return NextResponse.json({
            success: true,
            userId,
            membershipId,
            message: "Verification complete. Welcome to EnergClub!",
        });
    } catch (error: any) {
        console.error(`[VERIFY-OTP:${requestId}] Unhandled error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
