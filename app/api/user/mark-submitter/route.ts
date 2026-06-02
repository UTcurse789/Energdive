import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { markUserAsSubmitter } from "@/lib/queries";

/**
 * POST /api/user/mark-submitter
 * Sets has_submitted_paper = true for the authenticated user.
 */
export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await markUserAsSubmitter(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[MARK_SUBMITTER]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
