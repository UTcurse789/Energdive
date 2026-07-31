"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from "lucide-react";
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
    FeaturedImage?: HeroImage | null;
    Excerpt?: HeroExcerptBlock[] | null;
    sectors?: HeroSector[] | null;
    type_of_content?: HeroContentType | null;
    content_tag?: unknown;
    Date?: string | null;
    createdAt?: string | null;
    author?: { name?: string | null } | null;
};

interface HeroProps {
    heroStories?: HeroItem[];
    topStories?: HeroItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getImageUrl(article: HeroItem): string {
    const url = article.FeaturedImage?.url;
    if (!url) return "/placeholder.jpg";
    return strapiImageUrl(url);
}

function getExcerpt(excerpt?: HeroExcerptBlock[] | null): string {
    return (
        excerpt
            ?.map((p) => (p.children || []).map((c) => c.text || "").join(""))
            .join(" ") || ""
    );
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
        <section className="py-8 lg:py-12 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="lg:col-span-8 flex flex-col">
                        <Skeleton className="aspect-[16/8.7] w-full rounded-xl mb-3" />
                        <Skeleton className="h-8 w-3/4 mt-4" />
                        <Skeleton className="h-5 w-full mt-3" />
                        <Skeleton className="h-5 w-5/6 mt-2" />
                        <Skeleton className="h-4 w-48 mt-5" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col pt-8 lg:pt-0 lg:pl-8">
                        <Skeleton className="h-6 w-full mb-5 border-b pb-3" />
                        <div className="flex flex-col gap-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-5">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="w-28 aspect-[4/3] rounded-sm shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Hero({ heroStories: propHeroStories, topStories: propTopStories }: HeroProps) {
    const [coverStories, setCoverStories] = useState<HeroItem[]>([]);
    const [articles, setArticles] = useState<HeroItem[]>([]);
    const [loading, setLoading] = useState(!propHeroStories?.length);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

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
    const topStories = propTopStories || articles.slice(0, 6);

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
        <section className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 py-1 md:py-8 border-b border-slate-200">

                    {/* ── LEFT: Hero Featured (8 cols) ── */}
                    <article className="lg:col-span-8 flex flex-col group relative">

                        {/* Image */}
                        <div className="relative aspect-[16/8.7] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm mb-3">
                            {featured.FeaturedImage?.url ? (
                                <Image
                                    src={getImageUrl(featured)}
                                    alt={featured.Title || "Featured energy story"}
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                    className={`object-cover transition-transform duration-700 ${
                                        isTransitioning ? "opacity-50 scale-105" : "opacity-100 scale-100"
                                    } group-hover:scale-[1.02]`}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                    <Zap size={64} className="text-white/10" />
                                </div>
                            )}

                            {/* Sector + Content-type badges */}
                            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                                {featured.sectors?.[0]?.name && (
                                    <Link
                                        href={`/sectors/${slugify(featured.sectors[0].name)}`}
                                        className="bg-emerald-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm shadow-md hover:bg-emerald-700 transition-colors"
                                    >
                                        {featured.sectors[0].name}
                                    </Link>
                                )}
                                {featured.type_of_content?.name && (
                                    <span className="bg-slate-900/85 backdrop-blur-sm text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border border-white/10 shadow-md">
                                        {featured.type_of_content.name}
                                    </span>
                                )}
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Carousel controls — only when multiple slides */}
                            {carouselArticles.length > 1 && (
                                <>
                                    {/* Dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                        {carouselArticles.map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                aria-label={`Slide ${i + 1}`}
                                                aria-current={i === currentSlide ? "true" : undefined}
                                                onClick={() => goToSlide(i)}
                                                className="relative flex h-6 w-6 items-center justify-center rounded-full focus:outline-none"
                                            >
                                                <span
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        i === currentSlide ? "w-6 bg-emerald-500" : "w-2 bg-white/50"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Arrows */}
                                    <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-4 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            aria-label="Previous slide"
                                            onClick={() => goToSlide((currentSlide - 1 + carouselArticles.length) % carouselArticles.length)}
                                            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-emerald-600 transition-all"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Next slide"
                                            onClick={nextSlide}
                                            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-emerald-600 transition-all"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Text */}
                        <div className="px-1 flex-1 flex flex-col">
                            <Link href={featuredHref} className="before:absolute before:inset-0 z-10">
                                <h2
                                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight hover:text-emerald-700 transition-colors"
                                    style={{ fontFamily: "var(--font-playfair, serif)" }}
                                >
                                    {featured.Title}
                                </h2>
                            </Link>
                            <p className="text-lg text-slate-600 mt-4 leading-relaxed font-light line-clamp-2">
                                {getExcerpt(featured.Excerpt)}
                            </p>
                            <div className="mt-5 flex items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                                <span className="text-slate-900 font-bold">
                                    By {featured.author?.name || "ENERGDIVE Desk"}
                                </span>
                                <span>•</span>
                                <time dateTime={featured.Date || featured.createdAt || ""}>
                                    {formatContentDate(featured.Date || featured.createdAt || "")}
                                </time>
                            </div>
                        </div>
                    </article>

                    {/* ── RIGHT: Top Stories Sidebar (4 cols) ── */}
                    <aside className="lg:col-span-4 flex flex-col pt-8 lg:pt-0 lg:pl-6">
                        {/* Sidebar heading */}
                        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-5">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                                Latest Stories
                            </h2>
                            <Link href="/news" className="text-[10px] font-black text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition-colors tracking-widest">
                                ALL NEWS <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="flex flex-col gap-5">
                            {topStories.slice(0, 5).map((item, idx) => {
                                const href = buildContentUrl({
                                    slug: item.slug || "",
                                    type_of_content: item.type_of_content,
                                    content_tag: item.content_tag,
                                });
                                return (
                                    <article key={item.id} className="flex gap-5 group relative">
                                        <div className="flex flex-col flex-1">
                                            {item.sectors?.[0]?.name && (
                                                <Link
                                                    href={`/sectors/${slugify(item.sectors[0].name)}`}
                                                    className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 relative z-20 hover:underline"
                                                >
                                                    {item.sectors[0].name}
                                                </Link>
                                            )}
                                            <Link href={href} className="before:absolute before:inset-0 z-10">
                                                <h4 className="font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-3">
                                                    {item.Title}
                                                </h4>
                                            </Link>
                                            <div className="mt-2 text-[10px] text-slate-500 font-medium">
                                                <time dateTime={item.Date || item.createdAt || ""}>
                                                    {formatContentDate(item.Date || item.createdAt || "")}
                                                </time>
                                            </div>
                                        </div>
                                        <div className="relative w-28 sm:w-36 aspect-[4/3] shrink-0 overflow-hidden bg-slate-200 rounded-sm border border-slate-100">
                                            {item.FeaturedImage?.url ? (
                                                <Image
                                                    src={getImageUrl(item)}
                                                    alt=""
                                                    fill
                                                    sizes="(max-width: 640px) 112px, 144px"
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                                    <Zap size={16} className="text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </aside>

                </div>
            </div>
        </section>
    );
}
