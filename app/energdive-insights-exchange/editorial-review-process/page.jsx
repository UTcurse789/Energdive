import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

const editorialChecks = [
    "Relevance",
    "Originality",
    "Practical value",
    "Clarity",
    "Factual accuracy",
    "Industry significance",
];

const editorialSteps = [
    "Initial screening for scope, quality, and originality.",
    "Editorial review and assessment.",
    "Subject matter review, where required.",
    "Author revisions and clarifications.",
    "Final approval and publication.",
];

const reviewStages = [
    {
        title: "Stage 1: Abstract Submission",
        description: "Authors submit the title, category, abstract, keywords, and author information.",
        items: ["Title", "Category", "Abstract", "Keywords", "Author Information"],
    },
    {
        title: "Stage 2: Abstract Review",
        description: "The editorial team assesses relevance, scope, quality, and alignment with EIX objectives.",
        items: ["Accepted", "Revision Requested", "Declined"],
    },
    {
        title: "Stage 3: Full Paper Submission",
        description: "Authors upload the complete paper and supporting materials.",
        items: ["Complete paper", "Supporting materials", "Author clarifications, where required"],
    },
    {
        title: "Stage 4: Editorial Review",
        description:
            "The editorial team evaluates quality, originality, factual accuracy, industry relevance, and presentation. Subject matter experts may be consulted where necessary.",
        items: ["Quality of content", "Originality", "Factual accuracy", "Industry relevance", "Presentation"],
    },
    {
        title: "Stage 5: Publication",
        description: "Accepted papers are published and distributed through ENERGDIVE and ENERGClub channels.",
        items: [
            "Published on EIX",
            "Indexed within EIX categories",
            "Promoted through ENERGDIVE channels",
            "Shared with the ENERGClub community",
        ],
    },
];

export default function EditorialReviewProcessPage() {
    return (
        <div className="bg-white text-zinc-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#f6f3eb] pb-16 pt-16 md:pb-20 md:pt-20">
                <div className="container relative max-w-4xl">
                    <div className="inline-flex items-center gap-2 border border-emerald-900/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm mt-3">
                        <ShieldCheck className="h-4 w-4" />
                        Review Process
                    </div>

                    <h1 className="mt-7 break-words text-5xl font-black leading-[0.95] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
                        How EIX Reviews Submissions
                    </h1>

                    <p className="mt-6 text-xl font-semibold leading-8 text-zinc-800">
                        Understanding our review criteria, editorial timeline, and quality evaluations.
                    </p>

                    <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
                        EIX uses a staged editorial process to assess scope, relevance, quality, originality,
                        industry value, and publication readiness while keeping the author journey clear.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/knowledge-base/submit"
                            className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                        >
                            Submit Abstract
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/energdive-insights-exchange/author-guidelines"
                            className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                        >
                            Author Guidelines
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Editorial Methodology Section */}
            <section className="bg-zinc-950 py-16 text-white md:py-20">
                <div className="container grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div>
                        <div className="inline-flex h-12 w-12 items-center justify-center bg-[#00A651] text-white">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">
                            Editorial Methodology
                        </p>
                        <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                            Editor-reviewed for relevance and practical value
                        </h2>
                        <p className="mt-5 text-base leading-8 text-zinc-300">
                            All submissions are reviewed for relevance, originality, clarity, accuracy, and alignment
                            with the objectives of the platform. The process focuses on practical value, quality, and
                            industry relevance rather than academic peer review.
                        </p>
                        <p className="mt-5 border-l-4 border-[#00A651] pl-5 text-sm font-semibold leading-7 text-zinc-200">
                            EIX is an editor-reviewed knowledge platform and not a peer-reviewed academic journal.
                        </p>
                    </div>

                    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">
                                Review assesses
                            </h3>
                            <div className="mt-5 grid gap-3">
                                {editorialChecks.map((item) => (
                                    <div key={item} className="flex items-center gap-3 border border-white/10 bg-white/[0.04] p-3">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                                        <span className="text-sm font-semibold text-zinc-100">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">
                                Process
                            </h3>
                            <ol className="mt-5 space-y-4">
                                {editorialSteps.map((step, index) => (
                                    <li key={step} className="flex gap-4">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-sm font-black text-zinc-950">
                                            {index + 1}
                                        </span>
                                        <p className="pt-1 text-sm leading-7 text-zinc-300">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* Review Stages Section */}
            <section className="bg-white py-16 md:py-20">
                <div className="container">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                                Editorial & Review Process
                            </p>
                            <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">
                                Staged process detail
                            </h2>
                            <p className="mt-5 text-base leading-8 text-zinc-600">
                                Each stage helps refine and evaluate the contribution, keeping communication simple and expectations transparent.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {reviewStages.map((stage, index) => (
                                <article key={stage.title} className="border border-zinc-200 bg-[#f8faf9] p-5">
                                    <div className="flex gap-4">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#00A651] text-sm font-black text-white">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-black text-zinc-950">{stage.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-zinc-600">{stage.description}</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {stage.items.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Disclaimer & Final CTAs Section */}
            <section className="bg-[#f8faf9] py-16 md:py-20">
                <div className="container">
                    <div className="grid gap-8 border border-zinc-200 bg-zinc-50 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-zinc-500">
                                Disclaimer
                            </p>
                            <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-600">
                                Content published through the ENERGDIVE Insights Exchange reflects the views, analysis,
                                and conclusions of the respective authors. While submissions are reviewed by the
                                ENERGDIVE editorial team for quality, relevance, and suitability, EIX is not a
                                peer-reviewed academic journal, and publication should not be interpreted as an
                                endorsement of the views expressed by contributors.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                            <Link
                                href="/knowledge-base"
                                className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                            >
                                Browse Papers
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/knowledge-base/submit"
                                className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                            >
                                Submit Abstract
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
