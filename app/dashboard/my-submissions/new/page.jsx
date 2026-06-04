import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import KnowledgeBaseAbstractForm from "@/components/paper-submission/KnowledgeBaseAbstractForm";
import { KnowledgeBaseDashboardFrame } from "@/components/dashboard/knowledge-base-dashboard-frame";
import { fetchPaperSectors } from "@/lib/paper-submission-taxonomy";
import { fetchAbstractSubmissions } from "@/lib/paper-submissions-server";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
    title: "Submit New Abstract",
};

export default async function DashboardSubmitAbstractPage({ searchParams }) {
    const { userId } = await auth();

    if (!userId) {
        redirect(`/auth?redirect_url=${encodeURIComponent("/dashboard/my-submissions/new")}`);
    }

    const profile = await getUserProfile(userId);
    const resolvedSearchParams = searchParams ? await searchParams : {};

    if (!profile?.onboarding_completed) {
        redirect(`/onboarding?return_to=${encodeURIComponent("/dashboard/my-submissions/new")}`);
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? profile.email ?? "";
    const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
        || [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
        || "";
    const [sectors, previousSubmissions] = await Promise.all([
        fetchPaperSectors(),
        email
            ? fetchAbstractSubmissions(
                `filters[author_email][$eq]=${encodeURIComponent(email)}&fields[0]=Profession&sort[0]=submitted_date:desc&pagination[pageSize]=1`
            ).catch((error) => {
                console.error("Unable to load previous abstract profession:", error);
                return [];
            })
            : [],
    ]);
    const previousProfession = previousSubmissions.find((submission) => submission.profession)?.profession ?? "";
    const initialAffiliation = typeof resolvedSearchParams?.institution === "string"
        ? resolvedSearchParams.institution
        : profile.organization ?? "";
    const initialProfession = typeof resolvedSearchParams?.profession === "string"
        ? resolvedSearchParams.profession
        : previousProfession;

    return (
        <KnowledgeBaseDashboardFrame>
            <KnowledgeBaseAbstractForm
                initialAuthorName={authorName}
                initialAuthorEmail={email}
                initialAffiliation={initialAffiliation}
                initialProfession={initialProfession}
                sectors={sectors}
                variant="dashboard"
                returnHref="/dashboard/my-submissions"
                returnLabel="Back to My Submissions"
                secondarySuccessHref="/dashboard/my-submissions"
                secondarySuccessLabel="Back to My Submissions"
            />
        </KnowledgeBaseDashboardFrame>
    );
}
