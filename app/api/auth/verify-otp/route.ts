import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { markTokenUsed } from "@/lib/magic-link-db";
import { query, getClient } from "@/lib/db";
import { createZohoDuplicateLead } from "@/lib/zoho-leads";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { sendMembershipWelcomeCardEmail } from "@/lib/email";
import { logEvent } from "@/lib/system-logger";
import { logConsent, extractIpAddress } from "@/lib/consent-logger";
import { resolveDataSource } from "@/lib/data-provenance";
import { issueMagicToken } from "@/lib/queries";

type PendingVerification = {
    id: number;
    email: string;
    name: string | null;
    phone: string | null;
    company: string | null;
    source: string | null;
    crm_lead_id: string | null;
    verification_status: string;
    communities: unknown;
    sub_communities: unknown;
};

function toStringArray(value: unknown): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item).trim()).filter(Boolean);
            }
        } catch {
            // Fall through to delimiter parsing.
        }

        return trimmed
            .split(/[;,]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function normalizeSubCommunityName(community: string, subCommunity: string): string[] {
    const cleanCommunity = community.trim();
    const cleanSubCommunity = subCommunity.trim();

    const candidates = new Set<string>([
        cleanSubCommunity,
        `${cleanCommunity}-${cleanSubCommunity}`,
    ]);

    const strippedSub = cleanSubCommunity.includes("-")
        ? cleanSubCommunity.split("-").slice(1).join("-").trim()
        : cleanSubCommunity;

    if (strippedSub) {
        candidates.add(strippedSub);
        candidates.add(`${cleanCommunity}-${strippedSub}`);
    }

    return Array.from(candidates).filter(Boolean);
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
          u.clerk_id,
          u.email,
          u.first_name,
          u.last_name,
          u.created_at,
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
                    verification_status, communities, sub_communities
             FROM pending_verifications
             WHERE LOWER(email) = LOWER($1)
             ORDER BY id DESC
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

        const client = await getClient();
        let userId: number;
        let membershipId: string;

        try {
            await client.query("BEGIN");

            const nameParts = (pending.name || "").trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            const existingUserResult = await client.query(
                `SELECT id, membership_id
                 FROM users
                 WHERE LOWER(email) = LOWER($1)
                 ORDER BY
                   CASE WHEN source = 'zoho_form' THEN 0 ELSE 1 END,
                   updated_at DESC NULLS LAST,
                   id DESC
                 LIMIT 1
                 FOR UPDATE`,
                [normalizedEmail]
            );

            if (existingUserResult.rows.length > 0) {
                userId = existingUserResult.rows[0].id;
                membershipId = existingUserResult.rows[0].membership_id;

                const updateResult = await client.query(
                    `UPDATE users
                     SET first_name = COALESCE(NULLIF($2, ''), first_name),
                         last_name = COALESCE(NULLIF($3, ''), last_name),
                         phone = COALESCE(NULLIF($4, ''), phone),
                         organization = COALESCE(NULLIF($5, ''), organization),
                         source = COALESCE($6, source),
                         crm_lead_id = COALESCE($7, crm_lead_id),
                         verification_status = 'verified',
                         onboarding_completed = true,
                         updated_at = NOW()
                     WHERE id = $1
                     RETURNING membership_id`,
                    [
                        userId,
                        firstName,
                        lastName,
                        pending.phone || "",
                        pending.company || "",
                        pending.source || "zoho_form",
                        pending.crm_lead_id,
                    ]
                );

                membershipId = updateResult.rows[0]?.membership_id || membershipId;
            } else {
                const insertResult = await client.query(
                    `INSERT INTO users (
                       email, first_name, last_name, phone, organization,
                       source, crm_lead_id, verification_status,
                       onboarding_completed, created_at, updated_at
                     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'verified',true,NOW(),NOW())
                     RETURNING id, membership_id`,
                    [
                        normalizedEmail,
                        firstName,
                        lastName,
                        pending.phone || null,
                        pending.company || null,
                        pending.source || "zoho_form",
                        pending.crm_lead_id || null,
                    ]
                );

                userId = insertResult.rows[0].id;
                membershipId = insertResult.rows[0].membership_id;
            }

            membershipId = await ensureMembershipId(client, userId);

            await client.query(
                `UPDATE pending_verifications
                 SET verification_status = 'verified',
                     otp_verified = true,
                     verified_at = NOW(),
                     user_id = $1,
                     updated_at = NOW()
                 WHERE id = $2`,
                [userId, pending.id]
            );

            const communities = toStringArray(pending.communities);
            const subCommunities = toStringArray(pending.sub_communities);

            if (communities.length > 0) {
                await client.query(`DELETE FROM user_communities WHERE user_id = $1`, [userId]);

                const insertedPairs = new Set<string>();

                for (const communityName of communities) {
                    const communityResult = await client.query(
                        `SELECT id, name
                         FROM communities
                         WHERE LOWER(name) = LOWER($1)
                         LIMIT 1`,
                        [communityName]
                    );

                    if (communityResult.rows.length === 0) {
                        continue;
                    }

                    const communityId = communityResult.rows[0].id;
                    const subCandidates = subCommunities.flatMap((subCommunity) =>
                        normalizeSubCommunityName(communityName, subCommunity)
                    );

                    let matchedSub = false;

                    for (const candidate of subCandidates) {
                        const subResult = await client.query(
                            `SELECT id
                             FROM sub_communities
                             WHERE community_id = $1
                               AND LOWER(name) = LOWER($2)
                             LIMIT 1`,
                            [communityId, candidate]
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
                        matchedSub = true;
                    }

                    if (!matchedSub) {
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
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        await markTokenUsed(pending.id);

        await logEvent("USER_VERIFIED", normalizedEmail, `User verified, membership_id=${membershipId}`, {
            userId,
            membershipId,
            source: pending.source,
        });

        // ── Log consent (DPDP compliance) ────────────────────────────
        const clientIp = extractIpAddress(req);
        const dataSource = resolveDataSource(pending.source);
        try {
            await logConsent({
                userId,
                email: normalizedEmail,
                source: dataSource,
                optInMethod: "double_optin",
                ipAddress: clientIp,
                consentPurpose: "registration",
                metadata: {
                    pendingVerificationId: pending.id,
                    membershipId,
                    originalSource: pending.source,
                },
            });

            // Update user consent provenance columns
            try {
                await query(
                    `UPDATE users SET
                        consent_version = $2,
                        consent_timestamp = NOW(),
                        ip_address_at_consent = $3,
                        data_source = $4,
                        updated_at = NOW()
                     WHERE id = $1`,
                    [userId, "v2.1_T&C_Mar2026", clientIp, dataSource]
                );
            } catch { /* non-fatal */ }

            log(`Consent logged for: ${normalizedEmail}`);
        } catch (consentErr: unknown) {
            const msg = consentErr instanceof Error ? consentErr.message : String(consentErr);
            console.warn(`[VERIFY-OTP:${requestId}] Consent log failed (non-fatal):`, msg);
        }

        const fullUser = await loadVerifiedUserSnapshot(userId);
        const { token: accessToken } = await issueMagicToken(userId);

        // Fetch UTMs from pending_verifications or users table
        let pvUtmSource: string | undefined;
        let pvUtmMedium: string | undefined;
        let pvUtmCampaign: string | undefined;
        let pvUtmTerm: string | undefined;
        let pvUtmContent: string | undefined;
        try {
            const pvUtms = await query(
                `SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content
                 FROM pending_verifications WHERE LOWER(email) = LOWER($1)
                 ORDER BY id DESC LIMIT 1`,
                [normalizedEmail]
            );
            if (pvUtms.rows.length > 0) {
                pvUtmSource = pvUtms.rows[0].utm_source || undefined;
                pvUtmMedium = pvUtms.rows[0].utm_medium || undefined;
                pvUtmCampaign = pvUtms.rows[0].utm_campaign || undefined;
                pvUtmTerm = pvUtms.rows[0].utm_term || undefined;
                pvUtmContent = pvUtms.rows[0].utm_content || undefined;
            }
        } catch { /* non-fatal */ }

        try {
            await syncVerifiedUserToBrevo({
                email: normalizedEmail,
                name: `${fullUser?.first_name || ""} ${fullUser?.last_name || ""}`.trim() || pending.name || undefined,
                phone: fullUser?.phone || pending.phone || undefined,
                company: fullUser?.organization || pending.company || undefined,
                jobTitle: fullUser?.job_title || undefined,
                membershipId: fullUser?.membership_id || membershipId,
                source: "Portal",
                communities: fullUser?.communities || [],
                subCommunities: fullUser?.sub_communities || [],
                utm_source: pvUtmSource,
                utm_medium: pvUtmMedium,
                utm_campaign: pvUtmCampaign,
                utm_term: pvUtmTerm,
                utm_content: pvUtmContent,
            });
        } catch (brevoError: unknown) {
            const message = brevoError instanceof Error ? brevoError.message : String(brevoError);
            console.warn(`[VERIFY-OTP:${requestId}] Brevo sync failed:`, message);
        }

        // Fetch from Brevo to ensure we have the latest enriched data
        let brevoData: Record<string, string | undefined> | null = null;
        try {
            const { getBrevoContact } = await import("@/lib/brevoSync");
            brevoData = await getBrevoContact(normalizedEmail);
        } catch (brevoLookupError: unknown) {
            console.warn(`[VERIFY-OTP:${requestId}] Could not fetch Brevo contact`, brevoLookupError);
        }

        const bCommunities = brevoData?.COMMUNITY ? brevoData.COMMUNITY.split(",").map((s: string) => s.trim()).filter(Boolean) : fullUser?.communities || [];
        const bSubCommunities = brevoData?.SUB_COMMUNITY ? brevoData.SUB_COMMUNITY.split(",").map((s: string) => s.trim()).filter(Boolean) : fullUser?.sub_communities || [];
        const bName = brevoData?.FIRSTNAME ? `${brevoData.FIRSTNAME} ${brevoData.LASTNAME || ""}`.trim() : (`${fullUser?.first_name || ""} ${fullUser?.last_name || ""}`.trim() || pending.name || undefined);

        try {
            const duplicateLeadId = await createZohoDuplicateLead({
                email: normalizedEmail,
                name: bName,
                phone: brevoData?.PHONE || fullUser?.phone || pending.phone || undefined,
                company: brevoData?.ORGANISATION || fullUser?.organization || pending.company || undefined,
                jobTitle: brevoData?.JOB_TITLE || fullUser?.job_title || undefined,
                industry: brevoData?.INDUSTRY || fullUser?.industries?.[0] || undefined,
                subIndustry: brevoData?.SUB_INDUSTRY || fullUser?.sub_industries?.[0] || undefined,
                source: "Portal",
                frequency: fullUser?.preferred_frequency || "Daily",
                originalLeadId: fullUser?.crm_lead_id || pending.crm_lead_id || undefined,
                membershipId: fullUser?.membership_id || membershipId,
                communities: bCommunities,
                subCommunities: bSubCommunities,
                utm_source: brevoData?.UTM_SOURCE || pvUtmSource,
                utm_medium: brevoData?.UTM_MEDIUM || pvUtmMedium,
                utm_campaign: brevoData?.UTM_CAMPAIGN || pvUtmCampaign,
                utm_term: brevoData?.UTM_TERM || pvUtmTerm,
                utm_content: brevoData?.UTM_CONTENT || pvUtmContent,
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
            }
        } catch (crmError: unknown) {
            const message = crmError instanceof Error ? crmError.message : String(crmError);
            console.warn(`[VERIFY-OTP:${requestId}] CRM duplicate lead sync failed:`, message);
        }

        try {
            const primaryCommunity =
                bSubCommunities[0] ||
                bCommunities[0] ||
                fullUser?.sub_communities?.[0] ||
                fullUser?.communities?.[0] ||
                null;

            await sendMembershipWelcomeCardEmail(
                normalizedEmail,
                pending.name || "Member",
                membershipId,
                {
                    company: brevoData?.ORGANISATION || fullUser?.organization || pending.company || null,
                    community: primaryCommunity,
                    joinedAt: fullUser?.created_at || new Date(),
                    accessToken,
                }
            );
        } catch (emailError: unknown) {
            const message = emailError instanceof Error ? emailError.message : String(emailError);
            console.warn(`[VERIFY-OTP:${requestId}] Welcome email failed:`, message);
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
