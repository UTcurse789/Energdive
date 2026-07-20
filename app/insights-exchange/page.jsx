import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Briefcase,
    Building2,
    CalendarDays,
    CheckCircle2,
    FileText,
    GraduationCap,
    Landmark,
    LibraryBig,
    Lightbulb,
    Megaphone,
    Search,
    ShieldCheck,
    TrendingUp,
    UserRound,
    Users,
    Wrench,
} from "lucide-react";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";
import { formatSubmissionDate, truncateText } from "@/lib/paper-submissions";

const contentCategories = [
    {
        title: "Research Papers",
        description:
            "Original research, analysis, and data-driven studies addressing opportunities, challenges, and developments across the energy sector.",
        Icon: FileText,
    },
    {
        title: "Sector Outlooks",
        description:
            "Forward-looking assessments of markets, technologies, policies, and industry trends.",
        Icon: TrendingUp,
    },
    {
        title: "Case Studies",
        description:
            "Practical experiences, project learnings, implementation journeys, and real-world outcomes.",
        Icon: Briefcase,
    },
    {
        title: "White Papers",
        description:
            "Strategic perspectives, industry frameworks, technology insights, and thought leadership contributions.",
        Icon: Lightbulb,
    },
    {
        title: "Technical Notes",
        description:
            "Focused technical, operational, regulatory, or policy-oriented papers.",
        Icon: Wrench,
    },
    {
        title: "Knowledge Briefs",
        description:
            "Concise summaries, reviews, research digests, and actionable insights for industry stakeholders.",
        Icon: BookOpen,
    },
];

const contributorGroups = [
    { label: "Industry Professionals", Icon: Building2 },
    { label: "Academics", Icon: GraduationCap },
    { label: "Researchers", Icon: Search },
    { label: "Consultants", Icon: Briefcase },
    { label: "Policymakers", Icon: Landmark },
    { label: "Startup Founders and Professionals", Icon: Users },
];

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

const contributorBenefits = [
    "Showcase expertise and thought leadership.",
    "Share research, insights, and practical experiences with a wider audience.",
    "Reach industry professionals, decision-makers, and stakeholders.",
    "Contribute to informed discussions shaping India's energy future.",
    "Build professional visibility within the energy ecosystem.",
];

const readerBenefits = [
    "Access high-quality industry knowledge and analysis.",
    "Explore emerging technologies, trends, and market developments.",
    "Learn from real-world case studies and practical experiences.",
    "Discover research translated into actionable insights.",
    "Stay informed on the opportunities and challenges shaping the energy transition.",
];

const submissionPrinciples = [
    "Provide original insights, analysis, research, or practical experiences.",
    "Be supported by credible data, references, or evidence where applicable.",
    "Maintain objectivity, professionalism, and factual accuracy.",
    "Contribute meaningfully to industry knowledge and understanding.",
    "Deliver value to professionals, businesses, researchers, policymakers, and other stakeholders.",
    "Avoid promotional, sales-oriented, or purely marketing-focused content.",
];


const EIX_PAPERS_QUERY =
    "populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[sectors][populate][parent][fields][0]=name&populate[sectors][populate][parent][fields][1]=slug&populate[abstract_pdf][fields][0]=url&populate[final_paper_submissions][fields][0]=final_status&populate[final_paper_submissions][fields][1]=final_submission_date&populate[final_paper_submissions][populate][full_paper][fields][0]=url&sort[0]=submitted_date:desc&pagination[pageSize]=100";

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export default async function EnergdiveInsightsExchangePage() {
    let papers = [];
    try {
        const submissions = await fetchPaperSubmissions(EIX_PAPERS_QUERY);
        papers = submissions.filter((paper) => paper.status === "accepted").slice(0, 6);
    } catch {
        // silently fail – section just won't render
    }

    return (
        <div className="bg-white text-zinc-950">
            <section className="relative overflow-hidden bg-[#f6f3eb]">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 relative flex flex-col items-center text-center pb-12 pt-12 md:pb-16 md:pt-16">
                    <div className="min-w-0 max-w-3xl flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 border border-emerald-900/10 bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800 shadow-xs mt-2">
                            <LibraryBig className="h-3.5 w-3.5" />
                            Powered by ENERGClub
                        </div>

                        <h1 className="mt-5 break-words text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
                            ENERGDIVE Insights Exchange <span className="inline-block text-[#00A651]">(EIX)</span>
                        </h1>

                        <p className="mt-4 text-lg font-bold leading-7 text-zinc-800">
                            Where Knowledge Powers Energy Transition
                        </p>

                        <p className="mt-3.5 max-w-2xl text-[14px] leading-6 text-zinc-600">
                            A curated knowledge platform powered by ENERGClub, EIX enables professionals, researchers, academics, consultants, policymakers, and innovators to publish and discover research papers, white papers, case studies, technical notes, and industry insights on India&apos;s energy sector.
                        </p>

                        <p className="mt-3 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                            Research Papers • Sector Outlooks • Case Studies • White Papers • Technical Notes • Knowledge Briefs
                        </p>

                        <div className="mt-7 mb-4 flex flex-col gap-2.5 sm:flex-row justify-center w-full sm:w-auto">
                            <Link
                                href="/knowledge-hub"
                                className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                            >
                                Browse Papers
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                href="/knowledge-hub/submit"
                                className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                            >
                                Submit a Abstract
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-16 md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-black text-zinc-950 sm:text-3xl">
                            Categories
                        </h2>
                    </div>

                    <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {contentCategories.map(({ title, description, Icon }) => (
                            <article
                                key={title}
                                className="border border-zinc-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-colors hover:border-[#00A651]/60"
                            >
                                <div className="flex h-9 w-9 items-center justify-center bg-[#00A651]/10 text-[#00A651]">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <h3 className="mt-3 text-base font-black text-zinc-950">{title}</h3>
                                <p className="mt-2 text-[13px] leading-6 text-zinc-600">{description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#f8faf9] py-10 md:py-12">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 flex flex-col items-center">
                    <h2 className="text-center text-3xl font-black text-zinc-950 sm:text-4xl">
                        Who Can Contribute
                    </h2>

                    <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {contributorGroups.map(({ label, Icon }) => (
                            <div key={label} className="flex items-center gap-3 border border-zinc-200 bg-white p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-[#00A651]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold leading-6 text-zinc-800">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-white py-16 md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
                    <div className="grid gap-12 lg:grid-cols-2">
                        <InfoList
                            eyebrow="For Contributors"
                            title="Share expertise with a wider industry audience"
                            items={contributorBenefits}
                        />
                        <InfoList
                            eyebrow="For Readers"
                            title="Access research translated into useful insight"
                            items={readerBenefits}
                        />
                    </div>

                    <div className="mt-8 flex justify-center border-zinc-200 bg-[#f8faf9] px-6 py-5">
                        <Link
                            href="/knowledge-hub/submit"
                            className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                        >
                            Submit Your Abstract
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Published Papers ── */}
            {papers.length > 0 && (
                <section className="bg-[#f6f3eb] py-16 md:py-20">
                    <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                                    Published Papers
                                </h2>
                            </div>
                            <Link
                                href="/knowledge-hub"
                                className="inline-flex items-center gap-2 text-sm font-bold text-zinc-950 transition-colors hover:text-[#00A651] group"
                            >
                                View All Papers
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {papers.map((paper) => (
                                <article
                                    key={paper.id}
                                    className="flex h-full flex-col border border-zinc-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00A651]/60 hover:shadow-[0_24px_54px_rgba(15,23,42,0.09)]"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                                            {paper.primarySector}
                                        </span>
                                        <span className="text-xs font-medium text-zinc-500">
                                            {formatSubmissionDate(paper.submittedDate)}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 break-words text-lg font-black leading-tight text-zinc-950">
                                        {truncateText(paper.title || "Untitled paper", 60)}
                                    </h3>

                                    <p className="mt-3 flex-1 break-words text-[13px] leading-6 text-zinc-600">
                                        {truncateText(paper.abstract, 140) || "Abstract not available."}
                                    </p>

                                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-200/80 pt-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                                                <UserRound className="h-3 w-3 text-[#00A651]" />
                                                Author
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900 line-clamp-1">{paper.authorName || "Not provided"}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                                                <Building2 className="h-3 w-3 text-[#00A651]" />
                                                University
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900 line-clamp-1">{paper.affiliation || "Not provided"}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                                                <CalendarDays className="h-3 w-3 text-[#00A651]" />
                                                Date
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900 line-clamp-1">{formatSubmissionDate(paper.submittedDate)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-zinc-200/80">
                                        <Link
                                            href={`/knowledge-hub/abstract/${slugify(paper.title || "untitled-paper")}`}
                                            className="inline-flex w-full items-center justify-center gap-2 bg-zinc-950 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                                        >
                                            Read more
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Link
                                href="/knowledge-hub"
                                className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                            >
                                View More Papers
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <section className="bg-[#f8faf9] py-16 text-[#1A1A1A] md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div>
                        <div className="inline-flex h-12 w-12 items-center justify-center bg-[#00A651] text-white">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                            Editorial Methodology
                        </p>
                        <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                            Editor-reviewed for relevance and practical value
                        </h2>
                        <p className="mt-5 text-base leading-8 text-zinc-700">
                            All submissions are reviewed for relevance, originality, clarity, accuracy, and alignment
                            with the objectives of the platform. The process focuses on practical value, quality, and
                            industry relevance rather than academic peer review.
                        </p>
                        <p className="mt-5 border-l-4 border-[#00A651] pl-5 text-sm font-semibold leading-7 text-zinc-800">
                            EIX is an editor-reviewed knowledge platform and not a peer-reviewed academic journal.
                        </p>
                    </div>

                    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                                Review assesses
                            </h3>
                            <div className="mt-5 grid gap-3">
                                {editorialChecks.map((item) => (
                                    <div key={item} className="flex items-center gap-3 border border-zinc-200 bg-white p-3 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00A651]" />
                                        <span className="text-sm font-semibold text-zinc-800">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                                Process
                            </h3>
                            <ol className="mt-5 space-y-4">
                                {editorialSteps.map((step, index) => (
                                    <li key={step} className="flex gap-4">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-zinc-950 text-sm font-black text-white">
                                            {index + 1}
                                        </span>
                                        <p className="pt-1 text-sm leading-7 text-zinc-700">{step}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#f6f3eb] py-12 md:py-14">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                            Submission Principles
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                            What EIX contributions should deliver
                        </h2>
                    </div>

                    <div className="grid gap-2">
                        {submissionPrinciples.map((principle) => (
                            <div key={principle} className="flex gap-2 border border-zinc-200 bg-white p-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A651]" />
                                <p className="text-[13px] leading-6 text-zinc-700">{principle}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-white py-10 md:py-8">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
                    <div className="max-w-3xl">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                            Explore EIX
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-zinc-950 sm:text-3xl">
                            Guidelines, templates, and review process
                        </h2>
                    </div>

                    <div className="mt-8 grid gap-3 md:grid-cols-3">
                        <article className="flex flex-col border border-zinc-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-colors hover:border-[#00A651]/60">
                            <div className="flex h-9 w-9 items-center justify-center bg-[#00A651]/10 text-[#00A651]">
                                <Megaphone className="h-4 w-4" />
                            </div>
                            <h3 className="mt-3 text-base font-black text-zinc-950">Call for Papers</h3>
                            <p className="mt-2 text-[13px] leading-6 text-zinc-600 flex-1">
                                Learn about the current topics of interest, accepted submission streams, and how you can share your insights.
                            </p>
                            <Link
                                href="/insights-exchange/call-for-papers"
                                className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#00A651] hover:text-[#008c43] group"
                            >
                                Learn More
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </article>

                        <article className="flex flex-col border border-zinc-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-colors hover:border-[#00A651]/60">
                            <div className="flex h-9 w-9 items-center justify-center bg-[#00A651]/10 text-[#00A651]">
                                <BookOpen className="h-4 w-4" />
                            </div>
                            <h3 className="mt-3 text-base font-black text-zinc-950">Author Guidelines</h3>
                            <p className="mt-2 text-[13px] leading-6 text-zinc-600 flex-1">
                                Check document formatting guidelines, recommended word limits, required biography details, and evaluation criteria.
                            </p>
                            <Link
                                href="/insights-exchange/author-guidelines"
                                className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#00A651] hover:text-[#008c43] group"
                            >
                                Learn More
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </article>

                        <article className="flex flex-col border border-zinc-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition-colors hover:border-[#00A651]/60">
                            <div className="flex h-9 w-9 items-center justify-center bg-[#00A651]/10 text-[#00A651]">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <h3 className="mt-3 text-base font-black text-zinc-950">Editorial & Review Process</h3>
                            <p className="mt-2 text-[13px] leading-6 text-zinc-600 flex-1">
                                Understand our staged review process, timeline from abstract submission to publication, and review parameters.
                            </p>
                            <Link
                                href="/insights-exchange/editorial-review-process"
                                className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#00A651] hover:text-[#008c43] group"
                            >
                                Learn More
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </article>
                    </div>
                </div>
            </section>

            <section className="bg-white py-10 md:py-8">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
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
                                href="/knowledge-hub"
                                className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                            >
                                Browse Papers
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/knowledge-hub/submit"
                                className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                            >
                                Submit a Paper
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function InfoList({ eyebrow, title, items }) {
    return (
        <article className="border border-zinc-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#00A651]">{eyebrow}</p>
            <h2 className="mt-2 text-lg font-black text-zinc-950">{title}</h2>
            <ul className="mt-4 space-y-3">
                {items.map((item) => (
                    <li key={item} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A651]" />
                        <span className="text-[13px] leading-6 text-zinc-600">{item}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}
