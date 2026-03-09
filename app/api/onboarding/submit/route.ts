import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveOnboardingProfile } from "@/lib/queries";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import syncUserToBrevo from "@/lib/brevoSync";
import { sendWelcomeEmail } from "@/lib/email";
import { upsertZohoContact, convertLeadToContact } from "@/lib/zoho-contacts";
import { getLeadByEmail } from "@/lib/zoho";

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

        // ── Update Clerk metadata and profile (so middleware can gate, and UI shows name) ──────────
        await (await clerkClient()).users.updateUser(userId, {
            firstName: body.firstName,
            lastName: body.lastName,
            publicMetadata: { onboarding_completed: true },
        });

        // ── Fetch FULL profile ─────────────────────────────
        const fullUser = await getFullUserProfile(userId);

        // ── Sync to Brevo ──────────────────────────────────
        console.log("📋 Brevo sync payload:", {
            email: fullUser.email,
            preferred_frequency: fullUser.preferred_frequency,
            preferred_formats: fullUser.preferred_formats,
        });
        await syncUserToBrevo(fullUser);

        console.log("✅ Full profile synced to Brevo");

        // ── Send Welcome Email ─────────────────────────────
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

        // ── Sync to Zoho CRM Contacts ──────────────────────
        try {
            // Helper: return non-empty array or undefined
            const toArray = (arr: any[] | undefined) => {
                if (!arr) return undefined;
                const filtered = arr.filter((v: any) => v !== null && v !== undefined && v !== '');
                return filtered.length > 0 ? filtered : undefined;
            };

            const contactData = {
                First_Name: fullUser.first_name || body.firstName,
                Last_Name: fullUser.last_name || body.lastName,
                Email: fullUser.email,
                Phone: fullUser.phone || undefined,
                Company: fullUser.organization || body.organization || undefined,
                Lead_Source: "Website Registration",
                Industry_Category: fullUser.industries?.find((i: string | null) => !!i) || undefined,
                Industry_Sub_Category: fullUser.sub_industries?.find((i: string | null) => !!i) || undefined,
                Community: toArray(fullUser.communities),
                SubCommunity: toArray(fullUser.sub_communities),
                community_portal: toArray(fullUser.sub_communities),
                Query_Type: "EnergClub",
            };
            console.log("📋 [ZOHO_CONTACTS] Onboarding sync payload:", JSON.stringify(contactData, null, 2));

            // Check if a Lead already exists for this email
            const existingLead = await getLeadByEmail(fullUser.email);

            if (existingLead) {
                // Convert the Lead to a Contact instead of creating a duplicate
                console.log(`📋 [ZOHO] Found existing Lead ${existingLead.id} for ${fullUser.email}. Converting to Contact...`);
                const conversionResult = await convertLeadToContact(existingLead.id, contactData);
                if (conversionResult) {
                    console.log(`✅ Lead ${existingLead.id} converted to Contact ${conversionResult.contactId}`);
                } else {
                    // Conversion failed — fall back to creating/updating Contact directly
                    console.warn(`⚠️ Lead conversion failed, falling back to upsert for ${fullUser.email}`);
                    await upsertZohoContact(contactData);
                }
            } else {
                // No existing Lead — create/update Contact directly
                const zohoResult = await upsertZohoContact(contactData);
                console.log("✅ Synced to Zoho Contacts:", fullUser.email, zohoResult);
            }
        } catch (zohoErr: any) {
            // Non-fatal — don't block onboarding if Zoho fails
            console.error("⚠️ Zoho Contact sync failed:", zohoErr.message);
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
