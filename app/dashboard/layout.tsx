import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();

    // Auth guard
    if (!user) {
        redirect("/sign-in");
    }

    // DB check — the single source of truth for onboarding status
    console.log(`[DashboardLayout] Checking profile for Clerk ID: ${user.id}`);
    const profile = await getUserProfile(user.id);
    console.log(`[DashboardLayout] Profile found: ${!!profile}`);

    if (!profile) {
        console.log(`[DashboardLayout] No profile found, redirecting to /onboarding`);
        redirect("/onboarding");
    }

    return (
        <DashboardShell initialProfile={profile}>
            {children}
        </DashboardShell>
    );
}
