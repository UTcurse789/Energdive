import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Briefcase,
    CheckCircle2,
    FileText,
    Lightbulb,
    Megaphone,
    TrendingUp,
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

const submissionProcess = [
    { stage: "Stage 1", title: "Abstract Submission" },
    { stage: "Stage 2", title: "Abstract Review" },
    { stage: "Stage 3", title: "Full Paper Submission" },
    { stage: "Stage 4", title: "Editorial Review" },
    { stage: "Stage 5", title: "Publication" },
];

const topicsOfInterest = [
    {
        sector: "Oil & Gas",
        topics: ["LPG", "Oil Markets", "Petrochemicals", "Pipelines", "Refining", "Retail", "Upstream"],
    },
    {
        sector: "Power Generation",
        topics: ["Nuclear", "Thermal"],
    },
    {
        sector: "Renewables",
        topics: ["Biopower", "Hydro", "Solar", "Waste-to-energy", "Wind"],
    },
    {
        sector: "Transmission",
        topics: ["Smart Grid"],
    },
    {
        sector: "Distribution",
        topics: ["EV charging", "Smart Cities", "Smart Meter & AMI"],
    },
    {
        sector: "Electricity Markets",
        topics: ["New Energies"],
    },
    {
        sector: "New Energies",
        topics: ["Green Hydrogen"],
    },
    {
        sector: "Energy Storage",
        topics: ["BESS", "Pumped Hydro"],
    },
    {
        sector: "Sustainability & Safety",
        topics: ["Energy Efficiency", "Environment", "Industrial & Process Safety", "Occupational Health"],
    },
];

export default function CallForPapersPage() {
    return (
        <div className="bg-white text-zinc-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#f6f3eb] pb-12 pt-12 md:pb-16 md:pt-16">
                <div className="mx-auto w-full max-w-4xl px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 relative flex flex-col items-center text-center">
                    <div className="min-w-0 max-w-3xl flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 border border-emerald-900/10 bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-800 shadow-xs mt-2">
                            <Megaphone className="h-3.5 w-3.5" />
                            Call for Papers
                        </div>

                        <h1 className="mt-5 break-words text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
                            Share Your Insights with India&apos;s Energy Community
                        </h1>

                        <p className="mt-4 text-lg font-bold leading-7 text-zinc-800">
                            Join India&apos;s leading platform for applied energy insights and practical research.
                        </p>

                        <p className="mt-3.5 text-[14px] leading-6 text-zinc-600">
                            The ENERGDIVE Insights Exchange invites submissions from professionals, researchers,
                            academics, students, consultants, think tanks, startups, and organizations working across
                            the energy ecosystem.
                        </p>

                        <p className="mt-3 text-[14px] leading-6 text-zinc-600">
                            We welcome original contributions that advance understanding, stimulate discussion, and
                            provide actionable insights on topics related to India&apos;s energy transition.
                        </p>

                        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row justify-center w-full sm:w-auto">
                            <Link
                                href="/knowledge-base/submit"
                                className="inline-flex items-center justify-center gap-2 bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#00A651]"
                            >
                                Submit Abstract
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <Link
                                href="/knowledge-base"
                                className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                            >
                                Browse Papers
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Categories Section */}
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

            {/* Submission Process Section */}
            <section className="bg-[#f8faf9] py-16 md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                                Submission Process
                            </p>
                            <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">
                                Simple five-stage author journey
                            </h2>
                            <p className="mt-5 text-base leading-8 text-zinc-600">
                                EIX uses a structured, transparent process to guide your paper from abstract to final publication, ensuring quality review at every step.
                            </p>
                        </div>

                        <div className="border border-zinc-200 bg-[#f8faf9] p-6 md:p-8">
                            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                                Submission Stages
                            </h3>
                            <div className="mt-6 grid gap-3">
                                {submissionProcess.map((step, index) => (
                                    <div key={step.title} className="flex gap-4 border border-zinc-200 bg-white p-4">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#00A651] text-sm font-black text-white">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                {step.stage}
                                            </p>
                                            <p className="mt-1 text-base font-black text-zinc-950">{step.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Topics of Interest Section */}
            <section className="bg-white py-16 md:py-20">
                <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12">
                    <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#00A651]">
                                Topics of Interest
                            </p>
                            <h2 className="mt-3 text-3xl font-black text-zinc-950 sm:text-4xl">
                                Areas EIX is currently accepting
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-zinc-500">
                            Submissions may address technologies, markets, policies, implementation learnings, and
                            practical challenges across these focus areas.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {topicsOfInterest.map((item) => (
                            <article key={item.sector} className="border border-zinc-200 bg-white p-5">
                                <h4 className="text-lg font-black text-zinc-950">{item.sector}</h4>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {item.topics.map((topic) => (
                                        <span
                                            key={topic}
                                            className="border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mt-10 border-l-4 border-[#00A651] bg-[#f6f3eb] p-5">
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Important Note</p>
                        <p className="mt-3 text-sm leading-7 text-zinc-700">
                            EIX is a knowledge-sharing and industry engagement platform. While all submissions undergo
                            editorial review, EIX is not a peer-reviewed academic journal.
                        </p>
                    </div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section className="bg-zinc-950 py-16 text-white md:py-20">
                <div className="mx-auto w-full max-w-4xl px-6 md:px-10 lg:px-16 xl:px-24 2xl:px-12 text-center">
                    <h2 className="text-3xl font-black sm:text-4xl">Ready to contribute to India&apos;s energy intelligence?</h2>
                    <p className="mt-4 text-zinc-400 max-w-xl mx-auto text-sm leading-7">
                        Submit your 300-500 word abstract to get started. Be sure to review our author guidelines for template, format, and formatting requirements.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            href="/knowledge-base/submit"
                            className="inline-flex items-center justify-center gap-2 bg-[#00A651] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-emerald-600"
                        >
                            Submit Abstract
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/energdive-insights-exchange/author-guidelines"
                            className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/[0.05] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/[0.1] hover:border-white/40"
                        >
                            Author Guidelines
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
