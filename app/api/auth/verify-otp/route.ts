import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { markTokenUsed } from "@/lib/magic-link-db";
import { query, getClient } from "@/lib/db";
import { createZohoDuplicateLead } from "@/lib/zoho-leads";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { sendMembershipWelcomeEmail } from "@/lib/email";
import { enqueueJob } from "@/lib/job-queue";
import { logEvent } from "@/lib/system-logger";

type PendingVerification = {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    company: string | null;
    source: string | null;
    crm_lead_id: string | null;
    verification_status: string;
    otp_verified: boolean;
    communities: unknown;
    sub_communities: unknown;
    job_title: string | null;
    industry: string | null;
    community_portal: unknown;
    city: string | null;
    country: string | null;
};

function toStringArray(value: unknown): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => String(item).trim())
                    .filter(Boolean);
            }
        } catch {
            // Fall through to separator parsing.
        }

        return trimmed
            .split(/[;,]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function parseCommunityPortalPairs(value: unknown): Array<{ community: string; subCommunity: string | null }> {
    return toStringArray(value).flatMap((entry) => {
        const hyphenIndex = entry.indexOf("-");
        if (hyphenIndex <= 0) {
            return entry ? [{ community: entry, subCommunity: null }] : [];
        }

        const community = entry.slice(0, hyphenIndex).trim();
        const subCommunity = entry.slice(hyphenIndex + 1).trim();

        if (!community) return [];

        return [{
            community,
            subCommunity: subCommunity || null,
        }];
    });
}

async function ensureMembershipId(client: Awaited<ReturnType<typeof getClient>>, userId: number): Promise<string> {
    const existing = await client.query(
        `SELECT membership_id FROM users WHERE id = $1 LIMIT 1`,
        [userId]
    );

    const membershipId = existing.rows[0]?.membership_id as string | null | undefined;
    if (membershipId) {
        return membershipId;
    }

    const seqResult = await client.query(`SELECT nextval('membership_id_seq') AS seq_val`);
    const seqVal = seqResult.rows[0].seq_val;
    const generatedMembershipId = `ENCL-STN-${seqVal}`;

    await client.query(
        `UPDATE users
         SET membership_id = $1,
             membership_seq = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [generatedMembershipId, seqVal, userId]
    );

    return generatedMembershipId;
}

async function loadVerifiedUserSnapshot(userId: number) {
    const result = await query(
        `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.organization,
          u.job_title,
          u.country,
          u.state,
          u.membership_id,
          u.verification_status,
          u.preferred_frequency,
          u.preferred_formats,
          u.source,
          u.crm_lead_id,
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT c.name)
             FROM user_communities uc
             JOIN communities c ON c.id = uc.community_id
             WHERE uc.user_id = u.id),
            '{}'
          ) AS communities,
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT sc.name)
             FROM user_communities uc
             JOIN sub_communities sc ON sc.id = uc.sub_community_id
             WHERE uc.user_id = u.id),
            '{}'
          ) AS sub_communities,
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT i.name)
             FROM user_industries ui
             JOIN industry i ON i.id = ui.industry_id
             WHERE ui.user_id = u.id),
            '{}'
          ) AS industries,
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT si.name)
             FROM user_industries ui
             JOIN sub_industries si ON si.id = ui.sub_industry_id
             WHERE ui.user_id = u.id),
            '{}'
          ) AS sub_industries
        FROM users u
        WHERE u.id = $1
        LIMIT 1
        `,
        [userId]
    );

    return result.rows[0] || null;
}

/**
 * POST /api/auth/verify-otp
 *
 * Verifies the OTP and completes the double opt-in verification.
 *
 * On success:
 *   1. Marks pending_verification as verified
 *   2. Creates/upserts user record in DB with membership_id
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

        const pendingResult = await query<PendingVerification>(
            `SELECT id, email, name, phone, company, source, crm_lead_id,
                    verification_status, otp_verified, communities, sub_communities,
                    job_title, industry, community_portal, city, country
             FROM pending_verifications
             WHERE email = $1
             LIMIT 1`,
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

        const isValid = await verifyOtp(normalizedEmail, otp);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid or expired OTP. Please try again." },
                { status: 400 }
            );
        }

        log(`OTP verified for ${normalizedEmail}`);

        const client = await getClient();
        let userId: number;
        let membershipId: string;

        try {
            await client.query("BEGIN");

            const nameParts = (pending.name || "").trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            const userResult = await client.query(
                `INSERT INTO users (
                   email, first_name, last_name, phone, organization,
                   source, crm_lead_id, job_title, country, state,
                   verification_status, onboarding_completed,
                   created_at, updated_at
                 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_verification',true,NOW(),NOW())
                 ON CONFLICT (email) DO UPDATE SET
                   verification_status = 'verified',
                   onboarding_completed = true,
                   crm_lead_id         = COALESCE(EXCLUDED.crm_lead_id, users.crm_lead_id),
                   phone               = COALESCE(EXCLUDED.phone, users.phone),
                   organization        = COALESCE(EXCLUDED.organization, users.organization),
                   job_title           = COALESCE(EXCLUDED.job_title, users.job_title),
                   country             = COALESCE(EXCLUDED.country, users.country),
                   state               = COALESCE(EXCLUDED.state, users.state),
                   updated_at          = NOW()
                 RETURNING id, membership_id`,
                [
                    normalizedEmail,
                    firstName,
                    lastName,
                    pending.phone || null,
                    pending.company || null,
                    pending.source || "zoho_form",
                    pending.crm_lead_id || null,
                    pending.job_title || null,
                    pending.country || null,
                    pending.city || null,
                ]
            );

            userId = userResult.rows[0].id;
            membershipId = userResult.rows[0].membership_id;

            if (!membershipId) {
                const verifyResult = await client.query(
                    `UPDATE users
                     SET verification_status = 'verified',
                         updated_at = NOW()
                     WHERE id = $1
                       AND verification_status IS DISTINCT FROM 'verified'
                     RETURNING membership_id`,
                    [userId]
                );
                membershipId = verifyResult.rows[0]?.membership_id || membershipId;
            }

            if (!membershipId) {
                membershipId = await ensureMembershipId(client, userId);
            }

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

            if (pending.industry) {
                const industryResult = await client.query(
                    `SELECT id FROM industry WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                    [pending.industry.trim()]
                );

                if (industryResult.rows.length > 0) {
                    const industryId = industryResult.rows[0].id;
                    const subIndustryResult = await client.query(
                        `SELECT id
                         FROM sub_industries
                         WHERE industry_id = $1
                         ORDER BY id
                         LIMIT 1`,
                        [industryId]
                    );

                    const subIndustryId = subIndustryResult.rows[0]?.id;
                    if (subIndustryId) {
                        await client.query(`DELETE FROM user_industries WHERE user_id = $1`, [userId]);
                        await client.query(
                            `INSERT INTO user_industries (user_id, industry_id, sub_industry_id)
                             VALUES ($1, $2, $3)`,
                            [userId, industryId, subIndustryId]
                        );
                    }
                }
            }

            const parsedCommunities = new Set(toStringArray(pending.communities));
            const globalSubCommunities = new Set(toStringArray(pending.sub_communities));
            const scopedSubCommunities = new Map<string, Set<string>>();

            for (const pair of parseCommunityPortalPairs(pending.community_portal)) {
                parsedCommunities.add(pair.community);
                if (pair.subCommunity) {
                    const key = pair.community.toLowerCase();
                    if (!scopedSubCommunities.has(key)) {
                        scopedSubCommunities.set(key, new Set());
                    }
                    scopedSubCommunities.get(key)!.add(pair.subCommunity);
                }
            }

            if (parsedCommunities.size > 0) {
                await client.query(`DELETE FROM user_communities WHERE user_id = $1`, [userId]);
                const insertedPairs = new Set<string>();

                for (const communityName of parsedCommunities) {
                    const communityResult = await client.query(
                        `SELECT id FROM communities WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                        [communityName.trim()]
                    );

                    if (communityResult.rows.length === 0) {
                        continue;
                    }

                    const communityId = communityResult.rows[0].id;
                    const candidateSubs = Array.from(new Set([
                        ...Array.from(scopedSubCommunities.get(communityName.toLowerCase()) || []),
                        ...Array.from(globalSubCommunities),
                    ]));

                    let insertedForCommunity = false;

                    for (const subName of candidateSubs) {
                        const subResult = await client.query(
                            `SELECT id
                             FROM sub_communities
                             WHERE community_id = $1
                               AND LOWER(name) = LOWER($2)
                             LIMIT 1`,
                            [communityId, subName.trim()]
                        );

                        if (subResult.rows.length === 0) {
                            continue;
                        }

                        const subCommunityId = subResult.rows[0].id;
                        const pairKey = `${communityId}-${subCommunityId}`;
                        if (insertedPairs.has(pairKey)) {
                            continue;
                        }

                        await client.query(
                            `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                             VALUES ($1, $2, $3)`,
                            [userId, communityId, subCommunityId]
                        );

                        insertedPairs.add(pairKey);
                        insertedForCommunity = true;
                    }

                    if (!insertedForCommunity) {
                        const fallbackSubResult = await client.query(
                            `SELECT id
                             FROM sub_communities
                             WHERE community_id = $1
                             ORDER BY id
                             LIMIT 1`,
                            [communityId]
                        );

                        const fallbackSubId = fallbackSubResult.rows[0]?.id;
                        if (fallbackSubId) {
                            const pairKey = `${communityId}-${fallbackSubId}`;
                            if (!insertedPairs.has(pairKey)) {
                                await client.query(
                                    `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                                     VALUES ($1, $2, $3)`,
                                    [userId, communityId, fallbackSubId]
                                );
                                insertedPairs.add(pairKey);
                            }
                        }
                    }
                }
            }

            await client.query("COMMIT");
            log(`User verified: id=${userId}, membership_id=${membershipId}`);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }

        await markTokenUsed(pending.id);

        await logEvent("USER_VERIFIED", normalizedEmail, `User verified, membership_id=${membershipId}`, {
            userId,
            membershipId,
            source: pending.source,
        });
        await logEvent("MEMBERSHIP_GENERATED", normalizedEmail, `Membership ID: ${membershipId}`);

        const fullUser = await loadVerifiedUserSnapshot(userId);

        enqueueJob("CRM_CREATE_DUPLICATE_LEAD", async () => {
            const duplicateLeadId = await createZohoDuplicateLead({
                email: normalizedEmail,
                name: `${fullUser?.first_name || ""} ${fullUser?.last_name || ""}`.trim() || pending.name || undefined,
                phone: fullUser?.phone || pending.phone || undefined,
                company: fullUser?.organization || pending.company || undefined,
                jobTitle: fullUser?.job_title || pending.job_title || undefined,
                industry: fullUser?.industries?.[0] || pending.industry || undefined,
                subIndustry: fullUser?.sub_industries?.[0] || undefined,
                source: "Portal",
                frequency: fullUser?.preferred_frequency || "Daily",
                originalLeadId: fullUser?.crm_lead_id || pending.crm_lead_id || undefined,
                membershipId: fullUser?.membership_id || membershipId,
                communities: fullUser?.communities || [],
                subCommunities: fullUser?.sub_communities || [],
            });

            if (duplicateLeadId) {
                await query(
                    `UPDATE users
                     SET crm_duplicate_lead_id = $1,
                         duplicate_created = true,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [duplicateLeadId, userId]
                );
                log(`Zoho duplicate lead created: ${duplicateLeadId}`);
            }
        }, normalizedEmail);

        enqueueJob("BREVO_SYNC_CONTACT", async () => {
            await syncVerifiedUserToBrevo({
                email: normalizedEmail,
                name: `${fullUser?.first_name || ""} ${fullUser?.last_name || ""}`.trim() || pending.name || undefined,
                phone: fullUser?.phone || pending.phone || undefined,
                company: fullUser?.organization || pending.company || undefined,
                jobTitle: fullUser?.job_title || pending.job_title || undefined,
                membershipId: fullUser?.membership_id || membershipId,
                source: "Portal",
                communities: fullUser?.communities || [],
                subCommunities: fullUser?.sub_communities || [],
            });
            log(`Brevo synced for ${normalizedEmail}`);
        }, normalizedEmail);

        try {
            await sendMembershipWelcomeEmail(
                normalizedEmail,
                pending.name || "Member",
                membershipId
            );
            log(`Welcome email sent to ${normalizedEmail}`);
        } catch (emailErr: unknown) {
            const message = emailErr instanceof Error ? emailErr.message : String(emailErr);
            console.warn(`[VERIFY-OTP:${requestId}] Welcome email failed (non-fatal):`, message);
        }

        return NextResponse.json({
            success: true,
            userId,
            membershipId,
            message: "Verification complete. Welcome to EnergClub!",
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[VERIFY-OTP:${requestId}] Unhandled error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 }
        );
    }
}
