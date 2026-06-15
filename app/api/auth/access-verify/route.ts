import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserByMagicToken, clearMagicToken } from "@/lib/queries";
import { query } from "@/lib/db";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { createZohoLead, generateCommunityPortal } from "@/lib/zoho-leads";
import { logEvent } from "@/lib/system-logger";

/**
 * GET /api/auth/access-verify?token=XXXX
 *
 * Verifies a magic token from the provisioning pipeline:
 * 1. Looks up token in DB (must exist and not be expired)
 * 2. Clears token (one-time use)
 * 3. For CRM-invited users (source = 'crm_invite'):
 *    - Auto-verifies the user (sets verification_status = 'verified')
 *    - Creates Clerk sign-in ticket for instant login
 *    - Creates duplicate CRM lead + syncs to Brevo (non-blocking)
 *    - Returns { success, ticket, isCrmInvite: true }
 * 4. For other users:
 *    - Returns user info for OTP verification step
 */
export async function GET(req: NextRequest) {
    const requestId = Math.random().toString(36).slice(2, 8);
    const log = (msg: string) => console.log(`[ACCESS_VERIFY:${requestId}] ${msg}`);

    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json(
            { error: "Missing token parameter" },
            { status: 400 }
        );
    }

    try {
        // 1. Look up user by magic token
        const user = await getUserByMagicToken(token);

        if (!user) {
            console.warn(`[ACCESS_VERIFY] Invalid or expired token`);
            return NextResponse.json(
                { error: "Invalid or expired access link" },
                { status: 401 }
            );
        }

        log(`Token valid for user: ${user.email} (clerk: ${user.clerk_id})`);

        // 2. Clear the token (one-time use)
        await clearMagicToken(user.id);

        // 3. Check if this is a CRM-invited user
        const sourceResult = await query(
            `SELECT source, phone, crm_lead_id FROM users WHERE id = $1 LIMIT 1`,
            [user.id]
        );
        const userRow = sourceResult.rows[0];
        const isCrmInvite = userRow?.source === "crm_invite";

        if (isCrmInvite) {
            // ── CRM-INVITE FAST PATH ──────────────────────────────────────
            // Skip OTP + onboarding. Auto-verify, create session, sync externally.
            log(`CRM-invited user detected — entering fast path`);

            // 3a. Mark user as verified in DB
            //     This triggers the Postgres BEFORE trigger (trg_assign_membership_id)
            //     which auto-assigns ENCL-STN-xxx membership_id.
            await query(
                `UPDATE users
                 SET verification_status = 'verified',
                     email_verified      = true,
                     updated_at          = NOW()
                 WHERE id = $1
                   AND (verification_status IS NULL OR verification_status <> 'verified')`,
                [user.id]
            );
            log(`User auto-verified: id=${user.id}`);

            // 3b. Reload membership_id (the trigger may have just assigned it)
            const membershipResult = await query(
                `SELECT membership_id, phone, organization, job_title, country, state,
                        first_name, last_name, crm_lead_id
                 FROM users WHERE id = $1 LIMIT 1`,
                [user.id]
            );
            const memberRow = membershipResult.rows[0];
            const membershipId = memberRow?.membership_id || undefined;
            const userPhone = memberRow?.phone || null;

            log(`Membership ID assigned: ${membershipId}`);

            // 3c. Create Clerk sign-in ticket
            const client = await clerkClient();
            const signInToken = await client.signInTokens.createSignInToken({
                userId: user.clerk_id,
                expiresInSeconds: 300,
            });
            log(`Clerk sign-in ticket created for ${user.email}`);

            await logEvent(
                "USER_VERIFIED",
                user.email,
                `CRM-invited user auto-verified via magic-link (no OTP)`,
                { userId: user.id, source: "crm_invite" }
            );

            // 3d. Fetch full profile for external syncs
            const fullUser = await getFullUserProfile(user.clerk_id);

            // Helper: filter null/undefined/empty strings from array fields
            const toCleanArray = (arr: Array<string | null> | undefined): string[] => {
                if (!arr) return [];
                return arr.filter((v): v is string => !!v && v.trim() !== "" && v.trim() !== "undefined" && v.trim() !== "null");
            };

            const communities = toCleanArray(fullUser?.communities);
            const subCommunities = toCleanArray(fullUser?.sub_communities);
            const industries = toCleanArray(fullUser?.industries);
            const subIndustries = toCleanArray(fullUser?.sub_industries);

            // 3e. Sync to Brevo (non-fatal)
            try {
                const cleanString = (s: string | null | undefined) => s && s !== "undefined" && s !== "null" ? s : undefined;

                await syncVerifiedUserToBrevo({
                    email: user.email,
                    name: cleanString([fullUser?.first_name, fullUser?.last_name].filter(Boolean).join(" ")),
                    phone: cleanString(userPhone),
                    company: cleanString(fullUser?.organization),
                    jobTitle: cleanString(fullUser?.job_title),
                    membershipId,
                    source: "Portal",
                    communities,
                    subCommunities,
                    industries,
                    subIndustries,
                });
                log(`✅ Synced to Brevo: ${user.email}`);
                await logEvent("BREVO_SYNC_SUCCESS", user.email, "Synced after CRM-invite auto-verification");
            } catch (brevoErr: any) {
                console.error(`[ACCESS_VERIFY:${requestId}] Brevo sync failed:`, brevoErr.message);
                await logEvent("BREVO_SYNC_FAILED", user.email, `Brevo sync failed: ${brevoErr.message}`);
            }

            // 3f. Create duplicate ENERGDive CRM lead (non-fatal)
            try {
                const zohoLeadData: any = {
                    First_Name: fullUser?.first_name || user.first_name || "",
                    Last_Name: fullUser?.last_name || user.last_name || "",
                    Email: user.email,
                    Phone: userPhone || undefined,
                    Mobile: userPhone || undefined,
                    Company: fullUser?.organization || undefined,
                    Designation: fullUser?.job_title || undefined,
                    Lead_Source: "ENDV Portal CRM Lead",
                    Industry: industries[0] || undefined,
                    Industry_Sub_Category: subIndustries[0] || undefined,
                    Community: communities.length > 0 ? communities : undefined,
                    Sub_Community: subCommunities.length > 0 ? subCommunities : undefined,
                    Invite_Source: "EnergClub",
                    Country: fullUser?.country || undefined,
                    City: fullUser?.state || undefined,
                };

                // Generate Community_Portal from communities + sub-communities
                if (communities.length > 0 && subCommunities.length > 0) {
                    zohoLeadData.Community_Portal = generateCommunityPortal(communities, subCommunities);
                }

                zohoLeadData.Owner = process.env.ZOHO_ITEN_MEDIA_OWNER_ID || "651593000000305001";

                const zohoResult = await createZohoLead(zohoLeadData);

                // Store the new duplicate CRM lead ID on the user row
                await query(
                    `UPDATE users
                     SET crm_duplicate_lead_id = $2,
                         crm_duplicate_id      = $2,
                         duplicate_created      = true,
                         updated_at             = NOW()
                     WHERE id = $1`,
                    [user.id, zohoResult.id]
                );

                log(`✅ CRM duplicate lead ${zohoResult.action}: ${zohoResult.id}`);
                await logEvent("CRM_SYNC_SUCCESS", user.email, `CRM duplicate lead ${zohoResult.action}: ${zohoResult.id}`);
            } catch (crmErr: any) {
                console.error(`[ACCESS_VERIFY:${requestId}] CRM sync failed:`, crmErr.message);
                await logEvent("CRM_SYNC_FAILED", user.email, `CRM sync failed: ${crmErr.message}`);
            }

            // 3g. Return sign-in ticket for instant login
            return NextResponse.json({
                success: true,
                ticket: signInToken.token,
                isCrmInvite: true,
                userId: user.id,
                email: user.email,
                firstName: user.first_name,
                membershipId,
            });
        }

        // ── STANDARD PATH (self-signup / form users) ──────────────────
        // Return user info for OTP verification step (no sign-in token yet)
        const phone = userRow?.phone || null;

        return NextResponse.json({
            success: true,
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            phone,
        });
    } catch (error: any) {
        console.error("[ACCESS_VERIFY] Error:", error);
        return NextResponse.json(
            { error: "Verification failed", details: error.message },
            { status: 500 }
        );
    }
}
