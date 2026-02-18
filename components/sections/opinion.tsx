"use client";

import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { OPINIONS } from "@/data/dummy";
import { Article, Opinion } from "@/types";
import { Quote } from "lucide-react";

interface OpinionSectionProps {
    items?: (Opinion | Article)[];
}

export function OpinionSection({ items }: OpinionSectionProps) {
    const featuredOpinion = items?.[0] || OPINIONS[0];

    if (!featuredOpinion) return null;

    // Normalize author data (Opinion has author.image, Article has author.avatar)
    const author = featuredOpinion.author;
    const authorImage = author && 'image' in author
        ? (author as any).image
        : author?.avatar || "/default-avatar.png"; // Fallback if no image/avatar

    const authorRole = featuredOpinion.author?.role || "Contributor";
    const authorName = featuredOpinion.author?.name || "Unknown";


    return (
        <section className="py-24 bg-white border-b border-black overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12">
                <SectionHeading
                    title="Executive Perspective"
                    linkText="View Archive"
                    linkHref="/opinion"
                />

                <div className="relative mt-12 group">
                    {/* Background Branding Mark */}
                    <div className="absolute -top-10 -left-10 text-zinc-50 select-none pointer-events-none z-0">
                        <Quote size={240} fill="currentColor" />
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Author Image / Avatar Column */}
                        <div className="lg:col-span-4 flex justify-center lg:justify-start">
                            <div className="relative w-64 h-64 md:w-80 md:h-80 grayscale group-hover:grayscale-0 transition-all duration-700 border-2 border-black p-2 bg-white">
                                <div className="relative w-full h-full overflow-hidden">
                                    <Image
                                        src={authorImage}
                                        alt={authorName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="lg:col-span-8">
                            <span className="bg-[#00A651] text-white text-[10px] font-black uppercase px-3 py-1 tracking-[3px] mb-6 inline-block">
                                Featured Insight
                            </span>

                            <Link href={`/opinion/${featuredOpinion.slug}`}>
                                <h3 className="font-serif text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter leading-[0.9] mb-8 group-hover:text-[#00A651] transition-colors">
                                    "{featuredOpinion.title}"
                                </h3>
                            </Link>

                            <p className="text-xl text-zinc-500 font-serif leading-relaxed mb-10 max-w-2xl italic border-l-4 border-zinc-100 pl-8">
                                {featuredOpinion.excerpt}
                            </p>

                            <div className="flex flex-col gap-1">
                                <div className="font-black text-lg uppercase tracking-widest text-zinc-900">
                                    {authorName}
                                </div>
                                <div className="text-[10px] font-bold text-[#00A651] uppercase tracking-[4px]">
                                    {authorRole}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}