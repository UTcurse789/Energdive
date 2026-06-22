import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureUserProfileRow, getUserProfile, hasUserDownloads } from "@/lib/queries";

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

        const clerkUser = await currentUser();
        const email =
            clerkUser?.primaryEmailAddress?.emailAddress ||
            clerkUser?.emailAddresses?.[0]?.emailAddress ||
            "";
        const phone = typeof clerkUser?.publicMetadata?.phone === "string"
            ? clerkUser.publicMetadata.phone
            : null;
        const clerkOnboardingCompleted = clerkUser?.publicMetadata?.onboarding_completed === true;

        if (email) {
            try {
                await ensureUserProfileRow({
                    clerkId: userId,
                    email,
                    firstName: clerkUser?.firstName || null,
                    lastName: clerkUser?.lastName || null,
                    phone,
                    onboardingCompleted: clerkOnboardingCompleted,
                });
            } catch (error) {
                console.error("[USER_PROFILE] Failed to ensure user profile row:", error);
            }
        }

        const profile = await getUserProfile(userId, email);

        const hasDownloads = profile ? await hasUserDownloads(userId) : false;

        if (!profile) {
            return NextResponse.json({
                exists: true,
                user: {
                    id: 0,
                    clerk_id: userId,
                    email,
                    first_name: clerkUser?.firstName || null,
                    last_name: clerkUser?.lastName || null,
                    phone,
                    country: null,
                    state: null,
                    job_title: null,
                    organization: null,
                    onboarding_completed: clerkOnboardingCompleted,
                    has_submitted_abstract: false,
                    created_at: new Date().toISOString(),
                    preferred_frequency: null,
                    preferred_formats: [],
                    content_digest_opted_out: false,
                    industry_id: null,
                    industry_name: null,
                    sub_industry_id: null,
                    sub_industry_name: null,
                    communities: [],
                    membership_id: null,
                    verification_status: null,
                    hasDownloads,
                }
            });
        }

        return NextResponse.json({
            exists: true,
            user: {
                ...profile,
                hasDownloads
            }
        });
    } catch (error) {
        console.error("[USER_PROFILE]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
