import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/queries/users";
import syncUserToBrevo from "@/lib/brevoSync";
import { getFullUserProfile } from "@/lib/getFullUserProfile";

/**
 * POST /api/user/update-profile
 * Updates user profile fields and optionally industry/community selections.
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        await updateUserProfile({
            clerkId: userId,
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
            contentDigestOptedOut: body.contentDigestOptedOut,
        });

        // Sync name changes back to Clerk so session data stays in sync
        if (body.firstName || body.lastName) {
            try {
                const updateData: Record<string, string> = {};
                if (body.firstName) updateData.firstName = body.firstName;
                if (body.lastName) updateData.lastName = body.lastName;
                await (await clerkClient()).users.updateUser(userId, updateData);
                console.log("✅ Clerk user name synced:", updateData);
            } catch (clerkErr) {
                console.error("❌ Clerk name sync failed (non-fatal):", clerkErr);
            }
        }

        // Sync updated profile to Brevo
        try {
            const fullUser = await getFullUserProfile(userId);
            if (fullUser) {
                await syncUserToBrevo(fullUser);
                console.log("✅ Profile update synced to Brevo");
            }
        } catch (brevoErr) {
            console.error("❌ Brevo sync after profile update failed:", brevoErr);
            // Don't fail the profile update if Brevo sync fails
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[UPDATE_PROFILE]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
