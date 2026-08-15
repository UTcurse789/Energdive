"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, Play, X, ExternalLink, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { strapiImageUrl } from "@/lib/strapi-image";
import { buildContentUrl } from "@/lib/content-routes";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE = "https://cms.energdive.com";

// ── Types ─────────────────────────────────────────────────────────────────────

type HeroTextNode = { text?: string | null };
type HeroExcerptBlock = { children?: HeroTextNode[] | null };
type HeroImage = { url?: string | null };
type HeroSector = { name?: string | null };
type HeroContentType = { name?: string | null };

type HeroItem = {
    id: number | string;
    Title?: string | null;
    slug?: string | null;
    type_of_content?: HeroContentType | null;
    sectors?: HeroSector[] | null;
    content_tag?: unknown;
    Date?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    Excerpt?: HeroExcerptBlock[] | null;
    FeaturedImage?: HeroImage | null;
    author?: { name?: string | null } | null;
    date?: string;
    href?: string;
}

import { AdBanner } from "@/components/ads/AdBanner";

export interface BentoItem {
    id: string | number;
    title: string;
    category: string;
    contentType?: string;
    contentTag?: any;
    image: string;
    slug: string;
    excerpt: string;
    description?: string;
    label?: string;
    authorName?: string;
    date?: string;
    href?: string;
}

export interface VideoItem {
    id: number | string;
    title: string;
    slug: string;
    youtubeId?: string;
    thumbnail: string;
    date: string;
    category: string;
}

interface HeroProps {
    heroStories?: HeroItem[];
    topStories?: HeroItem[];
    featuredStories?: BentoItem[];
    videos?: VideoItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImageUrl(article: any): string {
    const img = article?.FeaturedImage;
    if (!img) return "/magazine-default.jpg";
    const url =
        img.formats?.small?.url ||
        img.formats?.thumbnail?.url ||
        img.formats?.medium?.url ||
        img.url;
    if (!url) return "/magazine-default.jpg";
    return strapiImageUrl(url);
}

function getExcerpt(article: any): string {
    const excerpt = article?.Excerpt;
    if (!excerpt || !Array.isArray(excerpt)) return "";
    return excerpt
        .map((block: any) =>
            (block.children || []).map((child: any) => child.text || "").join("")
        )
        .filter(Boolean)
        .join(" ")
        .trim();
}

function getHref(article: any): string {
    if (article?.href) return article.href;
    return buildContentUrl({
        slug: article?.slug || "",
        type_of_content: article?.type_of_content,
    });
}

function slugify(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function HeroSkeleton() {
    return (
        <section className="py-6 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    <div className="lg:col-span-4 space-y-4">
                        <Skeleton className="h-6 w-32 bg-slate-200" />
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 py-2">
                                <Skeleton className="w-16 h-12 rounded-lg bg-slate-200 shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full bg-slate-200" />
                                    <Skeleton className="h-3 w-2/3 bg-slate-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-5">
                        <Skeleton className="h-72 w-full rounded-2xl bg-slate-200" />
                    </div>
                    <div className="lg:col-span-3 space-y-4">
                        <Skeleton className="h-44 w-full rounded-2xl bg-slate-200" />
                        <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Hero({ heroStories: propHeroStories, topStories: propTopStories, featuredStories = [], videos = [] }: HeroProps) {
    const [coverStories, setCoverStories] = useState<HeroItem[]>([]);
    const [articles, setArticles] = useState<HeroItem[]>([]);
    const [loading, setLoading] = useState(!propHeroStories?.length);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setActiveVideo(null);
        };
        if (activeVideo) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [activeVideo]);

    useEffect(() => {
        let isMounted = true;
        if (propHeroStories?.length) return;

        fetch(
            `${STRAPI_BASE}/api/contents?filters[show_hero_banner][$eq]=true&populate=*&pagination[pageSize]=10&sort=publishedAt:desc`
        )
            .then((r) => r.json())
            .then((d) => {
                if (isMounted) setCoverStories(d?.data || []);
            })
            .catch(console.error)
            .finally(() => {
                if (isMounted && propTopStories) setLoading(false);
            });

        if (!propTopStories) {
            fetch(
                `${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&pagination[pageSize]=10&populate=*&sort=publishedAt:desc`
            )
                .then((r) => r.json())
                .then((d) => {
                    if (isMounted) setArticles(d?.data || []);
                })
                .catch(console.error)
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        }

        return () => {
            isMounted = false;
        };
    }, [propHeroStories, propTopStories]);

    const carouselArticles = propHeroStories?.length ? propHeroStories : coverStories;
    const topStories = propTopStories || articles.slice(0, 8);

    const goToSlide = useCallback(
        (index: number) => {
            if (isTransitioning || index === currentSlide) return;
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentSlide(index);
                setIsTransitioning(false);
            }, 400);
        },
        [isTransitioning, currentSlide]
    );

    const nextSlide = useCallback(() => {
        if (!carouselArticles.length) return;
        goToSlide((currentSlide + 1) % carouselArticles.length);
    }, [currentSlide, carouselArticles.length, goToSlide]);

    useEffect(() => {
        if (carouselArticles.length > 1) {
            autoPlayRef.current = setInterval(nextSlide, 6000);
        }
        return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [nextSlide, carouselArticles.length]);

    if (loading && !propHeroStories?.length) return <HeroSkeleton />;
    if (!carouselArticles.length) return null;

    const featured = carouselArticles[currentSlide] || carouselArticles[0];
    const featuredHref = buildContentUrl({
        slug: featured.slug || "",
        type_of_content: featured.type_of_content,
        content_tag: featured.content_tag,
    });

    return (
        <section className="bg-white py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* ── 1. LEFT COLUMN: Cover Story (8 cols) ── */}
                    <div className="lg:col-span-8 flex flex-col">
                        {/* Cover Story Image */}
                        <div className="relative aspect-[16/9] max-h-[370px] lg:max-h-[390px] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm mb-6 group">
                            {featured.FeaturedImage?.url ? (
                                <Image
                                    src={getImageUrl(featured)}
                                    alt={featured.Title || "Featured energy story"}
                                    fill
                                    priority
                                    fetchPriority="high"
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                    className={`object-cover transition-transform duration-700 ${
                                        isTransitioning ? "opacity-50 scale-105" : "opacity-100 scale-100"
                                    }`}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                    <Zap size={64} className="text-white/10" />
                                </div>
                            )}

                            {/* Carousel Controls */}
                            {carouselArticles.length > 1 && (
                                <>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 hidden lg:flex">
                                        {carouselArticles.map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                aria-label={`Slide ${i + 1}`}
                                                aria-current={i === currentSlide ? "true" : undefined}
                                                onClick={() => goToSlide(i)}
                                                className="relative flex h-5 w-5 items-center justify-center rounded-full focus:outline-none"
                                            >
                                                <span
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        i === currentSlide ? "w-6 bg-emerald-500" : "w-1.5 bg-white/50"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 left-4 flex items-center z-10">
                                        <button
                                            type="button"
                                            onClick={() => goToSlide((currentSlide - 1 + carouselArticles.length) % carouselArticles.length)}
                                            className="p-3 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-all shadow-md"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                    </div>
                                    <div className="absolute inset-y-0 right-4 flex items-center z-10">
                                        <button
                                            type="button"
                                            onClick={nextSlide}
                                            className="p-3 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-all shadow-md"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Cover Story Content — full width, date inline with meta pills */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {featured.sectors?.[0]?.name && (
                                    <Link
                                        href={`/sectors/${slugify(featured.sectors[0].name)}`}
                                        className="bg-teal-800 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full hover:bg-teal-900 transition-colors"
                                    >
                                        {featured.sectors[0].name}
                                    </Link>
                                )}
                                <span className="bg-teal-800 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                    COVER STORY
                                </span>
                                {(featured.Date || featured.createdAt) && (
                                    <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold ml-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        <time dateTime={featured.Date || featured.createdAt || ""}>
                                            {formatContentDate(featured.Date || featured.createdAt || "")}
                                        </time>
                                    </span>
                                )}
                            </div>

                            <Link href={featuredHref}>
                                <h1
                                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight hover:text-emerald-700 transition-colors line-clamp-1"
                                    style={{ fontFamily: "var(--font-playfair, serif)" }}
                                >
                                    {featured.Title}
                                </h1>
                            </Link>

                            <p className="text-slate-500 text-base md:text-lg leading-relaxed line-clamp-3">
                                {getExcerpt(featured)}
                            </p>
                        </div>
                    </div>

                    {/* ── 2. RIGHT COLUMN: Latest News (4 cols) ── */}
                    <aside className="lg:col-span-4 flex flex-col">
                        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                                LATEST NEWS
                            </h2>
                            <Link href="/news" className="text-[11px] font-black text-emerald-800 hover:text-emerald-900 transition-colors uppercase tracking-widest flex items-center gap-1">
                                EXPLORE <ArrowRight size={14} className="stroke-[2.5]" />
                            </Link>
                        </div>
                        
                        <div className="flex flex-col gap-6">
                            {topStories.slice(0, 5).map((item, idx) => {
                                const href = buildContentUrl({
                                    slug: item.slug || "",
                                    type_of_content: item.type_of_content,
                                    content_tag: item.content_tag,
                                });
                                const imgUrl = getImageUrl(item);

                                return (
                                    <article key={item.id} className="flex items-center gap-4 group relative">
                                        <div className="relative w-32 aspect-[4/3] shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                                            <Image
                                                src={imgUrl}
                                                alt={item.Title || "News thumbnail"}
                                                fill
                                                sizes="128px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {item.sectors?.[0]?.name && (
                                                <Link
                                                    href={`/sectors/${slugify(item.sectors[0].name)}`}
                                                    className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block relative z-20 hover:underline mb-1"
                                                >
                                                    {item.sectors[0].name}
                                                </Link>
                                            )}
                                            <Link href={href} className="before:absolute before:inset-0 z-10">
                                                <h3 className="text-[15px] font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-3 mb-2" style={{ fontFamily: "var(--font-playfair, serif)" }}>
                                                    {item.Title}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                <time dateTime={item.Date || item.createdAt || ""}>
                                                    {formatContentDate(item.Date || item.createdAt || "")}
                                                </time>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </aside>
                </div>
            </div>
            {activeVideo && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-200"
                    onClick={() => setActiveVideo(null)}
                >
                    <div 
                        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 flex flex-col my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                                    Energdive Video Player
                                </span>
                            </div>
                            <button
                                onClick={() => setActiveVideo(null)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                                aria-label="Close video player"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Video Player Frame */}
                        <div className="relative aspect-video w-full bg-black">
                            {activeVideo.youtubeId ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                                    title={activeVideo.title}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                                    <Play size={44} className="text-slate-600 mb-3" />
                                    <p className="text-sm text-slate-300 mb-4 font-medium">Watch full video report on dedicated page</p>
                                    <Link
                                        href={`/videos/${activeVideo.slug}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                                    >
                                        Open Video Page
                                        <ExternalLink size={14} />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / Video Title Info */}
                        <div className="p-4 sm:p-5 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                            <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
                                    {activeVideo.title}
                                </h3>
                                {activeVideo.date && (
                                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                        {activeVideo.category || "Energy"} • {formatContentDate(activeVideo.date)}
                                    </p>
                                )}
                            </div>
                            <Link
                                href={`/videos/${activeVideo.slug}`}
                                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Video Page
                                <ExternalLink size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
