import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Briefcase,
    Building2,
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
    Users,
    Wrench,
} from "lucide-react";

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


export default function EnergdiveInsightsExchangePage() {
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
                            A curated knowledge platform powered by ENERGClub, EIX enables professionals, researchers, academics, consultants, policymakers, and innovators to publish and discover research papers, white papers, case studies, technical notes, and industry insights on India's energy sector.
                        </p>

                        <p className="mt-3 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                            Research Papers • Sector Outlooks • Case Studies • White Papers • Technical Notes • Knowledge Briefs
                        </p>

                        <div className="mt-7 mb-4 flex flex-col gap-2.5 sm:flex-row justify-center w-full sm:w-auto">
                            <Link
                                href="/knowledge-base"
                                className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                            >
                                Browse Papers
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                href="/knowledge-base/submit"
                                className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                            >
                                Submit a Paper
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
                            Paper Categories
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

            <section className="bg-[#f8faf9] py-16 md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                            Who Can Contribute
                        </p>
                        <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">
                            Built for the full energy ecosystem
                        </h2>
                        <p className="mt-5 text-base leading-8 text-zinc-600">
                            EIX welcomes knowledge contributions from professionals and institutions working across
                            India&apos;s energy transition, including research, policy, operations, markets, technology,
                            and implementation.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
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
                </div>
            </section>

            <section className="bg-zinc-950 py-16 text-white md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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

            <section className="bg-white py-12 md:py-14">
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
                                href="/energdive-insights-exchange/call-for-papers"
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
                                href="/energdive-insights-exchange/author-guidelines"
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
                                href="/energdive-insights-exchange/editorial-review-process"
                                className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#00A651] hover:text-[#008c43] group"
                            >
                                Learn More
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </article>
                    </div>
                </div>
            </section>

            <section className="bg-white py-16 md:py-20">
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
