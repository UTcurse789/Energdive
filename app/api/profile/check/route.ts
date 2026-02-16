import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/check
 * Returns the onboarding status of the current user.
 * Checks both Clerk metadata (fast) and Database (authoritative).
 */
export async function GET() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return NextResponse.json({ exists: false, onboardingCompleted: false });
    }

    // 1. Fast check: Middleware/Session Claims
    // Note: sessionClaims might be stale if the user just updated it.
    // We check it primarily for debugging client-side state.
    const metaCompleted = sessionClaims?.metadata?.onboarding_completed === true;

    // 2. Authoritative check: Database
    const client = await getClient();
    try {
        const res = await client.query(
            "SELECT onboarding_completed FROM users WHERE clerk_id = $1",
            [userId]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({
                exists: false,
                onboardingCompleted: false,
                source: "db_missing",
            });
        }

        const dbUser = res.rows[0];
        const dbCompleted = dbUser.onboarding_completed === true;

        // Sync metadata if DB says true but Clerk says false (self-repair)
        if (dbCompleted && !metaCompleted) {
            await (await clerkClient()).users.updateUserMetadata(userId, {
                publicMetadata: { onboarding_completed: true },
            });
        }

        return NextResponse.json({
            exists: true,
            onboardingCompleted: dbCompleted,
            source: "db_found",
        });
    } catch (error) {
        console.error("[PROFILE_CHECK]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
