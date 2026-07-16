"use client";

import { useMemo, useState } from "react";
import { ArrowRight, FileCheck2, FileText, FolderOpenDot, Repeat2, UploadCloud } from "lucide-react";
import PaperStatusBadge from "@/components/paper-submission/paper-status-badge";
import KnowledgeBaseAbstractForm from "@/components/paper-submission/KnowledgeBaseAbstractForm";
import KnowledgeBaseFinalPaperForm from "@/components/paper-submission/KnowledgeBaseFinalPaperForm";
import { formatSubmissionDate } from "@/lib/paper-submissions";

function getLaneStatus(abstract) {
    const status = String(abstract.status ?? "").toLowerCase();

    if (abstract.hasAcceptedFinalPaper) return "submissions";
    if (status === "accepted") return "final-paper";
    if (status === "rejected") return "resubmission";
    return "abstract";
}

const LANE_COPY = {
    submissions: {
        title: "My Submissions",
        description: "Your papers appear here after the final paper has been accepted.",
        empty: "No final papers have been accepted yet.",
    },
    abstract: {
        title: "Abstract",
        description: "Track abstracts currently submitted or under review.",
        empty: "No abstracts are currently in review.",
    },
    "final-paper": {
        title: "Final paper",
        description: "Accepted abstracts that are ready for final paper upload.",
        empty: "No accepted abstracts are ready for final paper upload yet.",
    },
    resubmission: {
        title: "Re-submission",
        description: "Rejected abstracts that can be revised and submitted again.",
        empty: "No abstracts need re-submission.",
    },
};

export default function KnowledgeBaseSubmissionsDashboard({
    abstracts,
    loadError,
    showSuccessBanner,
    submittedTitle,
    activeLane,
    sectors,
    authorDefaults,
}) {
    const [inlineAction, setInlineAction] = useState(null);
    const lane = LANE_COPY[activeLane] ? activeLane : "submissions";
    const filteredAbstracts = useMemo(
        () => (abstracts ?? []).filter((abstract) => getLaneStatus(abstract) === lane),
        [abstracts, lane]
    );

    const laneCopy = LANE_COPY[lane];

    return (
        <>
            {showSuccessBanner === "1" && (
                <div
                    className="mb-6 rounded-[24px] border px-5 py-4 text-sm"
                    style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.24)", color: "var(--dash-text)" }}
                >
                    {submittedTitle
                        ? <span><strong>Abstract Submitted:</strong> &quot;{submittedTitle}&quot; was successfully submitted and is now in review.</span>
                        : <span>Your abstract was submitted successfully and is now in the review queue.</span>}
                </div>
            )}

            {showSuccessBanner === "2" && (
                <div
                    className="mb-6 rounded-[24px] border px-5 py-4 text-sm"
                    style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.24)", color: "var(--dash-text)" }}
                >
                    {submittedTitle
                        ? <span><strong>Final Paper Submitted:</strong> The manuscript for &quot;{submittedTitle}&quot; was successfully uploaded.</span>
                        : <span>Your final paper was submitted successfully.</span>}
                </div>
            )}

            <div className="mb-8">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                        {laneCopy.title}
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                        {laneCopy.description}
                    </p>
                </div>
            </div>

            {loadError ? (
                <div
                    className="rounded-[28px] border px-6 py-5 text-sm"
                    style={{ background: "rgba(127,29,29,0.14)", borderColor: "rgba(248,113,113,0.28)", color: "#FCA5A5" }}
                >
                    {loadError}
                </div>
            ) : filteredAbstracts.length === 0 ? (
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
                        Nothing here yet
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7" style={{ color: "var(--dash-text-dim)" }}>
                        {laneCopy.empty}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {filteredAbstracts.map((abstract) => {
                        const actionKey = `${lane}:${abstract.documentId || abstract.id}`;
                        const isExpanded = inlineAction === actionKey;

                        return (
                            <article
                                key={abstract.id}
                                className={`w-full ${isExpanded ? 'col-span-full' : ''}`}
                            >
                                <div
                                    className="flex flex-col rounded-[24px] border p-5 transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                                    style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}
                                >
                                    {/* Card Header Row: Category on Left, Statuses on Right */}
                                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--dash-border-subtle)]">
                                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] whitespace-nowrap shrink-0" style={{ background: "var(--dash-accent-dim)", color: "var(--dash-accent)" }}>
                                            <FileText className="h-3 w-3" />
                                            {abstract.primarySector}
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-wrap justify-end">
                                            {/* Abstract Status */}
                                            <div className="flex items-center gap-1">
                                                <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Abstract:</span>
                                                <PaperStatusBadge status={abstract.status} />
                                            </div>
                                            {/* Final Paper Status */}
                                            {lane === "submissions" && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Paper:</span>
                                                    <PaperStatusBadge status="accepted" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body: Full-width Title */}
                                    <div className="space-y-2.5 min-w-0 flex-1">
                                        <h2 className="text-lg font-bold leading-snug break-words" style={{ color: "var(--dash-text)" }}>
                                            {abstract.title || "Untitled Abstract"}
                                        </h2>
                                        <div className="flex items-center justify-between text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                            <span>Submitted {formatSubmissionDate(abstract.submittedDate)}</span>
                                            {lane === "submissions" && abstract.finalPaperSubmissions?.length > 0 && (
                                                <span className="font-semibold text-slate-400">
                                                    {abstract.finalPaperSubmissions.length} version{abstract.finalPaperSubmissions.length !== 1 ? "s" : ""} uploaded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {abstract.abstract && (
                                        <div
                                            className="mt-4 max-w-full overflow-hidden rounded-xl p-3 text-xs leading-relaxed border-l-2 border-[var(--dash-accent)]"
                                            style={{ background: "rgba(255, 255, 255, 0.02)", color: "var(--dash-text-muted)" }}
                                        >
                                            <p className="font-semibold text-[9px] uppercase tracking-wider mb-1" style={{ color: "var(--dash-text-dim)" }}>Abstract Summary</p>
                                            <p className="line-clamp-2 break-words [overflow-wrap:anywhere] text-[11px] text-slate-400">
                                                {abstract.abstract.length > 140 ? `${abstract.abstract.slice(0, 140)}...` : abstract.abstract}
                                            </p>
                                        </div>
                                    )}

                                    {lane === "final-paper" && (
                                        <button
                                            type="button"
                                            onClick={() => setInlineAction(isExpanded ? null : actionKey)}
                                            className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-lg px-4 py-2.5 text-xs font-bold transition-all hover:opacity-90"
                                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                        >
                                            <FileCheck2 className="h-3.5 w-3.5" />
                                            Submit your final paper
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    )}

                                    {lane === "resubmission" && (
                                        <button
                                            type="button"
                                            onClick={() => setInlineAction(isExpanded ? null : actionKey)}
                                            className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-lg px-4 py-2.5 text-xs font-bold transition-all hover:opacity-90"
                                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                        >
                                            <Repeat2 className="h-3.5 w-3.5" />
                                            Submit again
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    )}

                                    {lane === "submissions" && (
                                        <button
                                            type="button"
                                            onClick={() => setInlineAction(isExpanded ? null : actionKey)}
                                            className="mt-5 inline-flex items-center justify-center gap-2 self-start rounded-lg px-4 py-2.5 text-xs font-bold transition-all hover:opacity-90"
                                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                        >
                                            <UploadCloud className="h-3.5 w-3.5" />
                                            Submit New Version
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                {isExpanded && lane === "final-paper" && (
                                    <div className="mt-5 rounded-[24px] border p-5" style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}>
                                        <KnowledgeBaseFinalPaperForm
                                            abstract={abstract}
                                            variant="dashboard"
                                            returnHref={`/dashboard/my-submissions?view=final-paper`}
                                            secondarySuccessHref="/dashboard/my-submissions?view=final-paper"
                                            secondarySuccessLabel="Back to Final paper"
                                        />
                                    </div>
                                )}

                                {isExpanded && lane === "submissions" && (
                                    <div className="mt-5 rounded-[24px] border p-5" style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}>
                                        <KnowledgeBaseFinalPaperForm
                                            abstract={abstract}
                                            variant="dashboard"
                                            returnHref="/dashboard/my-submissions?view=submissions"
                                            secondarySuccessHref="/dashboard/my-submissions?view=submissions"
                                            secondarySuccessLabel="Back to Submissions"
                                        />
                                    </div>
                                )}

                                {isExpanded && lane === "resubmission" && (
                                    <div className="mt-5 rounded-[24px] border p-5" style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}>
                                        <KnowledgeBaseAbstractForm
                                            initialTitle={abstract.title}
                                            initialAuthorName={abstract.authorName || authorDefaults.authorName}
                                            initialAuthorEmail={abstract.authorEmail || authorDefaults.authorEmail}
                                            initialAffiliation={abstract.affiliation || authorDefaults.affiliation}
                                            initialProfession={abstract.profession || authorDefaults.profession}
                                            initialAbstract={abstract.abstract}
                                            sectors={sectors}
                                            variant="dashboard"
                                            returnHref="/dashboard/my-submissions?view=resubmission"
                                            returnLabel="Back to Re-submission"
                                            secondarySuccessHref="/dashboard/my-submissions?view=abstract"
                                            secondarySuccessLabel="Back to Abstract"
                                        />
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </>
    );
}
