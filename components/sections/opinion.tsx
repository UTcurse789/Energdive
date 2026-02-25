"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { slugify } from "@/lib/utils";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

interface OpinionItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    authorName: string;
    authorAvatar: string;
    authorRole: string;
    date: string;
}

export function OpinionSection() {
    const [opinions, setOpinions] = useState<OpinionItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        async function fetchOpinions() {
            try {
                const res = await fetch(
                    `${STRAPI_BASE}/api/contents` +
                    `?filters[type_of_content][name][$eq]=Opinion` +
                    `&pagination[pageSize]=5` +
                    `&populate[author][populate]=avatar` +
                    `&populate=FeaturedImage` +
                    `&sort=publishedAt:desc`,
                    { next: { revalidate: 120 } }
                );
                if (!res.ok) return;
                const json = await res.json();
                const data = json.data || [];

                const mapped = data.map((item: any) => {
                    const img = item.FeaturedImage;
                    let imageUrl = "/magazine-default.jpg";
                    if (img) {
                        const url = img.formats?.large?.url || img.formats?.medium?.url || img.url;
                        if (url) imageUrl = url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
                    }

                    return {
                        id: item.id,
                        title: item.Title || "",
                        slug: item.slug || "",
                        excerpt: item.Excerpt
                            ? item.Excerpt.map((block: any) =>
                                (block.children || []).map((c: any) => c.text || "").join("")
                            ).filter(Boolean).join(" ").trim()
                            : "",
                        image: imageUrl,
                        authorName: item.author?.name || "Staff Writer",
                        authorAvatar: item.author?.avatar?.url
                            ? `${STRAPI_BASE}${item.author.avatar.url}`
                            : "/default-avatar.png",
                        authorRole: item.author?.role || "Author",
                        date: formatContentDate(item.Date || item.publishedAt || item.createdAt),
                    };
                });
                setOpinions(mapped);
            } catch (err) {
                console.error("Opinion fetch error:", err);
            }
        }
        fetchOpinions();
    }, []);

    const goNext = useCallback(() => {
        setCurrentIndex((i) => (i + 1) % Math.max(opinions.length, 1));
    }, [opinions.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((i) => (i - 1 + opinions.length) % Math.max(opinions.length, 1));
    }, [opinions.length]);

    if (opinions.length === 0) return null;

    const current = opinions[currentIndex];

    return (
        <section className="py-20 bg-white border-b border-zinc-100">
            <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                <SectionHeading
                    title="Opinion"
                    linkText="View Archive"
                    linkHref="/opinion"
                />

                {/* Carousel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center mt-12 group">
                    {/* Image Column */}
                    <div className="lg:col-span-4 flex justify-center lg:justify-start">
                        <div className="relative w-full h-[500px] max-w-[400px] border border-zinc-800 p-2 bg-white transition-transform duration-500 group-hover:scale-[1.02]">
                            <div className="relative w-full h-full overflow-hidden border border-zinc-200">
                                <Image
                                    src={current.image}
                                    alt={current.authorName}
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

                            <Link href={`/opinion/${current.slug}`} className="block mb-8">
                                <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.15] tracking-tight text-zinc-900 group-hover:text-[#00A651] transition-colors duration-300">
                                    &ldquo;{current.title}&rdquo;
                                </h3>
                            </Link>

                            <div className="relative pl-8 mb-10 border-l border-zinc-200">
                                <p className="text-sm md:text-base text-zinc-500 font-serif leading-relaxed italic line-clamp-3">
                                    {current.excerpt}
                                </p>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <Link href={`/author/${slugify(current.authorName)}`} className="flex flex-col hover:opacity-80 transition-opacity">
                                    <span className="font-black text-lg uppercase tracking-widest text-zinc-900">
                                        {current.authorName}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#00A651] uppercase tracking-[3px] mt-1">
                                        {current.authorRole}
                                    </span>
                                </Link>

                                {/* Navigation */}
                                {opinions.length > 1 && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-zinc-400">
                                            {currentIndex + 1} / {opinions.length}
                                        </span>
                                        <button
                                            onClick={goPrev}
                                            className="w-10 h-10 border border-zinc-200 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={goNext}
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
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-[#00A651]" : "w-4 bg-zinc-200 hover:bg-zinc-400"}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
