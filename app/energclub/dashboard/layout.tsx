import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUserProfileRow, getUserProfile } from "@/lib/queries";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    POST_AUTH_REDIRECT_COOKIE,
    getSafeRedirectFromStoredValue,
} from "@/lib/post-auth-redirect";

export default async function EnergClubDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth?redirect_url=%2Fenergclub%2Fdashboard");
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
            console.error("[ENERGCLUB_DASHBOARD_LAYOUT] Failed to ensure user profile row:", error);
        }
    }

    const profile = await getUserProfile(userId, email);
    const isOnboardingComplete = profile?.onboarding_completed || clerkOnboardingCompleted;

    if (!isOnboardingComplete) {
        const cookieStore = await cookies();
        const storedReturnTo = getSafeRedirectFromStoredValue(
            cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value
        );
        const returnTo = storedReturnTo !== DEFAULT_POST_AUTH_REDIRECT
            ? storedReturnTo
            : "/energclub/dashboard";

        redirect(`/onboarding?return_to=${encodeURIComponent(returnTo)}`);
    }

    return <>{children}</>;
}
