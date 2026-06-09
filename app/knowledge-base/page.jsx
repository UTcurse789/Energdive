import Link from "next/link";
import { ArrowRight, LibraryBig } from "lucide-react";
import KnowledgeBaseArchiveGrid from "@/components/paper-submission/knowledge-base-archive-grid";
import { formatSubmissionDate } from "@/lib/paper-submissions";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";

export const metadata = {
    title: "Knowledge Base",
    description: "Explore submitted research papers shared with India's energy community.",
};

const KNOWLEDGE_BASE_QUERY =
    "populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[sectors][populate][parent][fields][0]=name&populate[sectors][populate][parent][fields][1]=slug&populate[abstract_pdf][fields][0]=url&populate[abstract_pdf][fields][1]=name&populate[final_paper_submissions][fields][0]=final_status&populate[final_paper_submissions][fields][1]=final_submission_date&populate[final_paper_submissions][populate][full_paper][fields][0]=url&populate[final_paper_submissions][populate][full_paper][fields][1]=name&sort[0]=submitted_date:desc&pagination[pageSize]=100";

export default async function KnowledgeBasePage() {
    let papers = [];
    let loadError = "";

    try {
        const submissions = await fetchPaperSubmissions(KNOWLEDGE_BASE_QUERY);
        papers = submissions.filter((paper) => paper.status === "accepted");
    } catch (error) {
        loadError = error instanceof Error ? error.message : "Unable to load papers right now.";
    }

    const paperCountLabel = loadError
        ? "—"
        : new Intl.NumberFormat("en-IN").format(papers.length);
    const latestArchiveLabel = loadError
        ? "Staging unavailable"
        : papers.length > 0
            ? formatSubmissionDate(papers[0].submittedDate)
            : "Awaiting first approval";

    return (
        <>
            <section className="relative overflow-hidden bg-[#f6f3eb]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,83,45,0.08),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(15,23,42,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.62),rgba(246,243,235,0))]" />

                <div className="container relative pt-[67px] pb-[67px] md:pt-[83px] md:pb-[83px] lg:pt-[99px] lg:pb-[99px] xl:pt-[115px] xl:pb-[115px]">
                    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/80 mt-3 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-800 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
                                <LibraryBig className="h-3.5 w-3.5" />
                                Research
                            </div>

                            <div className="mt-6 max-w-4xl">
                                <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
                                    Knowledge Hub
                                </h1>
                                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                    Explore approved research across the energy value chain, from fuels, generation,
                                    and grids to markets, storage, sustainability, and policy.
                                </p>
                            </div>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2 mb-8">
                                <SummaryCard
                                    label="Abstracts"
                                    value={paperCountLabel}
                                />
                                <SummaryCard
                                    label="Latest Published"
                                    value={latestArchiveLabel}
                                />
                            </div>
                        </div>

                        <aside className="xl:pt-[2.55rem]">
                            <div className="relative overflow-hidden rounded-[34px] border border-emerald-400/10 bg-[#0f1813] text-white shadow-[0_28px_70px_rgba(15,24,19,0.30)]">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.34),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.07),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />
                                <div className="relative p-7 sm:p-8">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">
                                        Contribute Research
                                    </p>
                                    <h2 className="mt-4 max-w-xs text-2xl font-bold leading-tight text-white sm:text-[1.25rem]">
                                        Submit Your Abstract
                                    </h2>
                                    <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
                                        Share your research with India&apos;s energy community through a streamlined
                                        paper submission workflow.
                                    </p>

                                    <Link
                                        href="/knowledge-base/submit"
                                        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
                                    >
                                        Start Submission
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            <section className="bg-white pb-12 pt-12 md:pb-16 md:pt-14 lg:pb-20 lg:pt-16">
                <div className="container">
                    <div className="max-w-3xl">
                        <h2 className="mt-2 text-3xl font-bold text-slate-950">
                            Research papers
                        </h2>
                    </div>

                    {/* TODO: Add pagination controls once the approved archive grows beyond the initial page size. */}
                    {loadError ? (
                        <div className="mt-6 rounded-[30px] border border-slate-200/90 bg-white/95 px-6 py-8 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                            <p className="text-lg font-semibold text-slate-900">
                                We could not load the approved archive from staging right now.
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                Refresh the page and check the staging CMS permissions for paper submissions.
                            </p>
                        </div>
                    ) : (
                        <KnowledgeBaseArchiveGrid papers={papers} />
                    )}
                </div>
            </section>
        </>
    );
}

function SummaryCard({ label, value, detail }) {
    return (
        <div className="rounded-[24px] border border-slate-200/90 bg-white/90 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {label}
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-950">
                {value}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
                {detail}
            </p>
        </div>
    );
}
