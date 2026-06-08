import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

const abstractRequirements = [
    "Title",
    "Background",
    "Objectives",
    "Methodology, where applicable",
    "Key Findings",
    "Relevance to Industry",
];

const paperLengths = [
    { category: "Research Papers", length: "3,000-8,000 words" },
    { category: "Sector Outlooks", length: "2,500-6,000 words" },
    { category: "Case Studies", length: "2,000-5,000 words" },
    { category: "White Papers", length: "2,500-8,000 words" },
    { category: "Technical Notes", length: "1,500-4,000 words" },
    { category: "Knowledge Briefs", length: "1,000-3,000 words" },
];

const formatRequirements = [
    "MS Word preferred",
    "PDF optional",
    "Tables and figures allowed",
    "References encouraged",
    "Original content only",
];

const authorInformation = [
    "Name",
    "Organization",
    "Designation",
    "Biography, 100 words",
    "LinkedIn Profile",
    "Email Address",
];

const editorialCriteria = [
    "Originality",
    "Relevance",
    "Quality of analysis",
    "Industry impact",
    "Clarity of communication",
    "Evidence and supporting data",
];

export default function AuthorGuidelinesPage() {
    return (
        <div className="bg-white text-zinc-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-[#f6f3eb] pb-16 pt-16 md:pb-20 md:pt-20">
                <div className="container relative max-w-4xl">
                    <div className="inline-flex items-center gap-2 border border-emerald-900/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm mt-3">
                        <BookOpen className="h-4 w-4" />
                        Author Guidelines
                    </div>

                    <h1 className="mt-7 break-words text-5xl font-black leading-[0.95] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
                        Submission Requirements
                    </h1>

                    <p className="mt-6 text-xl font-semibold leading-8 text-zinc-800">
                        Guidelines to prepare and format your contributions for the Insights Exchange.
                    </p>

                    <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
                        Authors should first submit an abstract of approximately 300-500 words. Once accepted, the
                        full paper can be submitted according to the category guidance below.
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
                            href="/energdive-insights-exchange/call-for-papers"
                            className="inline-flex items-center justify-center gap-2 border border-zinc-950 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                        >
                            Call for Papers
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Abstract and Full Paper Section */}
            <section className="bg-[#f8faf9] py-16 md:py-20">
                <div className="container">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <InfoList
                            eyebrow="Abstract"
                            title="What the abstract should contain"
                            items={abstractRequirements}
                        />

                        <div className="border border-zinc-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#00A651]">
                                Full Paper Guidelines
                            </p>
                            <h3 className="mt-3 text-2xl font-black text-zinc-950">Recommended length</h3>
                            <div className="mt-6 overflow-hidden border border-zinc-200">
                                {paperLengths.map((row) => (
                                    <div
                                        key={row.category}
                                        className="grid grid-cols-[minmax(0,1fr)_145px] border-b border-zinc-200 last:border-b-0"
                                    >
                                        <div className="bg-white px-4 py-3 text-sm font-bold text-zinc-800">
                                            {row.category}
                                        </div>
                                        <div className="bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600">
                                            {row.length}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Format, Author and Editorial Criteria Section */}
            <section className="bg-white py-16 md:py-20">
                <div className="container">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <InfoList eyebrow="Format" title="Document guidance" items={formatRequirements} />
                        <InfoList
                            eyebrow="Author / Co-author"
                            title="Information to include"
                            items={authorInformation}
                        />
                        <InfoList
                            eyebrow="Editorial Criteria"
                            title="How submissions are evaluated"
                            items={editorialCriteria}
                        />
                    </div>
                </div>
            </section>

            {/* Bottom CTA Section */}
            <section className="bg-zinc-950 py-16 text-white md:py-20">
                <div className="container max-w-4xl text-center">
                    <h2 className="text-3xl font-black sm:text-4xl">Ready to share your findings?</h2>
                    <p className="mt-4 text-zinc-400 max-w-xl mx-auto text-sm leading-7">
                        Review the editorial steps and criteria. Learn about our review phases and how to submit revisions.
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
                            href="/energdive-insights-exchange/editorial-review-process"
                            className="inline-flex items-center justify-center gap-2 border border-white/20 bg-white/[0.05] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/[0.1] hover:border-white/40"
                        >
                            Editorial Review Process
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function InfoList({ eyebrow, title, items }) {
    return (
        <article className="border border-zinc-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#00A651]">{eyebrow}</p>
            <h2 className="mt-3 text-2xl font-black text-zinc-950">{title}</h2>
            <ul className="mt-6 space-y-4">
                {items.map((item) => (
                    <li key={item} className="flex gap-3">
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#00A651]" />
                        <span className="text-sm leading-7 text-zinc-600">{item}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}
