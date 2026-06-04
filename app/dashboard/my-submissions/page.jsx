import { currentUser } from "@clerk/nextjs/server";
import { fetchAbstractSubmissions } from "@/lib/paper-submissions-server";
import { fetchPaperSectors } from "@/lib/paper-submission-taxonomy";
import KnowledgeBaseSubmissionsDashboard from "@/components/dashboard/knowledge-base-submissions-dashboard";
import { KnowledgeBaseDashboardFrame } from "@/components/dashboard/knowledge-base-dashboard-frame";

export const metadata = {
    title: "My Submissions",
};

const SUBMISSIONS_QUERY_POPULATE =
    "populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[sectors][populate][parent][fields][0]=name&populate[sectors][populate][parent][fields][1]=slug&populate[final_paper_submissions][fields][0]=final_status&populate[final_paper_submissions][fields][1]=final_submission_date";

export default async function MySubmissionsPage({ searchParams }) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const showSuccessBanner = resolvedSearchParams?.submitted;
    const submittedTitle =
        typeof resolvedSearchParams?.title === "string" ? resolvedSearchParams.title : "";
    const activeLane =
        typeof resolvedSearchParams?.view === "string" &&
            ["abstract", "final-paper", "resubmission", "submissions"].includes(resolvedSearchParams.view)
            ? resolvedSearchParams.view
            : "submissions";
    
    const query = email
        ? `filters[author_email][$eq]=${encodeURIComponent(email)}&${SUBMISSIONS_QUERY_POPULATE}&sort[0]=submitted_date:desc`
        : "";

    let abstracts = [];
    let loadError = "";
    const sectors = await fetchPaperSectors();

    if (query) {
        try {
            abstracts = await fetchAbstractSubmissions(query);
        } catch (error) {
            console.error("Error loading submissions:", error);
            loadError = error instanceof Error ? error.message : "Unable to load your submissions right now.";
        }
    }

    return (
        <KnowledgeBaseDashboardFrame>
            <KnowledgeBaseSubmissionsDashboard
                abstracts={abstracts}
                loadError={loadError}
                showSuccessBanner={showSuccessBanner}
                submittedTitle={submittedTitle}
                activeLane={activeLane}
                sectors={sectors}
                authorDefaults={{
                    authorName: user?.fullName ?? "",
                    authorEmail: email,
                    affiliation: "",
                    profession: "",
                }}
            />
        </KnowledgeBaseDashboardFrame>
    );
}
