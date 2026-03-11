import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveOnboardingProfile } from "@/lib/queries";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { getVerificationStatus } from "@/lib/queries/users";
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

        // ── Save to DB (atomic transaction) ─────────────────────────
        const dbUserId = await saveOnboardingProfile({
            clerkId: userId,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
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

        // ── Update Clerk metadata and profile ──────────────────────
        await (await clerkClient()).users.updateUser(userId, {
            firstName: body.firstName,
            lastName: body.lastName,
            publicMetadata: {
                onboarding_completed: true,
                ...(body.phone ? { phone: body.phone } : {}),
            },
        });

        // ── Fetch FULL profile ─────────────────────────────
        const fullUser = await getFullUserProfile(userId);

        // ── Check verification status before external sync ──────────
        let bothVerified = false;
        try {
            const verification = await getVerificationStatus(userId);
            bothVerified = !!(verification?.email_verified && verification?.phone_verified);
            console.log(`[ONBOARDING] Verification status: email=${verification?.email_verified}, phone=${verification?.phone_verified}`);
        } catch (verErr: any) {
            console.warn(`[ONBOARDING] Could not check verification status: ${verErr.message}`);
        }

        // Reject dummy emails from ever reaching external systems
        const isDummyEmail = fullUser.email?.endsWith('@phone.energdive.com');
        const canSyncExternally = bothVerified && !isDummyEmail;

        if (!canSyncExternally) {
            console.warn(`[ONBOARDING] Skipping Brevo/Zoho sync — bothVerified=${bothVerified}, isDummyEmail=${isDummyEmail}`);
        }

        // ── Sync to Brevo (only if both verified + real email) ──────
        if (canSyncExternally) {
            console.log("📋 Brevo sync payload:", {
                email: fullUser.email,
                preferred_frequency: fullUser.preferred_frequency,
                preferred_formats: fullUser.preferred_formats,
            });
            await syncUserToBrevo(fullUser);
            console.log("✅ Full profile synced to Brevo");
        }

        // ── Send Welcome Email (only if real email) ────────────────
        if (!isDummyEmail) {
            try {
                await sendWelcomeEmail(
                    fullUser.email,
                    fullUser.first_name || body.firstName,
                    fullUser.preferred_frequency || body.preferredFrequency,
                    fullUser.preferred_formats || body.preferredFormats
                );
                console.log("✅ Welcome email sent to:", fullUser.email);
            } catch (emailErr) {
                // Non-fatal — don't block onboarding if email fails
                console.error("⚠️ Welcome email failed:", emailErr);
            }
        }

        // ── Sync to Zoho CRM as Lead (only if both verified) ─────────
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
                const leadData = {
                    First_Name: fullUser.first_name || body.firstName,
                    Last_Name: fullUser.last_name || body.lastName,
                    Email: fullUser.email,
                    Phone: fullUser.phone || undefined,
                    Company: fullUser.organization || body.organization || undefined,
                    Designation: fullUser.job_title || body.jobTitle || undefined,
                    Lead_Source: "Website Registration",
                    Industry: fullUser.industries?.find((i: string | null) => !!i) || undefined,
                    Industry_Sub_Category: fullUser.sub_industries?.find((i: string | null) => !!i) || undefined,
                    Community_Portal: toArray(fullUser.sub_communities),
                    Query_Type: "EnergClub",
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
