import { notFound } from "next/navigation";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";
import { formatSubmissionDate } from "@/lib/paper-submissions";
import { Building2, CalendarDays, UserRound, ArrowLeft, Download, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

const KNOWLEDGE_BASE_QUERY =
    "populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[sectors][populate][parent][fields][0]=name&populate[sectors][populate][parent][fields][1]=slug&populate[pdf][fields][0]=url&populate[pdf][fields][1]=name&populate[pdf][fields][2]=size&populate[pdf][fields][3]=ext&sort[0]=submitted_date:desc&filters[paper_status][$eq]=accepted&pagination[pageSize]=100";

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function extractPdfUrl(pdf) {
    if (!pdf) return null;
    if (typeof pdf === "string") return pdf;

    // Strapi v4 / v5 shapes
    const data = pdf?.data?.attributes ?? pdf?.data ?? pdf?.attributes ?? pdf;
    if (!data?.url) return null;

    const base =
        process.env.STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        "https://cms-staging.energdive.com";

    return data.url.startsWith("http") ? data.url : `${base}${data.url}`;
}

function extractPdfMeta(pdf) {
    if (!pdf) return null;
    const data = pdf?.data?.attributes ?? pdf?.data ?? pdf?.attributes ?? pdf;
    return {
        name: data?.name || "paper.pdf",
        size: data?.size ? `${(data.size / 1024).toFixed(1)} MB` : null,
        ext: data?.ext || ".pdf",
    };
}

export async function generateMetadata({ params }) {
    const { slug } = await params;

    let papers = [];
    try {
        papers = await fetchPaperSubmissions(KNOWLEDGE_BASE_QUERY);
    } catch {
        return { title: "Paper Abstract | Knowledge Base" };
    }

    const paper = papers.find((p) => slugify(p.title || "untitled-paper") === slug);
    return {
        title: paper ? `${paper.title} | Knowledge Base` : "Paper Abstract | Knowledge Base",
        description: paper?.abstract ? paper.abstract.slice(0, 160) : "Read the full research paper abstract.",
    };
}

export default async function AbstractPage({ params }) {
    const { slug } = await params;

    let papers = [];
    try {
        papers = await fetchPaperSubmissions(KNOWLEDGE_BASE_QUERY);
    } catch {
        notFound();
    }

    const paper = papers.find((p) => slugify(p.title || "untitled-paper") === slug);
    if (!paper) notFound();

    const pdfUrl = extractPdfUrl(paper.pdf);
    const pdfMeta = extractPdfMeta(paper.pdf);

    return (
        <div className="min-h-screen bg-[#f6f3eb]">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden border-b border-slate-200/60">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(20,83,45,0.06),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(15,23,42,0.04),transparent_40%)]" />

                <div className="container relative pt-[67px] pb-[67px] md:pt-[83px] md:pb-[83px] lg:pt-[99px] lg:pb-[99px] xl:pt-[115px] xl:pb-[115px]">
                    {/* Back link */}
                    <Link
                        href="/knowledge-base"
                        className="group mb-10 mt-10 inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-emerald-800 transition-colors hover:text-emerald-600"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        BACK TO ARCHIVE
                    </Link>

                    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                        {/* ─ Left: Title + meta ─ */}
                        <div className="min-w-0">
                            <span className="inline-flex items-center rounded-full border border-emerald-900/10 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-800 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur">
                                {paper.primarySector}
                            </span>

                            <h1 className="mt-6 break-words text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.12]">
                                {paper.title || "Untitled Paper"}
                            </h1>

                            <div className="mt-10 mb-10 grid gap-4 sm:grid-cols-3">
                                <MetaCard icon={UserRound} label="Author" value={paper.authorName || "Not provided"} />
                                <MetaCard icon={Building2} label="University / Institution" value={paper.affiliation || "Not provided"} />
                                <MetaCard icon={CalendarDays} label="Archive Date" value={formatSubmissionDate(paper.submittedDate)} />
                            </div>
                        </div>

                        {/* ─ Right: PDF Card with Compact Gated Preview ─ */}
                        <aside className="xl:sticky xl:top-8">
                            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] mb-10">
                                {/* Simulated PDF cover page preview (compact) */}
                                <div className="relative flex h-[215px] flex-col bg-white p-5 overflow-hidden select-none border-b border-slate-100">
                                    {pdfUrl ? (
                                        <>
                                            {/* Top mini header */}
                                            <div className="w-full flex justify-between items-center text-[8px] font-bold tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                                                <span>ENERGDIVE RESEARCH ARCHIVE</span>
                                                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[8px]">{pdfMeta?.size || "PDF"}</span>
                                            </div>

                                            {/* Document Title */}
                                            <div className="mt-3 text-left">
                                                <h3 className="font-serif text-xs font-bold leading-snug text-slate-900 line-clamp-2">
                                                    {paper.title || "Untitled Paper"}
                                                </h3>
                                                <p className="mt-1 font-serif text-[9px] text-slate-500">
                                                    By <span className="font-semibold text-slate-700">{paper.authorName || "Anonymous"}</span>
                                                    {paper.affiliation ? ` • ${paper.affiliation}` : ""}
                                                </p>
                                            </div>

                                            {/* Abstract Excerpt Preview */}
                                            <div className="mt-2 text-left">
                                                <p className="font-serif text-[9px] leading-normal text-slate-400 line-clamp-1 italic">
                                                    &ldquo;{paper.abstract || "No abstract details available for this paper."}&rdquo;
                                                </p>
                                            </div>

                                            {/* Lock overlay banner */}
                                            {/* <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-2.5">
                                                <div className="flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-1 text-[8px] font-semibold text-white shadow-sm backdrop-blur">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span>Gated Document Preview</span>
                                                </div>
                                            </div> */}
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-inner">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <p className="mt-3 text-xs font-bold text-slate-800">
                                                {paper.title || "Research Paper"}
                                            </p>
                                            <p className="mt-1 text-[10px] text-slate-400 max-w-[180px]">
                                                No PDF document attached.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Download actions */}
                                <div className="border-t border-slate-200/60 bg-white p-6 pb-8">
                                    {pdfUrl ? (
                                        <div className="flex flex-col gap-3">
                                            <Link
                                                href={`/knowledge-base/abstract/${slug}/download`}
                                                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
                                            >
                                                <Download className="h-[18px] w-[18px] transition-transform group-hover:translate-y-0.5" />
                                                Save & Download
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-medium text-slate-400">
                                            <Download className="h-4 w-4" />
                                            PDF coming soon
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {/* ── Abstract ── */}
            <section className="bg-white py-16 md:py-24">
                <div className="container">
                    <div className="max-w-4xl">
                        <h2 className="mb-10 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950">
                            <FileText className="h-8 w-8 text-emerald-700" />
                            Abstract
                        </h2>

                        <div className="rounded-[32px] border border-slate-200/80 bg-[#faf8f2]/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] sm:p-12">
                            {paper.abstract ? (
                                <p className="whitespace-pre-wrap text-[17px] leading-[1.9] text-slate-700 sm:text-lg">
                                    {paper.abstract}
                                </p>
                            ) : (
                                <p className="text-base italic text-slate-400">
                                    Abstract not available for this paper.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function MetaCard({ icon: Icon, label, value }) {
    return (
        <div className="rounded-[22px] border border-slate-200/80 bg-white/70 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Icon className="h-3.5 w-3.5 text-emerald-800" />
                {label}
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
        </div>
    );
}
