import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/queries/users";

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
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[UPDATE_PROFILE]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
