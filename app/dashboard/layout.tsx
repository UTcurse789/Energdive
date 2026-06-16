import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUserProfileRow, getUserProfile, hasUserDownloads } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    POST_AUTH_REDIRECT_COOKIE,
    getSafeRedirectFromStoredValue,
} from "@/lib/post-auth-redirect";

export const metadata: Metadata = {
    title: {
        default: "ENERGClub Dashboard",
        template: "%s | ENERGClub Dashboard",
    },
    description: "Private EnergClub dashboard for members, intelligence feeds, events, and account settings.",
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth");
    }

    const clerkUser = await currentUser();
    const email =
        clerkUser?.primaryEmailAddress?.emailAddress ||
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        "";
    const phone = typeof clerkUser?.publicMetadata?.phone === "string"
        ? clerkUser.publicMetadata.phone
        : null;

    const profile = await getUserProfile(userId);

    if (!profile) {
        const cookieStore = await cookies();
        const storedReturnTo = getSafeRedirectFromStoredValue(
            cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value
        );
        const returnTo = storedReturnTo !== DEFAULT_POST_AUTH_REDIRECT
            ? storedReturnTo
            : "/dashboard";

        redirect(`/onboarding?return_to=${encodeURIComponent(returnTo)}`);
    }

    if (!profile.onboarding_completed) {
        const cookieStore = await cookies();
        const storedReturnTo = getSafeRedirectFromStoredValue(
            cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value
        );
        const returnTo = storedReturnTo !== DEFAULT_POST_AUTH_REDIRECT
            ? storedReturnTo
            : "/dashboard";

        redirect(`/onboarding?return_to=${encodeURIComponent(returnTo)}`);
    }

    let resolvedProfile = profile;

    if (email) {
        try {
            await ensureUserProfileRow({
                clerkId: userId,
                email,
                firstName: clerkUser?.firstName || null,
                lastName: clerkUser?.lastName || null,
                phone,
            });
            const refreshedProfile = await getUserProfile(userId);
            if (refreshedProfile) {
                resolvedProfile = refreshedProfile;
            }
        } catch (error) {
            console.error("[DASHBOARD_LAYOUT] Failed to ensure user profile row:", error);
        }
    }

    const downloadsExist = await hasUserDownloads(userId);

    return (
        <DashboardShell initialProfile={{ ...resolvedProfile, hasDownloads: downloadsExist }}>
            {children}
        </DashboardShell>
    );
}
