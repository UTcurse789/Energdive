"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, Play, X, ExternalLink } from "lucide-react";
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
        if (propHeroStories?.length) return;

        fetch(
            `${STRAPI_BASE}/api/contents?filters[show_hero_banner][$eq]=true&populate=*&pagination[pageSize]=10&sort=publishedAt:desc`
        )
            .then((r) => r.json())
            .then((d) => setCoverStories(d?.data || []))
            .catch(console.error)
            .finally(() => { if (propTopStories) setLoading(false); });

        if (!propTopStories) {
            fetch(
                `${STRAPI_BASE}/api/contents?filters[featured][$eq]=true&pagination[pageSize]=10&populate=*&sort=publishedAt:desc`
            )
                .then((r) => r.json())
                .then((d) => setArticles(d?.data || []))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
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
            <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                    {/* ── 1. LEFT COLUMN: Latest News (3 cols) ── */}
                    <aside className="lg:col-span-3 flex flex-col order-2 lg:order-1 pr-0 lg:pr-2 lg:border-r lg:border-slate-200">
                        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                                Latest News
                            </h2>
                            <Link href="/news" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">
                                ALL NEWS &rarr;
                            </Link>
                        </div>
                        <div className="flex flex-col divide-y divide-slate-100">
                            {topStories.slice(0, 11).map((item, idx) => {
                                const href = buildContentUrl({
                                    slug: item.slug || "",
                                    type_of_content: item.type_of_content,
                                    content_tag: item.content_tag,
                                });
                                const imgUrl = getImageUrl(item);

                                return (
                                    <article
                                        key={item.id}
                                        className={`py-3 first:pt-0 last:pb-0 items-start gap-3 group relative ${
                                            idx >= 6 ? "hidden lg:flex" : "flex"
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            {item.sectors?.[0]?.name && (
                                                <Link
                                                    href={`/sectors/${slugify(item.sectors[0].name)}`}
                                                    className="text-[10px] font-black text-red-600 uppercase tracking-widest block relative z-20 hover:underline mb-0.5"
                                                >
                                                    {item.sectors[0].name}
                                                </Link>
                                            )}
                                            <Link href={href} className="before:absolute before:inset-0 z-10">
                                                <h3 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-3">
                                                    {item.Title}
                                                </h3>
                                            </Link>
                                            <div className="text-[10px] text-slate-400 font-medium mt-1">
                                                <time dateTime={item.Date || item.createdAt || ""}>
                                                    {formatContentDate(item.Date || item.createdAt || "")}
                                                </time>
                                            </div>
                                        </div>

                                        <div className="relative w-16 h-14 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                                            <Image
                                                src={imgUrl}
                                                alt={item.Title || "News thumbnail"}
                                                fill
                                                sizes="64px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </aside>

                    {/* ── 2. CENTER COLUMN: Cover Story Heading + Big Image + Featured News List (6 cols) ── */}
                    <div className="lg:col-span-6 flex flex-col order-1 lg:order-2 lg:pr-4 xl:pr-6">
                        {/* Cover Story Heading ABOVE Image */}
                        <div className="mb-3">
                            <Link href={featuredHref}>
                                <h1
                                    className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight hover:text-emerald-700 transition-colors"
                                    style={{ fontFamily: "var(--font-playfair, serif)" }}
                                >
                                    {featured.Title}
                                </h1>
                            </Link>
                            {(featured.Date || featured.createdAt) && (
                                <time
                                    dateTime={featured.Date || featured.createdAt || ""}
                                    className="mt-1.5 block text-[10px] text-slate-400 font-medium uppercase tracking-wide"
                                >
                                    {formatContentDate(featured.Date || featured.createdAt || "")}
                                </time>
                            )}
                        </div>

                        {/* Cover Story Image */}
                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm mb-6 group">
                            {featured.FeaturedImage?.url ? (
                                <Image
                                    src={getImageUrl(featured)}
                                    alt={featured.Title || "Featured energy story"}
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className={`object-cover transition-transform duration-700 ${
                                        isTransitioning ? "opacity-50 scale-105" : "opacity-100 scale-100"
                                    } group-hover:scale-[1.02]`}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                    <Zap size={64} className="text-white/10" />
                                </div>
                            )}

                            {/* Sector Badges */}
                            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
                                {featured.sectors?.[0]?.name && (
                                    <Link
                                        href={`/sectors/${slugify(featured.sectors[0].name)}`}
                                        className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md hover:bg-emerald-700 transition-colors"
                                    >
                                        {featured.sectors[0].name}
                                    </Link>
                                )}
                            </div>

                            {/* Carousel Controls */}
                            {carouselArticles.length > 1 && (
                                <>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
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
                                                        i === currentSlide ? "w-5 bg-emerald-500" : "w-1.5 bg-white/50"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-2 sm:px-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            aria-label="Previous slide"
                                            onClick={() => goToSlide((currentSlide - 1 + carouselArticles.length) % carouselArticles.length)}
                                            className="p-1.5 sm:p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-emerald-600 transition-all"
                                        >
                                            <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Next slide"
                                            onClick={nextSlide}
                                            className="p-1.5 sm:p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-emerald-600 transition-all"
                                        >
                                            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Featured Stories Content List directly UNDER Cover Story image */}
                        {featuredStories && featuredStories.length > 0 && (
                            <div className="flex flex-col divide-y divide-slate-100 pt-2 border-t border-slate-200">
                                {featuredStories.slice(0, 7).map((item, idx) => (
                                    <article key={item.id || idx} className="py-3.5 first:pt-0 flex items-start gap-3 sm:gap-4 group relative">
                                        <div className="flex-1 min-w-0">
                                            <Link href={item.href || buildContentUrl({ slug: item.slug, contentType: item.contentType, content_tag: item.contentTag })} className="before:absolute before:inset-0 z-10">
                                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                            {item.date && (
                                                <time
                                                    dateTime={item.date}
                                                    className="mb-1 block text-[10px] text-slate-400 font-medium uppercase tracking-wide"
                                                >
                                                    {formatContentDate(item.date)}
                                                </time>
                                            )}
                                            {item.excerpt && (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-light">
                                                    {item.excerpt}
                                                </p>
                                            )}
                                        </div>
                                        {item.image && (
                                            <div className="relative w-20 sm:w-28 md:w-36 aspect-[16/10] shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shadow-xs">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    sizes="(max-width: 640px) 80px, 144px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── 3. RIGHT COLUMN: Ad Banner + Featured Videos (3 cols) ── */}
                    <aside className="lg:col-span-3 flex flex-col gap-6 order-3">
                        {/* Partner Ad Banner */}
                        <div className="w-full flex flex-col border-b border-slate-100 pb-6">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Advertisement
                            </span>
                            <AdBanner
                                placement="home_featured_partner"
                                variant="vertical"
                                className="w-full py-0"
                            />
                        </div>

                        {/* Featured Videos Block */}
                        {videos && videos.length > 0 && (
                            <div className="w-full flex flex-col gap-4 pt-2">
                                {/* Header: Featured Videos > */}
                                <div className="flex items-center justify-between pb-1">
                                    <Link href="/videos" className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-emerald-600 transition-colors">
                                        Featured Videos
                                        <ChevronRight size={14} className="text-slate-900 group-hover:text-emerald-600 transition-colors stroke-[2.5]" />
                                    </Link>
                                </div>

                                {/* Stacked Full-Width Video Cards */}
                                <div className="flex flex-col divide-y divide-slate-100">
                                    {videos.slice(0, 3).map((vid, idx) => (
                                        <article key={vid.id || idx} className="py-4 first:pt-0 last:pb-0">
                                            <button
                                                type="button"
                                                onClick={() => setActiveVideo(vid)}
                                                className="group flex flex-col text-left w-full cursor-pointer"
                                            >
                                                {/* Thumbnail Container */}
                                                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-900 mb-2.5 border border-slate-200 shadow-xs">
                                                    <Image
                                                        src={vid.thumbnail}
                                                        alt={vid.title}
                                                        fill
                                                        sizes="(max-width: 1024px) 100vw, 33vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />

                                                    {/* Play Overlay Button */}
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                            <Play size={18} className="fill-white text-white translate-x-[1px]" />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Play Duration Badge on Top Left */}
                                                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-md">
                                                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                                        <span>Watch</span>
                                                    </div>
                                                </div>

                                                {/* Video Title */}
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                                                    {vid.title}
                                                </h4>
                                                {vid.date && (
                                                    <time
                                                        dateTime={vid.date}
                                                        className="mt-1 block text-[10px] text-slate-400 font-medium uppercase tracking-wide"
                                                    >
                                                        {formatContentDate(vid.date)}
                                                    </time>
                                                )}
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                </div>
            </div>

            {/* ── VIDEO POPUP MODAL ── */}
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
