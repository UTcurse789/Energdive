"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
    contained = true,
}: {
    opinions: OpinionItem[],
    interviews: OpinionItem[],
    contained?: boolean,
}) {
    const [opinionIndex, setOpinionIndex] = useState(0);
    const [interviewIndex, setInterviewIndex] = useState(0);
    const opinionThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const interviewThumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const opinionStripRef = useRef<HTMLDivElement | null>(null);
    const interviewStripRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        const strip = opinionStripRef.current;
        const thumb = opinionThumbRefs.current[opinionIndex];
        if (!strip || !thumb) return;
        const thumbLeft = thumb.offsetLeft;
        const thumbWidth = thumb.offsetWidth;
        const stripWidth = strip.offsetWidth;
        strip.scrollTo({ left: thumbLeft - (stripWidth - thumbWidth) / 2, behavior: "smooth" });
    }, [opinionIndex]);

    useEffect(() => {
        const strip = interviewStripRef.current;
        const thumb = interviewThumbRefs.current[interviewIndex];
        if (!strip || !thumb) return;
        const thumbLeft = thumb.offsetLeft;
        const thumbWidth = thumb.offsetWidth;
        const stripWidth = strip.offsetWidth;
        strip.scrollTo({ left: thumbLeft - (stripWidth - thumbWidth) / 2, behavior: "smooth" });
    }, [interviewIndex]);

    if (opinions.length === 0 && interviews.length === 0) return null;

    const currentOpinion = opinions[opinionIndex];
    const currentInterview = interviews[interviewIndex];
    const containerClassName = contained
        ? "max-w-6xl mx-auto px-8 sm:px-10 lg:px-16"
        : "w-full";

    return (
        <>
            {/* ═══════════════════════════════════════════════
                OPINION SECTION — Compact Editorial Portrait Layout
            ═══════════════════════════════════════════════ */}
            {opinions.length > 0 && (
                <section
                    aria-label="Opinion & Commentary"
                    className={contained ? "py-6 lg:py-8 bg-white" : "py-2 lg:py-3 bg-white"}
                >
                    <div className={containerClassName}>

                        {/* Section Heading */}
                        <SectionHeading
                            title="Opinion"
                            linkText="View All"
                            linkHref="/opinion"
                            adPlacement="home_opinion"
                            variant="hero"
                        />

                        {/* ── MAIN EDITORIAL CARD ── */}
                        <article className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-zinc-200 bg-white shadow-sm overflow-hidden rounded-xl">

                            {/* LEFT — Portrait Image (Compact 3 Cols) */}
                            <div className="lg:col-span-4 xl:col-span-3 relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto min-h-[260px] sm:min-h-[300px] lg:min-h-0 bg-zinc-950 group/img">
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
                                        sizes="(max-width: 1024px) 100vw, 30vw"
                                    />
                                    {/* Dark gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                </Link>

                                {/* OPINION stamp badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    <span className="inline-flex items-center gap-1.5 bg-[#00A651] text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 shadow-sm rounded-xs">
                                        <Quote size={8} />
                                        Opinion
                                    </span>
                                </div>

                                {/* Author name anchored bottom */}
                                <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3">
                                    <Link
                                        href={`/author/${slugify(currentOpinion.authorName)}`}
                                        className="text-white font-black text-xs sm:text-sm uppercase tracking-wider hover:text-[#00A651] transition-colors"
                                    >
                                        {currentOpinion.authorName}
                                    </Link>
                                </div>
                            </div>

                            {/* RIGHT — Editorial Content (8-9 Cols) */}
                            <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between p-4 sm:p-5 lg:p-6">

                                {/* Pull-quote style title */}
                                <div className="flex-1">
                                    {/* Opening quotation mark */}
                                    <div className="text-[#00A651] mb-2 leading-none">
                                        <svg width="22" height="18" viewBox="0 0 36 28" fill="currentColor" aria-hidden="true">
                                            <path d="M0 28V17.2C0 11.6 1.6 7.2 4.8 4C8 0.8 12.4 0 18 0v5.6c-3.2 0-5.6.8-7.2 2.4C9.2 9.6 8.4 12 8.4 15.2H16V28H0Zm20 0V17.2C20 11.6 21.6 7.2 24.8 4C28 .8 32.4 0 38 0v5.6c-3.2 0-5.6.8-7.2 2.4C29.2 9.6 28.4 12 28.4 15.2H36V28H20Z" />
                                        </svg>
                                    </div>

                                    {/* Article title — h3 for SEO hierarchy */}
                                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-snug tracking-normal mb-2">
                                        <Link
                                            href={`/opinion/${currentOpinion.slug}`}
                                            className="hover:text-emerald-600 transition-colors duration-300"
                                        >
                                            {currentOpinion.title}
                                        </Link>
                                    </h3>

                                    {currentOpinion.date && (
                                        <time
                                            dateTime={currentOpinion.date}
                                            className="mb-2 block text-[10px] text-slate-600 font-medium uppercase tracking-wide"
                                        >
                                            {currentOpinion.date}
                                        </time>
                                    )}

                                    {/* Excerpt */}
                                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 border-l-2 border-slate-200 pl-3 font-light">
                                        {currentOpinion.excerpt}
                                    </p>
                                </div>

                                {/* Footer row — Author + Navigation */}
                                <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100">

                                    {/* Author byline */}
                                    <div className="flex items-center gap-2.5">
                                        {currentOpinion.authorAvatar && (
                                            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-200 shrink-0">
                                                <Image
                                                    src={currentOpinion.authorAvatar}
                                                    alt={currentOpinion.authorName}
                                                    fill
                                                    className="object-cover object-top"
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
                                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200 rounded-md"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <button
                                                onClick={opinionNext}
                                                aria-label="Next opinion"
                                                className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200 rounded-md"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>

                        {/* ── ARTICLE THUMBNAIL STRIP ── */}
                        {opinions.length > 1 && (
                            <div ref={opinionStripRef} className="mt-4 hidden sm:flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {opinions.map((op, idx) => (
                                    <button
                                        key={op.id}
                                        ref={(element) => {
                                            opinionThumbRefs.current[idx] = element;
                                        }}
                                        onClick={() => setOpinionIndex(idx)}
                                        aria-label={`View opinion: ${op.title}`}
                                        className={`group shrink-0 snap-start flex items-center gap-3 p-2 border transition-all duration-200 overflow-hidden rounded-xl shadow-2xs ${
                                            idx === opinionIndex
                                                ? "border-[#00A651] bg-[#00A651]/5 ring-1 ring-[#00A651]/30"
                                                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                        } w-60 sm:w-72`}
                                    >
                                        {/* Article thumbnail */}
                                        <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                                            <Image
                                                src={op.image}
                                                alt={op.title}
                                                fill
                                                className="object-cover object-top"
                                                sizes="56px"
                                            />
                                            {idx === opinionIndex && (
                                                <div className="absolute inset-0 bg-[#00A651]/10" />
                                            )}
                                        </div>
                                        {/* Article title */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#00A651] mb-0.5 truncate">
                                                {op.authorName}
                                            </span>
                                            <span className={`text-[11px] font-bold leading-snug line-clamp-2 ${
                                                idx === opinionIndex ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                                            } transition-colors`}>
                                                {op.title}
                                            </span>
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
                    className={contained ? "py-6 lg:py-8 bg-white" : "py-2 lg:py-3 bg-white"}
                >
                    <div className={containerClassName}>

                        {/* Section Heading — light variant matching Opinion */}
                        <SectionHeading
                            title="Interview"
                            linkText="View All"
                            linkHref="/interviews"
                            adPlacement="home_interview"
                            variant="hero"
                        />

                        {/* ── MAIN INTERVIEW CARD ── */}
                        <article className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden border border-zinc-200 bg-white shadow-sm rounded-xl">

                            {/* LEFT — Interview Content (8-9 Cols) */}
                            <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between p-4 sm:p-5 lg:p-6 bg-white order-2 lg:order-1">

                                {/* Label */}
                                <div className="mb-3">
                                    <span className="inline-flex items-center gap-1.5 bg-[#00A651] text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 shadow-sm rounded-xs">
                                        <Mic size={8} />
                                        Interview
                                    </span>
                                </div>

                                {/* Interview headline */}
                                <div className="flex-1">
                                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-snug tracking-normal mb-2">
                                        <Link
                                            href={`/interviews/${currentInterview.slug}`}
                                            className="hover:text-emerald-600 transition-colors duration-300"
                                        >
                                            &ldquo;{currentInterview.title}&rdquo;
                                        </Link>
                                    </h3>

                                    {currentInterview.date && (
                                        <time
                                            dateTime={currentInterview.date}
                                            className="mb-2 block text-[10px] text-slate-600 font-medium uppercase tracking-wide"
                                        >
                                            {currentInterview.date}
                                        </time>
                                    )}

                                    {/* Excerpt */}
                                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3 mb-4 border-l-2 border-slate-200 pl-3 font-light">
                                        {currentInterview.excerpt}
                                    </p>
                                </div>
                                {interviews.length > 1 && (
                                    <div className="flex items-center justify-end gap-1.5 pt-4 border-t border-zinc-100">
                                        <span className="text-[10px] font-bold text-zinc-400 tabular-nums mr-1">
                                            {String(interviewIndex + 1).padStart(2, "0")} / {String(interviews.length).padStart(2, "0")}
                                        </span>
                                        <button
                                            onClick={interviewPrev}
                                            aria-label="Previous interview"
                                            className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200 rounded-md"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button
                                            onClick={interviewNext}
                                            aria-label="Next interview"
                                            className="w-8 h-8 border border-zinc-200 flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white transition-all duration-200 rounded-md"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT — Interviewee Portrait (Compact 4-3 Cols) */}
                            <div className="lg:col-span-4 xl:col-span-3 relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto min-h-[260px] sm:min-h-[300px] lg:min-h-0 bg-zinc-950 group/img order-1 lg:order-2">
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
                                        sizes="(max-width: 1024px) 100vw, 30vw"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
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

                        {/* ── ARTICLE THUMBNAIL STRIP ── */}
                        {interviews.length > 1 && (
                            <div ref={interviewStripRef} className="mt-4 hidden sm:flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {interviews.map((iv, idx) => (
                                    <button
                                        key={iv.id}
                                        ref={(element) => {
                                            interviewThumbRefs.current[idx] = element;
                                        }}
                                        onClick={() => setInterviewIndex(idx)}
                                        aria-label={`View interview: ${iv.title}`}
                                        className={`group shrink-0 snap-start flex items-center gap-3 p-2 border transition-all duration-200 overflow-hidden rounded-xl shadow-2xs ${
                                            idx === interviewIndex
                                                ? "border-[#00A651] bg-[#00A651]/5 ring-1 ring-[#00A651]/30"
                                                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                        } w-60 sm:w-72`}
                                    >
                                        {/* Article thumbnail */}
                                        <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                                            <Image
                                                src={iv.image}
                                                alt={iv.title}
                                                fill
                                                className="object-cover object-top"
                                                sizes="56px"
                                            />
                                            {idx === interviewIndex && (
                                                <div className="absolute inset-0 bg-[#00A651]/10" />
                                            )}
                                        </div>
                                        {/* Article title */}
                                        <div className="flex-1 min-w-0 text-left">

                                            <span className={`text-[11px] font-bold leading-snug line-clamp-2 ${
                                                idx === interviewIndex ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                                            } transition-colors`}>
                                                {iv.title}
                                            </span>
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
