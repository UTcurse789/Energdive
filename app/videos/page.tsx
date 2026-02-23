"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Eye, Calendar, Filter, Loader2 } from "lucide-react";
import { slugify } from "@/lib/utils";

// --- Types for our mapped data ---
interface Video {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    youtubeId: string;
    date: string;
    thumbnail: string;
    category: string;
    author: {
        name: string;
        avatar: string;
    };
}

export default function VideosPage() {
    const router = useRouter();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        async function getVideos() {
            try {
                // We populate author and sectors to get names and images
                const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
                const response = await fetch(`${baseUrl}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&populate[2]=sectors`);
                const { data } = await response.json();

                const mappedData: Video[] = data.map((item: any) => {
                    // Fallback: If Strapi thumbnail is null, use YouTube's image service
                    const thumbUrl = item.thumbnail?.url
                        ? `${baseUrl}${item.thumbnail.url}`
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
                                ? `${baseUrl}${item.author.avatar.url}`
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

    const categories = ["All", ...Array.from(new Set(videos.map((v) => v.category)))];

    const filteredVideos = activeCategory === "All"
        ? videos
        : videos.filter((v) => v.category === activeCategory);

    const featuredVideo = videos[0];
    const gridVideos = activeCategory === "All" ? filteredVideos.slice(1) : filteredVideos;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-teal-600" size={40} />
                    <p className="text-gray-500 font-medium">Loading Video Library...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 text-black font-sans pb-20">
            <div className="mx-auto px-6 max-w-[1400px]">

                {/* Header Section */}
                <div className="text-center pt-16 pb-12">
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-teal-100">
                        <Play size={12} className="fill-teal-700" />
                        Video Library
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-medium mb-6 tracking-tight text-gray-900">
                        Videos
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Watch conversations that matter with ENERGDIVE Videos, where domain experts and sector leaders share quick insights and viewpoints on India’s evolving energy landscape.
                    </p>
                </div>

                {/* Featured Video (Large Card) */}
                {activeCategory === "All" && featuredVideo && (
                    <div className="py-8">
                        <div onClick={() => router.push(`/videos/${featuredVideo.slug}`)} className="group block cursor-pointer">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500">
                                <div className="relative aspect-video lg:aspect-auto min-h-[400px]">
                                    <Image
                                        src={featuredVideo.thumbnail}
                                        alt={featuredVideo.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="w-20 h-20 bg-white/95 rounded-full flex items-center justify-center pl-1 shadow-2xl group-hover:scale-110 transition-transform">
                                            <Play size={32} className="text-red-600 fill-red-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 flex flex-col justify-center">
                                    <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-6">
                                        {featuredVideo.category}
                                    </span>
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4 group-hover:text-teal-700 transition-colors">
                                        {featuredVideo.title}
                                    </h2>
                                    <p className="text-gray-600 text-lg mb-8 line-clamp-3 italic">
                                        {featuredVideo.excerpt}
                                    </p>
                                    <div className="pt-6 border-t border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">{featuredVideo.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Section */}
                <div className="py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-teal-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Categories</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${activeCategory === cat
                                    ? "bg-black text-white border-black shadow-lg"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-teal-400"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {gridVideos.map((video) => (
                        <div key={video.id} onClick={() => router.push(`/videos/${video.slug}`)} className="group block cursor-pointer">
                            <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-teal-100 transition-all">
                                <div className="relative aspect-video overflow-hidden">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play size={20} className="text-red-600 fill-red-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <span className="text-teal-600 text-[10px] font-black uppercase tracking-widest mb-3">
                                        {video.category}
                                    </span>
                                    <h3 className="text-xl font-bold leading-snug mb-3 group-hover:text-teal-700 transition-colors line-clamp-2">
                                        {video.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">
                                        {video.excerpt}
                                    </p>
                                    <div className="pt-4 border-t border-gray-50">
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{video.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredVideos.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 italic font-serif text-xl">No videos found in this category.</p>
                    </div>
                )}
            </div>
        </main>
    );
}