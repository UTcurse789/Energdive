import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/queries";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ onboardingCompleted: false, signedIn: false });
        }

        const clerkUser = await currentUser();
        const email =
            clerkUser?.primaryEmailAddress?.emailAddress ||
            clerkUser?.emailAddresses?.[0]?.emailAddress ||
            "";

        // Check DB first
        const profile = await getUserProfile(userId, email);
        if (profile?.onboarding_completed) {
            return NextResponse.json({ onboardingCompleted: true, signedIn: true });
        }

        // Fallback: check Clerk metadata
        const clerkOnboardingCompleted = clerkUser?.publicMetadata?.onboarding_completed === true;

        return NextResponse.json({
            onboardingCompleted: clerkOnboardingCompleted || false,
            signedIn: true,
        });
    } catch (error) {
        console.error("[ONBOARDING_STATUS] Error:", error);
        return NextResponse.json({ onboardingCompleted: false, signedIn: false }, { status: 500 });
    }
}
