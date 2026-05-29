import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { FileText, FolderOpenDot, Plus } from "lucide-react";
import PaperStatusBadge from "@/components/paper-submission/paper-status-badge";
import { formatSubmissionDate } from "@/lib/paper-submissions";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";

export const metadata = {
    title: "My Submissions",
};

export default async function MySubmissionsPage({ searchParams }) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const showSuccessBanner = resolvedSearchParams?.submitted === "1";
    const submittedTitle =
        typeof resolvedSearchParams?.title === "string" ? resolvedSearchParams.title : "";
    const query = email
        ? `status=draft&filters[author_email][$eq]=${encodeURIComponent(email)}&populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[sectors][populate][parent][fields][0]=name&populate[sectors][populate][parent][fields][1]=slug&sort[0]=submitted_date:desc`
        : "";

    let submissions = [];
    let loadError = "";

    if (query) {
        try {
            submissions = await fetchPaperSubmissions(query);
        } catch (error) {
            loadError = error instanceof Error ? error.message : "Unable to load your submissions right now.";
        }
    }

    return (
        <div className="animate-fade-in-up max-w-5xl mx-auto">
            {showSuccessBanner ? (
                <div
                    className="mb-6 rounded-[24px] border px-5 py-4 text-sm"
                    style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.24)", color: "var(--dash-text)" }}
                >
                    {submittedTitle
                        ? <span><strong>{submittedTitle}</strong> was submitted successfully and is now in your review queue.</span>
                        : <span>Your paper was submitted successfully and is now in your review queue.</span>}
                </div>
            ) : null}

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                        My Submissions
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                        Track the review status of the research papers you have submitted.
                    </p>
                </div>

                <Link
                    href="/knowledge-base"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
                    style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                >
                    <Plus className="h-4 w-4" />
                    Submit Another Paper
                </Link>
            </div>

            {loadError ? (
                <div
                    className="rounded-[28px] border px-6 py-5 text-sm"
                    style={{ background: "rgba(127,29,29,0.14)", borderColor: "rgba(248,113,113,0.28)", color: "#FCA5A5" }}
                >
                    {loadError}
                </div>
            ) : submissions.length === 0 ? (
                <div
                    className="rounded-[30px] border p-10 text-center"
                    style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}
                >
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(201,168,76,0.12)", color: "var(--dash-accent)" }}
                    >
                        <FolderOpenDot className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold" style={{ color: "var(--dash-text)" }}>
                        No submissions yet
                    </h2>
                    <p className="mt-3 max-w-xl mx-auto text-sm leading-7" style={{ color: "var(--dash-text-dim)" }}>
                        Your submitted papers will appear here once you complete the website submission flow.
                    </p>
                    <Link
                        href="/knowledge-base"
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
                        style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                    >
                        <Plus className="h-4 w-4" />
                        Submit Your First Paper
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {submissions.map((submission) => (
                        <article
                            key={submission.id}
                            className="rounded-[28px] border p-6 transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                            style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--dash-accent-dim)", color: "var(--dash-accent)" }}>
                                        <FileText className="h-3.5 w-3.5" />
                                        {submission.primarySector}
                                    </div>
                                    <h2 className="mt-4 text-2xl font-bold leading-tight" style={{ color: "var(--dash-text)" }}>
                                        {submission.title || "Untitled paper"}
                                    </h2>
                                </div>
                                <PaperStatusBadge status={submission.status} />
                            </div>

                            <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-5" style={{ color: "var(--dash-text-dim)" }}>
                                <span>Submitted {formatSubmissionDate(submission.submittedDate)}</span>
                                <span>Sector: {submission.primarySector}</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
