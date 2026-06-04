import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { markUserAsAbstractSubmitter } from "@/lib/queries";

/**
 * POST /api/user/mark-abstract-submitter
 * Sets has_submitted_abstract = true for the authenticated user.
 * Optionally fills missing profile organization/job_title without overwriting existing values.
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        let body: { institution?: unknown; profession?: unknown } = {};
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        await markUserAsAbstractSubmitter(userId, {
            institution: typeof body.institution === "string" ? body.institution : undefined,
            profession: typeof body.profession === "string" ? body.profession : undefined,
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[MARK_ABSTRACT_SUBMITTER]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
