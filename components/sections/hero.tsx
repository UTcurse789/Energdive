

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { DateChip } from "@/components/ui/date-chip";
import { buildContentUrl } from "@/lib/content-routes";
import { formatContentDate } from "@/lib/date";

function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

const STRAPI_BASE = "https://cms.energdive.com";

function getImageUrl(article: any): string {
    const img = article.FeaturedImage;
    if (!img) return "/placeholder.jpg";
    // const url = img.formats?.large?.url || img.formats?.medium?.url || img.url;
    const url = img.url
    return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
}

function getExcerpt(excerpt: any[]): string {
    return excerpt?.map((p) => p.children.map((c: any) => c.text).join("")).join(" ") || "";
}



interface HeroProps {
    topStories?: any[];
}

export function Hero({ topStories: propTopStories }: HeroProps) {
    const [coverStories, setCoverStories] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cover stories for carousel
        fetch(`${STRAPI_BASE}/api/contents?filters[type_of_content][name][$contains]=Cover&populate=*&pagination[pageSize]=10&sort=Date:desc`)
            .then((res) => res.json())
            .then((data) => setCoverStories(data?.data || []))
            .catch(console.error)
            .finally(() => {
                if (propTopStories) setLoading(false);
            });

        // If topStories is passed as prop, we don't need to fetch featured local content
        if (!propTopStories) {
            fetch(`${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&pagination[pageSize]=10&populate=*&sort=publishedAt:desc`)
                .then((res) => res.json())
                .then((data) => setArticles(data?.data || []))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [propTopStories]);

    const carouselArticles = coverStories;        // 👈 Cover stories in carousel
    const topStories = propTopStories || articles.slice(0, 6);

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning || index === currentSlide) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentSlide(index);
            setIsTransitioning(false);
        }, 500);
    }, [isTransitioning, currentSlide]);

    const nextSlide = useCallback(() => {
        if (carouselArticles.length === 0) return;
        goToSlide((currentSlide + 1) % carouselArticles.length);
    }, [currentSlide, carouselArticles.length, goToSlide]);

    useEffect(() => {
        if (carouselArticles.length > 0) {
            autoPlayRef.current = setInterval(nextSlide, 5000);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [nextSlide, carouselArticles.length]);

    if (loading) return <HeroSkeleton />;
    if (carouselArticles.length === 0) return null;

    const featured = carouselArticles[currentSlide];

    return (
        <section className="py-10 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* === LEFT (8 Cols) === */}
                    <div className="lg:col-span-8 flex flex-col">

                        {/* Banner */}
                        <div className="relative aspect-[16/8.5] w-full overflow-hidden rounded-3xl bg-black group/img shadow-md">
                            <Image
                                src={getImageUrl(featured)}
                                alt={featured.Title}
                                fill
                                priority
                                quality={100}
                                sizes="(max-width: 1024px) 100vw, 1200px"
                                className={`object-cover transition-all duration-700 ${isTransitioning ? "opacity-40 scale-105" : "opacity-100 scale-100"
                                    } group-hover/img:scale-110`}
                            />

                            {/* Slide indicator dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {carouselArticles.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToSlide(i)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide
                                            ? "bg-[#09B697] w-6"
                                            : "bg-white/50"
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Nav Arrows */}
                            <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-3 md:px-6 opacity-100 lg:opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <button
                                    onClick={() => goToSlide((currentSlide - 1 + carouselArticles.length) % carouselArticles.length)}
                                    className="p-2 md:p-3 bg-white/30 md:bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white hover:text-black transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="p-2 md:p-3 bg-white/30 md:bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white hover:text-black transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content below banner */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
                            <div className="md:col-span-3 space-y-5">
                                <div className="flex flex-wrap gap-2">
                                    {featured.sectors?.[0] && (
                                        <span className="px-3 py-1.5 bg-[#1a4731] text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                                            {featured.sectors[0].name}
                                        </span>
                                    )}
                                    {/* Cover Story badge */}
                                    <span className="px-3 py-1.5 bg-[#09B697] text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                                        Cover Story
                                    </span>
                                </div>

                                <Link href={buildContentUrl({ slug: featured.slug, type_of_content: featured.type_of_content })} className="block group/title">
                                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold leading-[1.15] text-[#1a1a1a] transition-colors duration-300 group-hover/title:text-[#09B697]">
                                        {featured.Title}
                                    </h1>
                                </Link>

                                <p className="text-[#555] font-serif text-lg leading-relaxed line-clamp-3">
                                    {getExcerpt(featured.Excerpt)}
                                </p>
                            </div>

                            {/* Metadata Sidebar */}
                            <div className="md:col-span-1 md:border-l border-slate-100 md:pl-8 space-y-4 md:space-y-8">
                                {/* <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Author</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#1a4731] flex items-center justify-center text-white font-bold text-lg">
                                            {featured.author?.name?.charAt(0) || "T"}
                                        </div>
                                        <Link href={`/author/${slugify(featured.author?.name || "team-energdive")}`} className="font-bold text-sm text-[#1a1a1a] leading-tight hover:text-[#09B697] transition-colors">
                                            {featured.author?.name || "Team EnergyDive"}
                                        </Link>
                                    </div>
                                </div> */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Publised on</p>
                                    <DateChip value={formatContentDate(featured.Date || featured.createdAt)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === RIGHT SIDEBAR (4 Cols) === */}
                    <div className="lg:col-span-4 lg:pl-10">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1a1a1a] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                Latest News
                            </h3>
                            <Link href="/news" className="text-[10px] font-black text-[#1a4731] flex items-center gap-1 hover:text-[#09B697] transition-colors">
                                EXPLORE <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {topStories.map((story, index) => (
                                <Link
                                    key={story.id}
                                    href={buildContentUrl({ slug: story.slug, type_of_content: story.type_of_content })}
                                    className="group flex gap-5 items-start border-b border-slate-50 pb-5 last:border-0"
                                >
                                    <span className="text-4xl font-serif font-light text-slate-200 group-hover:text-[#09B697]/30 transition-colors">
                                        0{index + 1}
                                    </span>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-[#09B697] uppercase tracking-widest">
                                            {story.sectors?.[0]?.name}
                                        </p>
                                        <h4 className="font-serif text-[15.5px] font-bold leading-snug text-[#1a1a1a] group-hover:text-[#09B697] transition-colors line-clamp-2">
                                            {story.Title}
                                        </h4>
                                        <DateChip value={formatContentDate(story.Date || story.createdAt)} className="text-[10px]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

import { Skeleton } from "@/components/ui/skeleton";

function HeroSkeleton() {
    return (
        <section className="py-10 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 flex flex-col">
                        <Skeleton className="aspect-[16/8.5] w-full rounded-3xl" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
                            <div className="md:col-span-3 space-y-5">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 lg:pl-10 space-y-8">
                        <Skeleton className="h-8 w-full border-b pb-4" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-5 pb-5 border-b last:border-0">
                                <Skeleton className="h-10 w-10" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-5 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
