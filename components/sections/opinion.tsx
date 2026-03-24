"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { slugify } from "@/lib/utils";
import { formatContentDate } from "@/lib/date";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

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



export function OpinionSection({ opinions = [], interviews = [] }: { opinions: OpinionItem[], interviews: OpinionItem[] }) {
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
            {/* ─── OPINION SECTION ─── */}
            {opinions.length > 0 && (
                <section className="py-12 md:py-20 bg-white border-b border-zinc-100">
                    <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                        <SectionHeading
                            title="Opinion"
                            linkText="View All"
                            linkHref="/opinion"
                        />

                        {/* Carousel: Image LEFT, Content RIGHT */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mt-12 group">
                            {/* Image Column - LEFT */}
                            <div className="lg:col-span-4 flex justify-center lg:justify-start">
                                <Link href={`/opinion/${currentOpinion.slug}`} className="relative w-full max-w-[400px] block cursor-pointer group/image">
                                    <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[500px] border border-zinc-800 p-2 bg-white transition-transform duration-500 group-hover/image:scale-[1.02]">
                                        <div className="relative w-full h-full overflow-hidden border border-zinc-200">
                                            <Image
                                                src={currentOpinion.image}
                                                alt={currentOpinion.authorName}
                                                fill
                                                className="object-cover grayscale group-hover/image:grayscale-0 transition-all duration-1000"
                                            />
                                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-full opacity-0 translate-y-2 group-hover/image:opacity-100 group-hover/image:translate-y-0 transition-all duration-300 shadow-lg">
                                                <ArrowUpRight size={20} className="text-black" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center lg:text-left pl-1">
                                        {currentOpinion.imageCaption ? (
                                            <span className="text-[13px] md:text-sm font-serif italic text-zinc-500 group-hover/image:text-zinc-800 transition-colors">
                                                {currentOpinion.imageCaption}
                                            </span>
                                        ) : (
                                            <span className="text-[13px] md:text-sm font-serif italic text-zinc-500 group-hover/image:text-zinc-800 transition-colors">
                                                {currentOpinion.authorName}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </div>

                            {/* Content Column - RIGHT */}
                            <div className="lg:col-span-8">
                                <div className="flex flex-col items-start">
                                    <Link href={`/opinion/${currentOpinion.slug}`} className="block mb-8">
                                        <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] tracking-tight text-zinc-900 group-hover:text-[#00A651] transition-colors duration-300">
                                            &ldquo;{currentOpinion.title}&rdquo;
                                        </h3>
                                    </Link>

                                    <div className="relative pl-8 mb-10 border-l border-zinc-200">
                                        <p className="text-sm md:text-base text-zinc-500 font-serif leading-relaxed italic line-clamp-3">
                                            {currentOpinion.excerpt}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between w-full">
                                        <Link href={`/author/${slugify(currentOpinion.authorName)}`} className="flex flex-col hover:opacity-80 transition-opacity">
                                            <span className="font-black text-base sm:text-lg uppercase tracking-wider sm:tracking-widest text-zinc-900 overflow-wrap-break-word">
                                                {currentOpinion.authorName}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#00A651] uppercase tracking-[3px] mt-1">
                                                {currentOpinion.authorRole}
                                            </span>
                                        </Link>

                                        {/* Navigation */}
                                        {opinions.length > 1 && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-zinc-400">
                                                    {opinionIndex + 1} / {opinions.length}
                                                </span>
                                                <button
                                                    onClick={opinionPrev}
                                                    className="w-10 h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    onClick={opinionNext}
                                                    className="w-10 h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dots indicator */}
                        {opinions.length > 1 && (
                            <div className="flex justify-center gap-2 mt-10">
                                {opinions.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setOpinionIndex(i)}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === opinionIndex ? "w-8 bg-[#00A651]" : "w-4 bg-zinc-200 hover:bg-zinc-400"}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ─── INTERVIEW SECTION ─── */}
            {interviews.length > 0 && (
                <section className="py-12 md:py-20 bg-white border-b border-zinc-100">
                    <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                        <SectionHeading
                            title="Interview"
                            linkText="View All"
                            linkHref="/interview"
                        />

                        {/* Carousel: Content LEFT, Image RIGHT (mirrored) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mt-12 group">
                            {/* Content Column - LEFT */}
                            <div className="lg:col-span-8 order-2 lg:order-1">
                                <div className="flex flex-col items-start">
                                    <Link href={`/interview/${currentInterview.slug}`} className="block mb-8">
                                        <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] tracking-tight text-zinc-900 group-hover:text-[#00A651] transition-colors duration-300">
                                            &ldquo;{currentInterview.title}&rdquo;
                                        </h3>
                                    </Link>

                                    <div className="relative pl-8 mb-10 border-l border-zinc-200">
                                        <p className="text-sm md:text-base text-zinc-500 font-serif leading-relaxed italic line-clamp-3">
                                            {currentInterview.excerpt}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between w-full">
                                        <Link href={`/author/${slugify(currentInterview.authorName)}`} className="flex flex-col hover:opacity-80 transition-opacity">
                                            <span className="font-black text-base sm:text-lg uppercase tracking-wider sm:tracking-widest text-zinc-900 overflow-wrap-break-word">
                                                {currentInterview.authorName}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#00A651] uppercase tracking-[3px] mt-1">
                                                {currentInterview.authorRole}
                                            </span>
                                        </Link>

                                        {/* Navigation */}
                                        {interviews.length > 1 && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-zinc-400">
                                                    {interviewIndex + 1} / {interviews.length}
                                                </span>
                                                <button
                                                    onClick={interviewPrev}
                                                    className="w-10 h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    onClick={interviewNext}
                                                    className="w-10 h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Image Column - RIGHT */}
                            <div className="lg:col-span-4 flex justify-center lg:justify-end order-1 lg:order-2">
                                <Link href={`/interview/${currentInterview.slug}`} className="relative w-full max-w-[400px] block cursor-pointer group/image">
                                    <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[500px] border border-zinc-800 p-2 bg-white transition-transform duration-500 group-hover/image:scale-[1.02]">
                                        <div className="relative w-full h-full overflow-hidden border border-zinc-200">
                                            <Image
                                                src={currentInterview.image}
                                                alt={currentInterview.authorName}
                                                fill
                                                className="object-cover grayscale group-hover/image:grayscale-0 transition-all duration-1000"
                                            />
                                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-full opacity-0 translate-y-2 group-hover/image:opacity-100 group-hover/image:translate-y-0 transition-all duration-300 shadow-lg">
                                                <ArrowUpRight size={20} className="text-black" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center lg:text-right pr-1">
                                        {currentInterview.imageCaption ? (
                                            <span className="text-[13px] md:text-sm font-serif italic text-zinc-500 group-hover/image:text-zinc-800 transition-colors">
                                                {currentInterview.imageCaption}
                                            </span>
                                        ) : (
                                            <span className="text-[13px] md:text-sm font-serif italic text-zinc-500 group-hover/image:text-zinc-800 transition-colors">
                                                {currentInterview.authorName}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Dots indicator */}
                        {interviews.length > 1 && (
                            <div className="flex justify-center gap-2 mt-10">
                                {interviews.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInterviewIndex(i)}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === interviewIndex ? "w-8 bg-[#00A651]" : "w-4 bg-zinc-200 hover:bg-zinc-400"}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}
