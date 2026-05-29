import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries";
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
    // auth() reads from middleware-verified session — no API call needed.
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth");
    }

    // DB check — the single source of truth for onboarding status
    const profile = await getUserProfile(userId);

    if (!profile || !profile.onboarding_completed) {
        const cookieStore = await cookies();
        const storedReturnTo = getSafeRedirectFromStoredValue(
            cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value
        );
        const returnTo = storedReturnTo !== DEFAULT_POST_AUTH_REDIRECT
            ? storedReturnTo
            : "/dashboard";

        redirect(`/onboarding?return_to=${encodeURIComponent(returnTo)}`);
    }

    return (
        <DashboardShell initialProfile={profile}>
            {children}
        </DashboardShell>
    );
}
