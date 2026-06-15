import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureUserProfileRow, getUserProfile, hasUserDownloads } from "@/lib/queries";
import DashboardShell from "@/components/dashboard/dashboard-shell";

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

    let profile = await getUserProfile(userId);

    if (!profile && email) {
        try {
            await ensureUserProfileRow({
                clerkId: userId,
                email,
                firstName: clerkUser?.firstName || null,
                lastName: clerkUser?.lastName || null,
                phone,
            });
            profile = await getUserProfile(userId);
        } catch (error) {
            console.error("[DASHBOARD_LAYOUT] Failed to ensure user profile row:", error);
        }
    }

    const downloadsExist = profile ? await hasUserDownloads(userId) : false;
    const initialProfile = profile || {
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
        onboarding_completed: false,
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
    };

    return (
        <DashboardShell initialProfile={{ ...initialProfile, hasDownloads: downloadsExist }}>
            {children}
        </DashboardShell>
    );
}
