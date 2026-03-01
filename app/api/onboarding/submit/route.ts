import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveOnboardingProfile } from "@/lib/queries";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import syncUserToBrevo from "@/lib/brevoSync";
import { sendWelcomeEmail } from "@/lib/email";

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
                fullUser.first_name || body.firstName
            );
            console.log("✅ Welcome email sent to:", fullUser.email);
        } catch (emailErr) {
            // Non-fatal — don't block onboarding if email fails
            console.error("⚠️ Welcome email failed:", emailErr);
        }

        return NextResponse.json({ success: true, userId: dbUserId });
    } catch (error) {
        console.error("[ONBOARDING_SUBMIT]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
