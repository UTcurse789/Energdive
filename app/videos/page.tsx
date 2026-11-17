"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { strapiImageUrl } from "@/lib/strapi-image";

const VIDEOS_PER_PAGE = 20;

// --- Types for our mapped data ---
interface Video {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    youtubeId: string;
    // date: string;
    thumbnail: string;
    category: string;
    author: {
        name: string;
        avatar: string;
    };
}

interface StrapiVideo {
    id: number;
    title: string;
    slug: string;
    Excerpt?: string;
    youtubeId?: string;
    thumbnail?: { url?: string | null } | null;
    sectors?: Array<{ name?: string | null }> | null;
    author?: {
        name?: string | null;
        avatar?: { url?: string | null } | null;
    } | null;
}

function getVisiblePageNumbers(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export default function VideosPage() {
    const router = useRouter();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        async function getVideos() {
            try {
                // We populate author and sectors to get names and images
                const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
                let allData: StrapiVideo[] = [];
                let page = 1;
                let pageCount = 1;

                do {
                    const response = await fetch(
                        `${baseUrl}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&populate[2]=sectors&sort=publishedAt:desc&pagination[page]=${page}&pagination[pageSize]=${VIDEOS_PER_PAGE}`
                    );
                    if (!response.ok) {
                        throw new Error(`Strapi returned ${response.status}`);
                    }
                    const json = await response.json();
                    if (Array.isArray(json?.data)) {
                        allData = allData.concat(json.data as StrapiVideo[]);
                    }
                    pageCount = json?.meta?.pagination?.pageCount || 1;
                    page++;
                } while (page <= pageCount);

                const mappedData: Video[] = allData.map((item) => {
                    // Fallback: If Strapi thumbnail is null, use YouTube's image service
                    const thumbUrl = item.thumbnail?.url
                        ? strapiImageUrl(item.thumbnail.url)
                        : `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`;

                    return {
                        id: item.id,
                        title: item.title,
                        slug: item.slug,
                        excerpt: item.Excerpt || "",
                        youtubeId: item.youtubeId,
                        date: item.date,
                        thumbnail: thumbUrl,
                        category: item.sectors?.[0]?.name || "Energy",
                        author: {
                            name: item.author?.name || "Team ENERGDIVE",
                            avatar: item.author?.avatar?.url
                                ? strapiImageUrl(item.author.avatar.url)
                                : "/images/avtar.png", // Start with a default avatar if none exists
                        },
                    };
                });

                setVideos(mappedData);
            } catch (error) {
                console.error("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        }

        getVideos();
    }, []);

    const categories = [
        "All",
        ...Array.from(new Set(videos.map((v) => v.category).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b)
        ),
    ];

    const filteredVideos = activeCategory === "All"
        ? videos
        : videos.filter((v) => v.category === activeCategory);
    const totalPages = Math.max(1, Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE));
    const displayedVideos = filteredVideos.slice(
        (currentPage - 1) * VIDEOS_PER_PAGE,
        currentPage * VIDEOS_PER_PAGE
    );
    const visiblePageNumbers = getVisiblePageNumbers(currentPage, totalPages);

    const selectCategory = (category: string) => {
        setActiveCategory(category);
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-white pb-20">
                <Header />
                {/* Header Skeleton */}
                <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20 pt-16 pb-8">
                    <div className="text-center">
                        <Skeleton className="h-16 md:h-20 w-48 mx-auto mb-6" />
                        <Skeleton className="h-6 w-full max-w-2xl mx-auto mb-2" />
                        <Skeleton className="h-6 w-1/2 mx-auto" />
                    </div>
                </div>

                {/* Filter Skeleton */}
                <div className="border-b border-gray-100 py-3">
                    <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
                        <div className="flex gap-3 overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-24 rounded-lg flex-shrink-0" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 pt-8">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="flex flex-col bg-transparent">
                                <Skeleton className="aspect-video w-full rounded-xl mb-3" />
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-2 flex-1 pt-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-3 w-1/2 mt-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white text-black font-sans pb-20">
            {/* Header Section */}
            <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20 pt-16 pb-8">
                <div className="text-left">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-[#1a2340]">
                        Videos
                    </h1>
                    <p className="mt-6 max-w-[58ch] text-lg font-light leading-relaxed text-zinc-500">
                        Watch conversations that matter with ENERGDIVE Videos, where domain experts and sector leaders share quick insights and viewpoints on India’s evolving energy landscape.
                    </p>
                </div>
            </div>

            {/* Filter Section (Top Bar like YouTube) */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-y border-gray-100 py-3">
                <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => selectCategory(cat)}
                                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                                    activeCategory === cat
                                        ? "bg-black text-white"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20 pt-8">
                {/* <AdBanner placement="Videos_top" variant="banner" className="pb-8" /> */}

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
                    {displayedVideos.map((video) => (
                        <div key={video.id} onClick={() => router.push(`/videos/${video.slug}`)} className="group block cursor-pointer">
                            <div className="flex flex-col h-full bg-transparent">
                                <div className="relative aspect-video overflow-hidden rounded-xl mb-3">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Play icon overlay on hover (optional) */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play size={20} className="text-red-600 fill-red-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex flex-col flex-1 min-w-0 pr-4">
                                        <h3 className="text-base font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                                            {video.title}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                                                {video.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredVideos.length === 0 && (
                    <div className="text-center py-32">
                        <p className="text-gray-500 text-lg">No videos found for this category.</p>
                    </div>
                )}

                {filteredVideos.length > VIDEOS_PER_PAGE && (
                    <nav
                        className="mt-14 flex items-center justify-center gap-3"
                        aria-label="Video pagination"
                    >
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <div className="flex items-center gap-1" aria-label={`Page ${currentPage} of ${totalPages}`}>
                            {visiblePageNumbers.map((page, index) => page === "ellipsis" ? (
                                <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-500" aria-hidden="true">…</span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    aria-current={currentPage === page ? "page" : undefined}
                                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                                        currentPage === page
                                            ? "bg-black text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </nav>
                )}
            </div>
        </main>
    );
}
