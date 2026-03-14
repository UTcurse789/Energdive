import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveOnboardingProfile } from "@/lib/queries";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { query } from "@/lib/db";
import syncUserToBrevo from "@/lib/brevoSync";
import { sendWelcomeEmail, sendNewUserNotification } from "@/lib/email";
import { upsertZohoLead } from "@/lib/zoho-leads";

/**
 * POST /api/onboarding/submit
 * Atomically saves user profile + community/industry mappings.
 * Marks onboarding as complete in both the DB and Clerk metadata.
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

        // ── Server-side validation ──────────────────────────────────
        if (!body.firstName || !body.lastName || !body.email) {
            return NextResponse.json(
                { error: "firstName, lastName, and email are required" },
                { status: 400 }
            );
        }
        if (!body.industryId || !body.subIndustryId) {
            return NextResponse.json(
                { error: "industryId and subIndustryId are required" },
                { status: 400 }
            );
        }
        if (
            !Array.isArray(body.communitySelections) ||
            body.communitySelections.length === 0
        ) {
            return NextResponse.json(
                { error: "At least one community selection is required" },
                { status: 400 }
            );
        }

        // ── Resolve phone: prefer Clerk metadata (from verify-second) over body ──
        let resolvedPhone = body.phone?.trim() || null;
        try {
            const clerkUser = await (await clerkClient()).users.getUser(userId);
            const metaPhone = (clerkUser.publicMetadata as any)?.phone as string | undefined;
            if (metaPhone && !resolvedPhone) {
                resolvedPhone = metaPhone;
                console.log(`[ONBOARDING] Recovered phone from Clerk metadata: ${resolvedPhone}`);
            }
        } catch (_) { /* non-fatal */ }

        // ── Save to DB (atomic transaction) ─────────────────────────
        // saveOnboardingProfile also sets verification_status='verified' and
        // triggers membership_id auto-assignment via DB trigger.
        const dbUserId = await saveOnboardingProfile({
            clerkId: userId,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: resolvedPhone,
            country: body.country,
            state: body.state,
            jobTitle: body.jobTitle,
            organization: body.organization,
            industryId: body.industryId,
            subIndustryId: body.subIndustryId,
            communitySelections: body.communitySelections,
            preferredFrequency: body.preferredFrequency,
            preferredFormats: body.preferredFormats,
        });

        await (await clerkClient()).users.updateUser(userId, {
            firstName: body.firstName,
            lastName: body.lastName,
            publicMetadata: {
                onboarding_completed: true,
                ...(resolvedPhone ? { phone: resolvedPhone } : {}),
            },
        });

        // ── Fetch FULL profile ─────────────────────────────
        const fullUser = await getFullUserProfile(userId);

        // ── Resolve real email (phone-first users have dummy @phone.energdive.com) ──
        const dbEmailIsDummy = fullUser.email?.endsWith('@phone.energdive.com');
        let syncEmail = fullUser.email;

        if (dbEmailIsDummy) {
            // Try body.email first (the real email user typed in onboarding form)
            // Then try Clerk's current primary email (verify-second may have replaced dummy)
            const bodyEmail = body.email?.trim();
            if (bodyEmail && !bodyEmail.endsWith('@phone.energdive.com')) {
                syncEmail = bodyEmail;
            } else {
                try {
                    const clerkUser = await (await clerkClient()).users.getUser(userId);
                    const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
                    if (clerkEmail && !clerkEmail.endsWith('@phone.energdive.com')) {
                        syncEmail = clerkEmail;
                    }
                } catch (_) { /* non-fatal */ }
            }

            // Update DB email from dummy → real
            if (syncEmail !== fullUser.email) {
                try {
                    await query(
                        `UPDATE users SET email = $2 WHERE clerk_id = $1`,
                        [userId, syncEmail]
                    );
                    console.log(`[ONBOARDING] Replaced dummy email with real: ${syncEmail}`);
                    fullUser.email = syncEmail; // update in-memory too
                } catch (_) { /* non-fatal */ }
            }
        }

        const isDummyEmail = syncEmail?.endsWith('@phone.energdive.com');
        const canSyncExternally = !isDummyEmail;


        if (!canSyncExternally) {
            console.warn(`[ONBOARDING] Skipping Brevo/Zoho sync — dummy email detected: ${syncEmail}`);
        } else {
            console.log(`[ONBOARDING] Syncing to external systems for: ${syncEmail}`);
        }

        // ── Sync to Brevo (only if real email) ──────────────────────
        if (canSyncExternally) {
            console.log("📋 Brevo sync payload:", {
                email: syncEmail,
                preferred_frequency: fullUser.preferred_frequency,
                preferred_formats: fullUser.preferred_formats,
            });
            await syncUserToBrevo({ ...fullUser, email: syncEmail });
            console.log("✅ Full profile synced to Brevo");
        }

        // ── Send Welcome Email (only if real email) ────────────────
        if (!isDummyEmail) {
            try {
                await sendWelcomeEmail(
                    syncEmail,
                    fullUser.first_name || body.firstName,
                    fullUser.preferred_frequency || body.preferredFrequency,
                    fullUser.preferred_formats || body.preferredFormats
                );
                console.log("✅ Welcome email sent to:", syncEmail);
            } catch (emailErr) {
                // Non-fatal — don't block onboarding if email fails
                console.error("⚠️ Welcome email failed:", emailErr);
            }
        }

        // ── Sync to Zoho CRM as Lead (only if real email) ─────────
        if (canSyncExternally) {
            try {
                // Helper: return non-empty array or undefined
                const toArray = (arr: any[] | undefined) => {
                    if (!arr) return undefined;
                    const filtered = arr.filter((v: any) => v !== null && v !== undefined && v !== '');
                    return filtered.length > 0 ? filtered : undefined;
                };

                // DB sub_communities are in "Community-SubPart" format (e.g. "Distribution-Data Centres")
                // which is the Community_Portal format. Pass them as Community_Portal and let
                // upsertZohoLead's parseCommunityPortal derive Community/Sub_Community correctly.
                const phone = fullUser.phone || resolvedPhone || body.phone || undefined;
                const leadData = {
                    First_Name: fullUser.first_name || body.firstName,
                    Last_Name: fullUser.last_name || body.lastName,
                    Email: syncEmail,
                    Phone: phone,
                    Mobile: phone,
                    Company: fullUser.organization || body.organization || undefined,
                    Designation: fullUser.job_title || body.jobTitle || undefined,
                    Lead_Source: "Website Registration",
                    Industry: fullUser.industries?.find((i: string | null) => !!i) || undefined,
                    Industry_Sub_Category: fullUser.sub_industries?.find((i: string | null) => !!i) || undefined,
                    Community_Portal: toArray(fullUser.sub_communities),
                    Invite_Source: "EnergClub",
                    City: fullUser.state || body.state || undefined,
                    Country: fullUser.country || body.country || undefined,
                };
                console.log("📋 [ZOHO_LEADS] Onboarding sync payload:", JSON.stringify(leadData, null, 2));

                const zohoResult = await upsertZohoLead(leadData);
                console.log("✅ Synced to Zoho Leads:", fullUser.email, zohoResult);
            } catch (zohoErr: any) {
                // Non-fatal — don't block onboarding if Zoho fails
                console.error("⚠️ Zoho Lead sync failed:", zohoErr.message);
            }
        }

        return NextResponse.json({ success: true, userId: dbUserId });
    } catch (error) {
        console.error("[ONBOARDING_SUBMIT]", error);
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            { error: "Internal server error", detail: message, stack },
            { status: 500 }
        );
    }
}
