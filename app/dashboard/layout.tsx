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
            console.error("[DASHBOARD_LAYOUT] Failed to ensure user profile row:", error);
        }
    }

    const resolvedProfile = await getUserProfile(userId, email);
    const effectiveProfile = resolvedProfile
        ? {
            ...resolvedProfile,
            onboarding_completed: resolvedProfile.onboarding_completed || clerkOnboardingCompleted,
        }
        : clerkOnboardingCompleted
            ? {
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
                onboarding_completed: true,
                has_submitted_abstract: false,
                created_at: new Date().toISOString(),
                preferred_frequency: "daily",
                preferred_formats: [],
                content_digest_opted_out: false,
                industry_id: null,
                industry_name: null,
                sub_industry_id: null,
                sub_industry_name: null,
                communities: [],
                membership_id: null,
                verification_status: null,
            }
            : null;

    if (!resolvedProfile?.onboarding_completed && effectiveProfile?.onboarding_completed) {
        console.warn("[DASHBOARD_LAYOUT] Recovered onboarding access from Clerk metadata", {
            userId,
            email,
            hasDbProfile: Boolean(resolvedProfile),
            dbOnboardingCompleted: resolvedProfile?.onboarding_completed ?? null,
        });
    }

    // Onboarding enforcement is now handled client-side by the OnboardingModal
    // popup in the root layout. No server-side redirect needed here.
    // Provide a fallback profile so the shell can render while the modal is active.
    const fallbackProfile = {
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
        preferred_frequency: "daily",
        preferred_formats: [] as string[],
        content_digest_opted_out: false,
        industry_id: null,
        industry_name: null,
        sub_industry_id: null,
        sub_industry_name: null,
        communities: [],
        membership_id: null,
        verification_status: null,
    };

    const profileForShell = effectiveProfile || fallbackProfile;

    const downloadsExist = await hasUserDownloads(userId);

    return (
        <DashboardShell initialProfile={{ ...profileForShell, hasDownloads: downloadsExist }}>
            {children}
        </DashboardShell>
    );
}
