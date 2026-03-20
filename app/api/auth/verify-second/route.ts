import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { verifyOtp } from "@/lib/otp-store";
import { updateVerificationStatus, getVerificationStatus } from "@/lib/queries/users";
import syncUserToBrevo from "@/lib/brevoSync";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { upsertZohoLead, generateCommunityPortal } from "@/lib/zoho-leads";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * POST /api/auth/verify-second
 *
 * Handles the second-step verification during onboarding.
 * If user registered with phone → verifies their email (OTP via Brevo)
 * If user registered with email → verifies their phone (OTP via MSG91)
 *
 * After email verification for phone-first users:
 *  - Replaces the dummy email in Clerk with the real verified one
 *  - Updates DB with real email
 *  - Syncs to Brevo if both verifications complete
 *
 * Body: { type: 'email' | 'phone', value: string, otp: string }
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { type, value, otp } = body;

        if (!type || !value) {
            return NextResponse.json(
                { error: "type and value are required" },
                { status: 400 }
            );
        }

        if (type === "phone") {
            // ── Phone verification via MSG91 OTP ─────────────────────
            if (!otp) {
                return NextResponse.json(
                    { error: "OTP is required for phone verification" },
                    { status: 400 }
                );
            }

            const mobile = value.replace(/[^0-9]/g, "");
            const isValid = verifyOtp(mobile, otp);

            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid or expired OTP" },
                    { status: 400 }
                );
            }

            // Format to E.164
            const e164Phone = mobile.startsWith("91")
                ? `+${mobile}`
                : `+91${mobile}`;

            // Update DB
            await updateVerificationStatus(userId, {
                phoneVerified: true,
                phone: e164Phone,
            });

            // Update Clerk: metadata + actual phone number
            try {
                await clerk.users.updateUser(userId, {
                    publicMetadata: {
                        phone: e164Phone,
                        phoneVerified: true,
                    },
                });

                // Also create the actual phone number in Clerk
                try {
                    const newPhone = await clerk.phoneNumbers.createPhoneNumber({
                        userId,
                        phoneNumber: e164Phone,
                        verified: true,
                        primary: true,
                    });
                    console.log(`[VERIFY_SECOND] Created phone in Clerk: ${e164Phone} (id: ${newPhone.id})`);
                } catch (phoneErr: any) {
                    // Might fail if phone already exists — that's OK
                    if (!phoneErr.message?.includes('already')) {
                        console.warn(`[VERIFY_SECOND] Clerk phone creation failed (non-fatal): ${phoneErr.message}`);
                    }
                }
            } catch (clerkErr: any) {
                console.warn(
                    `[VERIFY_SECOND] Clerk update failed: ${clerkErr.message}`
                );
            }

            console.log(
                `[VERIFY_SECOND] Phone verified for ${userId}: ${e164Phone}`
            );

            // Sync to Brevo + Zoho immediately after phone verification
            await trySyncAfterVerification(userId);

            return NextResponse.json({
                success: true,
                verified: "phone",
            });
        }

        if (type === "email") {
            // ── Email verification via OTP ───────────────────────────
            if (!otp) {
                return NextResponse.json(
                    { error: "OTP is required for email verification" },
                    { status: 400 }
                );
            }

            const email = value.trim().toLowerCase();

            // Reject dummy emails
            if (email.endsWith("@phone.energdive.com")) {
                return NextResponse.json(
                    { error: "Please provide a real email address" },
                    { status: 400 }
                );
            }

            // Verify OTP (keyed by email)
            const isValid = verifyOtp(email, otp);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid or expired OTP" },
                    { status: 400 }
                );
            }

            // ── Replace dummy email in Clerk with verified real email ──
            try {
                const clerkUser = await clerk.users.getUser(userId);

                // 1. Create the real email address in Clerk
                const newEmail = await clerk.emailAddresses.createEmailAddress({
                    userId,
                    emailAddress: email,
                });
                console.log(`[VERIFY_SECOND] Created email in Clerk: ${email} (id: ${newEmail.id})`);

                // 2. Verify it via backend (skip Clerk's verification flow)
                await clerk.emailAddresses.updateEmailAddress(newEmail.id, {
                    verified: true,
                    primary: true,
                });
                console.log(`[VERIFY_SECOND] Set ${email} as primary + verified`);

                // 3. Delete the old dummy email(s)
                for (const existingEmail of clerkUser.emailAddresses) {
                    if (
                        existingEmail.emailAddress.endsWith("@phone.energdive.com") &&
                        existingEmail.id !== newEmail.id
                    ) {
                        try {
                            await clerk.emailAddresses.deleteEmailAddress(existingEmail.id);
                            console.log(`[VERIFY_SECOND] Deleted dummy email: ${existingEmail.emailAddress}`);
                        } catch (delErr: any) {
                            console.warn(`[VERIFY_SECOND] Could not delete dummy email: ${delErr.message}`);
                        }
                    }
                }

                // 4. Update metadata
                await clerk.users.updateUser(userId, {
                    publicMetadata: {
                        verifiedEmail: email,
                        emailVerified: true,
                        isPhoneUser: false, // No longer a phone-only user
                    },
                });
            } catch (clerkErr: any) {
                console.warn(
                    `[VERIFY_SECOND] Clerk email replacement failed: ${clerkErr.message}`
                );
                // Continue — DB update is the source of truth
            }

            // Update DB with the real verified email
            await updateVerificationStatus(userId, {
                emailVerified: true,
                email,
            });

            console.log(
                `[VERIFY_SECOND] Email verified for ${userId}: ${email}`
            );

            // Check if both are now verified → sync to Brevo
            await trySyncAfterVerification(userId);

            return NextResponse.json({
                success: true,
                verified: "email",
            });
        }

        return NextResponse.json(
            { error: 'Invalid type. Must be "email" or "phone"' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("[VERIFY_SECOND] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * After a verification step completes, check if both email and phone
 * are now verified. If so, sync user data to Brevo and Zoho immediately.
 */
async function trySyncAfterVerification(clerkId: string) {
    try {
        const status = await getVerificationStatus(clerkId);
        if (!status) return;

        const bothVerified = status.email_verified && status.phone_verified;
        const isDummy = status.email?.endsWith("@phone.energdive.com");

        if (bothVerified && !isDummy) {
            const fullUser = await getFullUserProfile(clerkId);
            if (!fullUser) return;

            // Read UTM data from users table
            const { query } = await import("@/lib/db");
            let utmData: Record<string, string | null> = {};
            try {
                const utmResult = await query(
                    `SELECT utm_source, utm_medium, utm_campaign, utm_term, utm_content FROM users WHERE clerk_id = $1 LIMIT 1`,
                    [clerkId]
                );
                if (utmResult.rows.length > 0) {
                    utmData = utmResult.rows[0];
                }
            } catch (_) { /* non-fatal */ }

            // Sync to Brevo
            try {
                await syncUserToBrevo({
                    ...fullUser,
                    utm_source: utmData.utm_source,
                    utm_medium: utmData.utm_medium,
                    utm_campaign: utmData.utm_campaign,
                    utm_term: utmData.utm_term,
                    utm_content: utmData.utm_content,
                });
                console.log(`[VERIFY_SECOND] ✅ Synced to Brevo: ${status.email}`);
            } catch (brevoErr: any) {
                console.warn(`[VERIFY_SECOND] Brevo sync failed (non-fatal): ${brevoErr.message}`);
            }

            // Sync to Zoho
            try {
                const toArray = (arr: any[] | undefined) => {
                    if (!arr) return undefined;
                    const filtered = arr.filter((v: any) => v !== null && v !== undefined && v !== '');
                    return filtered.length > 0 ? filtered : undefined;
                };

                const leadData = {
                    First_Name: fullUser.first_name || "Unknown",
                    Last_Name: fullUser.last_name || "Unknown",
                    Email: fullUser.email,
                    Phone: fullUser.phone || undefined,
                    Mobile: fullUser.phone || undefined,
                    Company: fullUser.organization || undefined,
                    Designation: fullUser.job_title || undefined,
                    Lead_Source: "Website Registration",
                    Industry: fullUser.industries?.find((i: string | null) => !!i) || undefined,
                    Industry_Sub_Category: fullUser.sub_industries?.find((i: string | null) => !!i) || undefined,
                    Community: toArray(fullUser.communities),
                    Sub_Community: toArray(fullUser.sub_communities),
                    Community_Portal: (() => {
                        const comms = toArray(fullUser.communities);
                        const subs = toArray(fullUser.sub_communities);
                        if (comms && subs) {
                            return generateCommunityPortal(comms, subs);
                        }
                        return undefined;
                    })(),
                    Invite_Source: "EnergClub",
                    City: fullUser.state || undefined,
                    Country: fullUser.country || undefined,
                    UTM_Source: utmData.utm_source || undefined,
                    UTM_Medium: utmData.utm_medium || undefined,
                    UTM_Campaign: utmData.utm_campaign || undefined,
                    UTM_Term: utmData.utm_term || undefined,
                    UTM_Content: utmData.utm_content || undefined,
                };

                await upsertZohoLead(leadData);
                console.log(`[VERIFY_SECOND] ✅ Synced to Zoho: ${status.email}`);
            } catch (zohoErr: any) {
                console.warn(`[VERIFY_SECOND] Zoho sync failed (non-fatal): ${zohoErr.message}`);
            }
        } else {
            console.log(`[VERIFY_SECOND] Not ready for external sync — email_verified=${status.email_verified}, phone_verified=${status.phone_verified}, isDummy=${isDummy}`);
        }
    } catch (err: any) {
        console.warn(`[VERIFY_SECOND] Sync attempt failed (non-fatal): ${err.message}`);
    }
}

