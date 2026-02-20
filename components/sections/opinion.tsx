"use client";

import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { OPINIONS } from "@/data/dummy";
import { Article, Opinion } from "@/types";
import { slugify } from "@/lib/utils";

interface OpinionSectionProps {
    items?: (Opinion | Article)[];
}

export function OpinionSection({ items }: OpinionSectionProps) {
    const featuredOpinion = items?.[0] || OPINIONS[0];
    if (!featuredOpinion) return null;

    const author = featuredOpinion.author;
    let authorImage = author && 'image' in author ? (author as any).image : null;

    if (!authorImage && author && 'avatar' in author) {
        const avatar = (author as any).avatar;
        if (avatar && !avatar.includes("default-avatar")) {
            authorImage = avatar;
        }
    }

    if (!authorImage) {
        if ('image' in featuredOpinion) {
            const img = (featuredOpinion as any).image;
            if (img && !img.includes("magazine-default")) authorImage = img;
        } else if ('featuredImage' in featuredOpinion) {
            authorImage = (featuredOpinion as any).featuredImage;
        }
    }

    authorImage = authorImage || "/default-avatar.png";
    const authorRole = featuredOpinion.author?.role || "Contributor";
    const authorName = featuredOpinion.author?.name || "Unknown";

    return (
        <section className="py-20 bg-white border-b border-zinc-100">
            <div className="container mx-auto px-4 md:px-8">
                <SectionHeading
                    title="Executive Perspective"
                    linkText="View Archive"
                    linkHref="/opinion"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mt-12 group">
                    {/* Image Column - Minimalist Frame */}
                    <div className="lg:col-span-4 flex justify-center lg:justify-start">
                        <div className="relative w-full aspect-square max-w-[400px] border border-zinc-800 p-2 bg-white transition-transform duration-500 group-hover:scale-[1.02]">
                            <div className="relative w-full h-full overflow-hidden border border-zinc-200">
                                <Image
                                    src={authorImage}
                                    alt={authorName}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="lg:col-span-8">
                        <div className="flex flex-col items-start">
                            <span className="bg-[#00A651] text-white text-[9px] font-black uppercase px-2 py-1 tracking-[2px] mb-8">
                                Featured Insight
                            </span>

                            <Link href={`/opinion/${featuredOpinion.slug}`} className="block mb-8">
                                <h3 className="font-serif text-3xl md:text-5xl lg:text-[54px] font-bold leading-[1.1] tracking-tight text-zinc-900 group-hover:text-[#00A651] transition-colors duration-300">
                                    "{featuredOpinion.title}"
                                </h3>
                            </Link>

                            <div className="relative pl-8 mb-10 border-l border-zinc-200">
                                <p className="text-lg md:text-xl text-zinc-500 font-serif leading-relaxed italic">
                                    {featuredOpinion.excerpt}
                                </p>
                            </div>

                            <Link href={`/author/${slugify(authorName)}`} className="flex flex-col hover:opacity-80 transition-opacity">
                                <span className="font-black text-lg uppercase tracking-widest text-zinc-900">
                                    {authorName}
                                </span>
                                <span className="text-[10px] font-bold text-[#00A651] uppercase tracking-[3px] mt-1">
                                    {authorRole}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}