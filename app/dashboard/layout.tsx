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

    // Onboarding guard
    if (!user.publicMetadata?.onboardingComplete) {
        redirect("/onboarding");
    }

    // Fetch profile server-side (always fresh)
    const profile = await getUserProfile(user.id);

    if (!profile) {
        redirect("/onboarding");
    }

    return (
        <DashboardShell initialProfile={profile}>
            {children}
        </DashboardShell>
    );
}
