import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { NO_CACHE_HEADERS } from "@/lib/api/no-cache";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { onboardingCompleted: false, signedIn: false },
                { headers: NO_CACHE_HEADERS }
            );
        }

        // The committed completion flag is authoritative even before Clerk refreshes.
        let databaseUnavailable = false;
        try {
            const saved = await query("SELECT onboarding_completed FROM users WHERE clerk_id = $1", [userId]);
            if (saved.rows.some(row => row.onboarding_completed === true)) {
                return NextResponse.json(
                    { onboardingCompleted: true, signedIn: true },
                    { headers: NO_CACHE_HEADERS }
                );
            }
        } catch (error) {
            databaseUnavailable = true;
            console.error("[ONBOARDING_STATUS] Database lookup failed:", error);
        }

        // A database outage must not prevent checking already-synced Clerk metadata.
        let clerkOnboardingCompleted: boolean | null = null;
        try {
            const clerkUser = await currentUser();
            if (clerkUser) {
                clerkOnboardingCompleted = clerkUser.publicMetadata?.onboarding_completed === true;
                if (clerkOnboardingCompleted) {
                    return NextResponse.json(
                        { onboardingCompleted: true, signedIn: true },
                        { headers: NO_CACHE_HEADERS }
                    );
                }

                // Existing profiles may predate their Clerk ID. Only a verified
                // primary email can establish that the signed-in user owns that row.
                const primaryEmail = clerkUser.primaryEmailAddress;
                if (!databaseUnavailable && primaryEmail?.verification?.status === "verified") {
                    const saved = await query(
                        "SELECT onboarding_completed FROM users WHERE LOWER(email) = LOWER($1)",
                        [primaryEmail.emailAddress]
                    );
                    if (saved.rows.some(row => row.onboarding_completed === true)) {
                        return NextResponse.json(
                            { onboardingCompleted: true, signedIn: true },
                            { headers: NO_CACHE_HEADERS }
                        );
                    }
                }
            }
        } catch (error) {
            // A failed email lookup or metadata request leaves completion unknown.
            clerkOnboardingCompleted = null;
            console.error("[ONBOARDING_STATUS] Completion fallback failed:", error);
        }

        if (databaseUnavailable || clerkOnboardingCompleted === null) {
            return NextResponse.json(
                { onboardingCompleted: null, signedIn: true, error: "Unable to check profile completion. Please try again." },
                { status: 503, headers: NO_CACHE_HEADERS }
            );
        }

        return NextResponse.json(
            { onboardingCompleted: false, signedIn: true },
            { headers: NO_CACHE_HEADERS }
        );
    } catch (error) {
        console.error("[ONBOARDING_STATUS] Error:", error);
        return NextResponse.json(
            { onboardingCompleted: false, signedIn: false },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
