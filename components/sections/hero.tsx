

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { DateChip } from "@/components/ui/date-chip";
import { buildContentUrl } from "@/lib/content-routes";
import { formatContentDate } from "@/lib/date";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { ONBOARDING_KEYS, hasLocalFlag, setLocalFlag } from "@/lib/onboarding-storage";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";

const STRAPI_BASE = "https://cms.energdive.com";

type HeroTextNode = {
    text?: string | null;
};

type HeroExcerptBlock = {
    children?: HeroTextNode[] | null;
};

type HeroImage = {
    url?: string | null;
};

type HeroSector = {
    name?: string | null;
};

type HeroContentType = {
    name?: string | null;
};

type HeroItem = {
    id: number | string;
    Title?: string | null;
    slug?: string | null;
    FeaturedImage?: HeroImage | null;
    Excerpt?: HeroExcerptBlock[] | null;
    sectors?: HeroSector[] | null;
    type_of_content?: HeroContentType | null;
    content_tag?: unknown;
    Date?: string | null;
    createdAt?: string | null;
};

function getImageUrl(article: HeroItem): string {
    const img = article.FeaturedImage;
    if (!img) return "/placeholder.jpg";
    // const url = img.formats?.large?.url || img.formats?.medium?.url || img.url;
    const url = img.url;
    if (!url) return "/placeholder.jpg";
    return strapiImageUrl(url);
}

function getExcerpt(excerpt?: HeroExcerptBlock[] | null): string {
    return (
        excerpt?.map((paragraph) =>
            (paragraph.children || [])
                .map((child) => child.text || "")
                .join("")
        ).join(" ") || ""
    );
}



interface HeroProps {
    topStories?: HeroItem[];
}

export function Hero({ topStories: propTopStories }: HeroProps) {
    const [coverStories, setCoverStories] = useState<HeroItem[]>([]);
    const [articles, setArticles] = useState<HeroItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        // Hero banner content for carousel
        fetch(`${STRAPI_BASE}/api/contents?filters[show_hero_banner][$eq]=true&populate=*&pagination[pageSize]=10&sort=publishedAt:desc`)
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

    const { isOpen: showNewsHint, close: dismissNewsHint } = useOnboardingStep({
        id: "home-news-hint",
        enabled: isLoaded && !isSignedIn && !hasLocalFlag(ONBOARDING_KEYS.homeHintSeen),
        delayMs: 1000,
        autoHideMs: 4200,
        onClose: () => {
            setLocalFlag(ONBOARDING_KEYS.homeHintSeen);
        },
    });

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
                                alt={featured.Title || "Feature story"}
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
                                    {/* Content type badge */}
                                    {featured.type_of_content?.name && (
                                        <span className="px-3 py-1.5 bg-[#09B697] text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                                            {featured.type_of_content.name}
                                        </span>
                                    )}
                                </div>

                                <Link href={buildContentUrl({ slug: featured.slug || "", type_of_content: featured.type_of_content, content_tag: featured.content_tag })} className="block group/title">
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
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Published on</p>
                                    <DateChip value={formatContentDate(featured.Date || featured.createdAt || "")} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === RIGHT SIDEBAR (4 Cols) === */}
                    <div className="lg:col-span-4 lg:pl-10">
                        <div className="relative flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1a1a1a] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                Latest News
                            </h3>
                            <Link href="/news" className="text-[10px] font-black text-[#1a4731] flex items-center gap-1 hover:text-[#09B697] transition-colors">
                                EXPLORE <ArrowRight size={12} />
                            </Link>

                            <AnimatePresence>
                                {showNewsHint && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute left-0 right-0 top-full z-20 mt-3 sm:left-auto sm:w-[330px]"
                                    >
                                        <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/80 shadow-[0_28px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.96))]" />
                                            <div className="absolute left-8 top-0 h-3 w-3 -translate-y-1/2 rotate-45 border-l border-t border-white/70 bg-white/85" />

                                            <motion.div
                                                className="absolute inset-x-0 top-0 h-1 bg-emerald-500/70 origin-left"
                                                initial={{ scaleX: 1 }}
                                                animate={{ scaleX: 0 }}
                                                transition={{ duration: 4, ease: "linear" }}
                                            />

                                            <div className="relative p-4 sm:p-5">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <span className="inline-flex items-center rounded-full border border-emerald-200/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                                        News Discovery
                                                    </span>
                                                    <OnboardingProgress step={1} />
                                                </div>

                                                <p className="font-serif text-lg font-bold leading-tight text-slate-950">
                                                    Explore real-time energy intelligence, market reports & exclusive insights.
                                                </p>

                                                <div className="mt-4 flex items-center gap-2">
                                                    <Link
                                                        href="/news"
                                                        onClick={dismissNewsHint}
                                                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,23,42,0.22)]"
                                                    >
                                                        Explore News
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={dismissNewsHint}
                                                        className="rounded-full border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="space-y-6">
                            {topStories.map((story) => (
                                    <Link
                                        key={story.id}
                                        href={buildContentUrl({ slug: story.slug || "", type_of_content: story.type_of_content, content_tag: story.content_tag })}
                                        className="group flex gap-5 items-start border-b border-slate-50 pb-5 last:border-0"
                                    >
                                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                                            <Image
                                                src={getImageUrl(story)}
                                                alt={story.Title || "Latest news image"}
                                            fill
                                            sizes="112px"
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="min-w-0 space-y-1.5">
                                        <p className="text-[9px] font-black text-[#09B697] uppercase tracking-widest">
                                            {story.sectors?.[0]?.name}
                                        </p>
                                        <h4 className="font-serif text-[15.5px] font-bold leading-snug text-[#1a1a1a] group-hover:text-[#09B697] transition-colors line-clamp-2">
                                            {story.Title}
                                        </h4>
                                        <DateChip value={formatContentDate(story.Date || story.createdAt || "")} className="text-[10px]" />
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
import { strapiImageUrl } from "@/lib/strapi-image";

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
                                <Skeleton className="h-20 w-28 rounded-2xl shrink-0" />
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
