"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChevronLeft, ChevronRight, ArrowUpRight, Quote, Mic } from "lucide-react";
import { slugify } from "@/lib/utils";

export interface OpinionItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    authorName: string;
    authorAvatar: string;
    authorRole: string;
    date: string;
    imageCaption?: string;
}

export function OpinionSection({
    opinions = [],
    interviews = [],
}: {
    opinions: OpinionItem[],
    interviews: OpinionItem[],
}) {
    const [opinionIndex, setOpinionIndex] = useState(0);
    const [interviewIndex, setInterviewIndex] = useState(0);

    // Opinion navigation
    const opinionNext = useCallback(() => {
        setOpinionIndex((i) => (i + 1) % Math.max(opinions.length, 1));
    }, [opinions.length]);
    const opinionPrev = useCallback(() => {
        setOpinionIndex((i) => (i - 1 + opinions.length) % Math.max(opinions.length, 1));
    }, [opinions.length]);

    // Interview navigation
    const interviewNext = useCallback(() => {
        setInterviewIndex((i) => (i + 1) % Math.max(interviews.length, 1));
    }, [interviews.length]);
    const interviewPrev = useCallback(() => {
        setInterviewIndex((i) => (i - 1 + interviews.length) % Math.max(interviews.length, 1));
    }, [interviews.length]);

    if (opinions.length === 0 && interviews.length === 0) return null;

    const currentOpinion = opinions[opinionIndex];
    const currentInterview = interviews[interviewIndex];

    return (
        <>
            {/* ═══════════════════════════════════════════════
                OPINION SECTION — Compact Editorial Portrait Layout
            ═══════════════════════════════════════════════ */}
            {opinions.length > 0 && (
                <section
                    aria-label="Opinion & Commentary"
                    className="py-6 lg:py-8 bg-[#FAFAF8] border-b border-zinc-200"
                >
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

                        {/* Section Heading */}
                        <SectionHeading
                            title="Opinion"
                            linkText="View All"
                            linkHref="/opinion"
                            adPlacement="home_opinion"
                        />

                        {/* ── MAIN EDITORIAL CARD ── */}
                        <article className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-zinc-200 bg-white shadow-sm overflow-hidden">

                            {/* LEFT — Portrait Image (Compact 3 Cols) */}
                            <div className="lg:col-span-3 relative min-h-[180px] lg:min-h-0 group/img">
                                <Link
                                    href={`/opinion/${currentOpinion.slug}`}
                                    className="block w-full h-full absolute inset-0"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    <Image
                                        src={currentOpinion.image}
                                        alt={currentOpinion.imageCaption || currentOpinion.authorName}
                                        fill
                                        className="object-cover object-top grayscale group-hover/img:grayscale-0 transition-all duration-700"
                                        sizes="(max-width: 1024px) 100vw, 25vw"
                                    />
                                    {/* Dark gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                </Link>

                                {/* OPINION stamp badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className="inline-flex items-center gap-1.5 bg-[#00A651] text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1">
                                        <Quote size={8} />
                                        Opinion
                                    </span>
                                </div>

                                {/* Author name anchored bottom */}
                                <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3">
                                    <p className="text-white/70 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">
                                        {currentOpinion.imageCaption || "Columnist"}
                                    </p>
                                    <Link
                                        href={`/author/${slugify(currentOpinion.authorName)}`}
                                        className="text-white font-black text-xs uppercase tracking-wider hover:text-[#00A651] transition-colors"
                                    >
                                        {currentOpinion.authorName}
                                    </Link>
                                </div>
                            </div>

                            {/* RIGHT — Editorial Content (9 Cols) */}
                            <div className="lg:col-span-9 flex flex-col justify-between p-5 sm:p-6 lg:p-7 xl:p-8">

                                {/* Pull-quote style title */}
                                <div className="flex-1">
                                    {/* Opening quotation mark */}
                                    <div className="text-[#00A651] mb-2 leading-none">
                                        <svg width="28" height="22" viewBox="0 0 36 28" fill="currentColor" aria-hidden="true">
                                            <path d="M0 28V17.2C0 11.6 1.6 7.2 4.8 4C8 0.8 12.4 0 18 0v5.6c-3.2 0-5.6.8-7.2 2.4C9.2 9.6 8.4 12 8.4 15.2H16V28H0Zm20 0V17.2C20 11.6 21.6 7.2 24.8 4C28 .8 32.4 0 38 0v5.6c-3.2 0-5.6.8-7.2 2.4C29.2 9.6 28.4 12 28.4 15.2H36V28H20Z" />
                                        </svg>
                                    </div>

                                    {/* Article title — h3 for SEO hierarchy */}
                                    <h3 className="font-serif text-xl sm:text-2xl lg:text-[1.5rem] xl:text-[1.75rem] font-bold leading-[1.2] tracking-tight text-zinc-900 mb-3">
                                        <Link
                                            href={`/opinion/${currentOpinion.slug}`}
                                            className="hover:text-[#00A651] transition-colors duration-300"
                                        >
                                            {currentOpinion.title}
                                        </Link>
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 border-l-2 border-zinc-200 pl-3">
                                        {currentOpinion.excerpt}
                                    </p>
                                </div>

                                {/* Footer row — Author + Navigation */}
                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100">

                                    {/* Author byline */}
                                    <div className="flex items-center gap-2.5">
                                        {currentOpinion.authorAvatar && (
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
                                                <Image
                                                    src={currentOpinion.authorAvatar}
                                                    alt={currentOpinion.authorName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <Link
                                                href={`/author/${slugify(currentOpinion.authorName)}`}
                                                className="block font-black text-xs uppercase tracking-wider text-zinc-900 hover:text-[#00A651] transition-colors"
                                            >
                                                {currentOpinion.authorName}
                                            </Link>
                                            <span className="text-[9px] font-bold text-[#00A651] uppercase tracking-[0.18em]">
                                                {currentOpinion.authorRole}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Prev / Next navigation */}
                                    {opinions.length > 1 && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] font-bold text-zinc-400 tabular-nums mr-1">
                                                {String(opinionIndex + 1).padStart(2, "0")} / {String(opinions.length).padStart(2, "0")}
                                            </span>
                                            <button
                                                onClick={opinionPrev}
                                                aria-label="Previous opinion"
                                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <button
                                                onClick={opinionNext}
                                                aria-label="Next opinion"
                                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>

                        {/* ── THUMBNAILS STRIP (other opinions) ── */}
                        {opinions.length > 1 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px border border-zinc-200 bg-zinc-200 overflow-hidden">
                                {opinions.map((op, i) => (
                                    <button
                                        key={op.id}
                                        onClick={() => setOpinionIndex(i)}
                                        aria-label={`View opinion: ${op.title}`}
                                        className={`relative group/thumb flex flex-col bg-white text-left transition-all duration-200 ${i === opinionIndex ? "ring-2 ring-inset ring-[#00A651] z-10" : "hover:bg-zinc-50"}`}
                                    >
                                        {/* Thumbnail image */}
                                        <div className="relative w-full aspect-[16/9] overflow-hidden bg-zinc-100">
                                            <Image
                                                src={op.image}
                                                alt={op.authorName}
                                                fill
                                                className={`object-cover object-top transition-all duration-500 ${i === opinionIndex ? "grayscale-0" : "grayscale group-hover/thumb:grayscale-0"}`}
                                                sizes="20vw"
                                            />
                                            {i === opinionIndex && (
                                                <div className="absolute inset-0 bg-[#00A651]/10" />
                                            )}
                                        </div>
                                        {/* Name */}
                                        <div className="px-2.5 py-1.5">
                                            <p className={`text-[9px] font-black uppercase tracking-wider truncate ${i === opinionIndex ? "text-[#00A651]" : "text-zinc-500"}`}>
                                                {op.authorName}
                                            </p>
                                            <p className="text-[10px] text-zinc-800 font-semibold leading-tight line-clamp-1 mt-0.5">
                                                {op.title}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════
                INTERVIEW SECTION — Compact Editorial Layout
            ═══════════════════════════════════════════════ */}
            {interviews.length > 0 && (
                <section
                    aria-label="Exclusive Interviews"
                    className="py-6 lg:py-8 bg-[#FAFAF8] border-b border-zinc-200"
                >
                    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

                        {/* Section Heading — light variant matching Opinion */}
                        <SectionHeading
                            title="Interview"
                            linkText="View All"
                            linkHref="/interviews"
                            adPlacement="home_interview"
                        />

                        {/* ── MAIN INTERVIEW CARD ── */}
                        <article className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden border border-zinc-200 bg-white shadow-sm">

                            {/* LEFT — Interview Content (9 Cols) */}
                            <div className="lg:col-span-9 flex flex-col justify-between p-5 sm:p-6 lg:p-7 xl:p-8 bg-white order-2 lg:order-1">

                                {/* Label */}
                                <div className="mb-3">
                                    <span className="inline-flex items-center gap-1.5 bg-[#00A651] text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1">
                                        <Mic size={8} />
                                        Interview
                                    </span>
                                </div>

                                {/* Interview headline */}
                                <div className="flex-1">
                                    <h3 className="font-serif text-xl sm:text-2xl lg:text-[1.5rem] xl:text-[1.75rem] font-bold leading-[1.2] tracking-tight text-zinc-900 mb-3">
                                        <Link
                                            href={`/interviews/${currentInterview.slug}`}
                                            className="hover:text-[#00A651] transition-colors duration-300"
                                        >
                                            &ldquo;{currentInterview.title}&rdquo;
                                        </Link>
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4 border-l-2 border-zinc-200 pl-3">
                                        {currentInterview.excerpt}
                                    </p>
                                </div>

                                {/* Footer — Interviewee + Navigation */}
                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100">

                                    {/* Interviewee info */}
                                    <div className="flex items-center gap-2.5">
                                        {currentInterview.authorAvatar && (
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
                                                <Image
                                                    src={currentInterview.authorAvatar}
                                                    alt={currentInterview.authorName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <Link
                                                href={`/author/${slugify(currentInterview.authorName)}`}
                                                className="block font-black text-xs uppercase tracking-wider text-zinc-900 hover:text-[#00A651] transition-colors"
                                            >
                                                {currentInterview.authorName}
                                            </Link>
                                            <span className="text-[9px] font-bold text-[#00A651] uppercase tracking-[0.18em]">
                                                {currentInterview.authorRole}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Prev / Next navigation */}
                                    {interviews.length > 1 && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] font-bold text-zinc-400 tabular-nums mr-1">
                                                {String(interviewIndex + 1).padStart(2, "0")} / {String(interviews.length).padStart(2, "0")}
                                            </span>
                                            <button
                                                onClick={interviewPrev}
                                                aria-label="Previous interview"
                                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <button
                                                onClick={interviewNext}
                                                aria-label="Next interview"
                                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT — Interviewee Portrait (Compact 3 Cols) */}
                            <div className="lg:col-span-3 relative min-h-[180px] lg:min-h-0 group/img order-1 lg:order-2">
                                <Link
                                    href={`/interviews/${currentInterview.slug}`}
                                    className="block w-full h-full absolute inset-0"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    <Image
                                        src={currentInterview.image}
                                        alt={currentInterview.imageCaption || currentInterview.authorName}
                                        fill
                                        className="object-cover object-top grayscale group-hover/img:grayscale-0 transition-all duration-700"
                                        sizes="(max-width: 1024px) 100vw, 25vw"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent lg:block hidden" />
                                    {/* Arrow reveal overlay */}
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover/img:opacity-100 translate-y-1 group-hover/img:translate-y-0 transition-all duration-300">
                                        <div className="bg-white/90 backdrop-blur-sm border border-zinc-200 p-2 rounded-full shadow-md">
                                            <ArrowUpRight size={14} className="text-zinc-900" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Issue / caption label */}
                                {currentInterview.imageCaption && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 bg-white/80 backdrop-blur-sm px-2 py-0.5">
                                            {currentInterview.imageCaption}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </article>

                        {/* ── INTERVIEW THUMBNAILS STRIP ── */}
                        {interviews.length > 1 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px border border-zinc-200 bg-zinc-200 overflow-hidden">
                                {interviews.map((iv, i) => (
                                    <button
                                        key={iv.id}
                                        onClick={() => setInterviewIndex(i)}
                                        aria-label={`View interview: ${iv.title}`}
                                        className={`relative group/thumb flex flex-col bg-white text-left transition-all duration-200 ${i === interviewIndex ? "ring-2 ring-inset ring-[#00A651] z-10" : "hover:bg-zinc-50"}`}
                                    >
                                        <div className="relative w-full aspect-[16/9] overflow-hidden bg-zinc-100">
                                            <Image
                                                src={iv.image}
                                                alt={iv.authorName}
                                                fill
                                                className={`object-cover object-top transition-all duration-500 ${i === interviewIndex ? "grayscale-0" : "grayscale group-hover/thumb:grayscale-0"}`}
                                                sizes="20vw"
                                            />
                                            {i === interviewIndex && (
                                                <div className="absolute inset-0 bg-[#00A651]/10" />
                                            )}
                                        </div>
                                        <div className="px-2.5 py-1.5">
                                            <p className={`text-[9px] font-black uppercase tracking-wider truncate ${i === interviewIndex ? "text-[#00A651]" : "text-zinc-500"}`}>
                                                {iv.authorName}
                                            </p>
                                            <p className="text-[10px] text-zinc-800 font-semibold leading-tight line-clamp-1 mt-0.5">
                                                {iv.title}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}
