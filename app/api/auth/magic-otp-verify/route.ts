import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserByInternalId } from "@/lib/queries/users";
import { syncVerifiedUserToBrevo } from "@/lib/brevoSync";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { upsertZohoLead } from "@/lib/zoho-leads";
import { query } from "@/lib/db";
import { logEvent } from "@/lib/system-logger";

/**
 * POST /api/auth/magic-otp-verify
 *
 * Step 2 of the Portal-Access flow (Magic Link → Email OTP).
 * Called from /verify-access after the user enters their OTP.
 *
 * On success:
 *   1. Verifies the in-memory OTP (keyed by email).
 *   2. Marks the user as verified in the DB (verification_status = 'verified').
 *      This triggers the DB trigger that auto-assigns membership_id.
 *   3. Creates a Clerk sign-in ticket so the browser can establish a session.
 *   4. Syncs the fully-enriched user profile to Brevo (Community, Sub-Community,
 *      Phone, Job Title, Industry, Membership ID, etc.).
 *   5. Updates the existing Zoho CRM lead (created by the form) with the enriched
 *      community and profile data.
 *
 * Body: { email: string, otp: string, userId: number }
 */
export async function POST(req: Request) {
    const requestId = Math.random().toString(36).slice(2, 8);
    const log = (msg: string) => console.log(`[MAGIC-OTP-VERIFY:${requestId}] ${msg}`);

    try {
        const { email, otp, userId } = await req.json();

        if (!email || !otp || !userId) {
            return NextResponse.json(
                { error: "email, otp, and userId are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        log(`Verifying OTP for: ${normalizedEmail}, userId: ${userId}`);

        // ── Step 1: Verify OTP (keyed by email, in-memory store) ─────────────
        const isValid = verifyOtp(normalizedEmail, otp);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid or expired OTP. Please request a new code." },
                { status: 400 }
            );
        }

        log(`OTP verified for: ${normalizedEmail}`);

        // ── Step 2: Look up the user record ───────────────────────────────────
        const user = await getUserByInternalId(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // ── Step 3: Mark user as verified in DB ───────────────────────────────
        // This is the gating event. The DB trigger (trg_assign_membership_id)
        // fires on this UPDATE and auto-assigns the ENCL-STN-xxx membership_id
        // when verification_status transitions to 'verified'.
        await query(
            `UPDATE users
             SET verification_status = 'verified',
                 email_verified      = true,
                 updated_at          = NOW()
             WHERE id = $1
               AND (verification_status IS NULL OR verification_status <> 'verified')`,
            [userId]
        );

        log(`User marked as verified in DB: id=${userId}`);

        await logEvent(
            "USER_VERIFIED",
            normalizedEmail,
            `Email OTP verified via magic-link flow`,
            { userId, source: "portal_access" }
        );

        // ── Step 4: Create Clerk sign-in ticket ───────────────────────────────
        const client = await clerkClient();
        const signInToken = await client.signInTokens.createSignInToken({
            userId: user.clerk_id,
            expiresInSeconds: 300,
        });

        log(`Clerk sign-in ticket created for ${user.email}`);

        // ── Step 5: Fetch the fully-enriched profile (AFTER verification) ─────
        // getFullUserProfile joins user_communities and user_industries, so it
        // returns the Community, Sub-Community, Industry, etc. that were stored
        // by provisionUser() during the /api/zoho/provision call.
        const fullUser = await getFullUserProfile(user.clerk_id);

        if (!fullUser || normalizedEmail.endsWith("@phone.energdive.com")) {
            log(`Skipping external sync — no profile or dummy email`);
            return NextResponse.json({ success: true, ticket: signInToken.token });
        }

        // Helper: filter null/undefined/empty strings from array fields
        const toCleanArray = (arr: Array<string | null> | undefined): string[] => {
            if (!arr) return [];
            return arr.filter((v): v is string => !!v && v.trim() !== "");
        };

        const communities = toCleanArray(fullUser.communities);
        const subCommunities = toCleanArray(fullUser.sub_communities);
        const industries = toCleanArray(fullUser.industries);
        const subIndustries = toCleanArray(fullUser.sub_industries);

        // Reload membership_id — the DB trigger may have just assigned it
        const membershipResult = await query(
            `SELECT membership_id FROM users WHERE id = $1 LIMIT 1`,
            [userId]
        );
        const membershipId = membershipResult.rows[0]?.membership_id || undefined;

        log(`Enriched profile: communities=[${communities}], subs=[${subCommunities}], phone=${fullUser.phone}, membership=${membershipId}`);

        // ── Step 6: Sync to Brevo with all enriched fields ────────────────────
        // Uses syncVerifiedUserToBrevo which maps all fields including
        // COMMUNITY, SUB_COMMUNITY, PHONE, JOB_TITLE, MEMBERSHIP_ID.
        try {
            await syncVerifiedUserToBrevo({
                email: normalizedEmail,
                name: [fullUser.first_name, fullUser.last_name].filter(Boolean).join(" ") || undefined,
                phone: fullUser.phone || undefined,
                company: fullUser.organization || undefined,
                jobTitle: fullUser.job_title || undefined,
                membershipId,
                source: "Portal",
                communities,
                subCommunities,
            });

            log(`✅ Synced to Brevo: ${normalizedEmail}`);
            await logEvent("BREVO_SYNC_SUCCESS", normalizedEmail, "Synced after email OTP verification");
        } catch (brevoErr: any) {
            // Non-fatal — user can still sign in
            console.error(`[MAGIC-OTP-VERIFY:${requestId}] Brevo sync failed:`, brevoErr.message);
            await logEvent("BREVO_SYNC_FAILED", normalizedEmail, `Brevo sync failed: ${brevoErr.message}`);
        }

        // ── Step 7: Update Zoho CRM lead with enriched data ───────────────────
        // The CRM lead was already created by the Zoho Form → default integration.
        // We UPDATE (upsert) it here with community, sub-community, phone, and
        // industry data that is now available post-verification.
        // This replaces the previous approach of creating a duplicate blank lead.
        try {
            const nameParts = [fullUser.first_name, fullUser.last_name].filter(Boolean);

            const zohoLeadData = {
                First_Name: nameParts[0] || "",
                Last_Name: nameParts[1] || nameParts[0] || "",
                Email: normalizedEmail,
                Phone: fullUser.phone || undefined,
                Mobile: fullUser.phone || undefined,
                Company: fullUser.organization || undefined,
                Designation: fullUser.job_title || undefined,
                Lead_Source: "Portal Verified",
                Industry: industries[0] || undefined,
                Industry_Sub_Category: subIndustries[0] || undefined,
                // Community_Portal drives the split into Community + Sub_Community
                // in upsertZohoLead via the bidirectional parsing logic.
                Community: communities.length > 0 ? communities : undefined,
                Sub_Community: subCommunities.length > 0 ? subCommunities : undefined,
                Invite_Source: "EnergClub",
                City: fullUser.state || undefined,
                Country: fullUser.country || undefined,
            };

            const zohoResult = await upsertZohoLead(zohoLeadData);

            // Store the CRM lead ID back on the user row
            await query(
                `UPDATE users
                 SET crm_lead_id = COALESCE(crm_lead_id, $2),
                     sync_status = 'complete',
                     crm_synced_at = NOW(),
                     updated_at  = NOW()
                 WHERE id = $1`,
                [userId, zohoResult.id]
            );

            log(`✅ CRM lead ${zohoResult.action}: ${zohoResult.id}`);
            await logEvent("CRM_SYNC_SUCCESS", normalizedEmail, `CRM lead ${zohoResult.action}: ${zohoResult.id}`);
        } catch (crmErr: any) {
            // Non-fatal — Brevo sync succeeded, user can still sign in
            console.error(`[MAGIC-OTP-VERIFY:${requestId}] CRM sync failed:`, crmErr.message);
            await logEvent("CRM_SYNC_FAILED", normalizedEmail, `CRM sync failed: ${crmErr.message}`);
        }

        return NextResponse.json({
            success: true,
            ticket: signInToken.token,
        });
    } catch (error: any) {
        console.error(`[MAGIC-OTP-VERIFY:${requestId}] Unhandled error:`, error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}