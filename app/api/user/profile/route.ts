import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/queries";

/**
 * GET /api/user/profile
 * Returns the full user profile with industry + community selections.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const profile = await getUserProfile(userId);

        if (!profile) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, user: profile });
    } catch (error) {
        console.error("[USER_PROFILE]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
