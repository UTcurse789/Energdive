import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
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
        redirect("/onboarding");
    }

    return (
        <DashboardShell initialProfile={profile}>
            {children}
        </DashboardShell>
    );
}
