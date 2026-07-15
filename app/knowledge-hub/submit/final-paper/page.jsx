import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import KnowledgeBaseFinalPaperForm from "@/components/paper-submission/KnowledgeBaseFinalPaperForm";
import { fetchAbstractSubmissions } from "@/lib/paper-submissions-server";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
    title: "Submit Final Paper",
    description: "Submit the final manuscript for your accepted abstract.",
};

const ABSTRACT_DETAIL_POPULATE =
    "populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[sectors][populate][parent][fields][0]=name&populate[sectors][populate][parent][fields][1]=slug";

export default async function SubmitFinalPaperPage({ searchParams }) {
    const { userId } = await auth();

    if (!userId) {
        redirect(`/auth?redirect_url=${encodeURIComponent("/knowledge-hub/submit")}`);
    }

    const profile = await getUserProfile(userId);
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const abstractId = resolvedSearchParams.abstract_id;

    if (!abstractId) {
        redirect("/dashboard/my-submissions");
    }

    if (!profile?.onboarding_completed) {
        redirect(`/onboarding?return_to=${encodeURIComponent("/knowledge-hub/submit")}`);
    }

    // Fetch abstract details using fetchAbstractSubmissions
    const query = /^\d+$/.test(abstractId)
        ? `filters[id][$eq]=${abstractId}&${ABSTRACT_DETAIL_POPULATE}`
        : `filters[documentId][$eq]=${abstractId}&${ABSTRACT_DETAIL_POPULATE}`;

    let submissions = [];
    try {
        submissions = await fetchAbstractSubmissions(query);
    } catch (err) {
        console.error("Error fetching abstract details:", err);
    }

    const abstract = submissions[0] || null;

    // Security/validation checks:
    // 1. Abstract must exist.
    // 2. Abstract must belong to the logged-in user.
    // 3. Abstract must be accepted.
    if (!abstract) {
        redirect("/dashboard/my-submissions?error=abstract_not_found");
    }

    if (abstract.authorEmail !== profile.email) {
        redirect("/dashboard/my-submissions?error=unauthorized");
    }

    if (abstract.status !== "accepted") {
        redirect("/dashboard/my-submissions?error=not_accepted");
    }

    return <KnowledgeBaseFinalPaperForm abstract={abstract} />;
}
