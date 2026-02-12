"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { VIDEOS } from "@/data/dummy";
import { Play, Clock, Eye, Calendar, Filter } from "lucide-react";

export default function VideosPage() {
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = ["All", ...Array.from(new Set(VIDEOS.map(v => v.category)))];

    const filteredVideos = activeCategory === "All"
        ? VIDEOS
        : VIDEOS.filter(v => v.category === activeCategory);

    // Featured video (first one)
    const featuredVideo = VIDEOS[0];
    const gridVideos = filteredVideos.slice(activeCategory === "All" ? 1 : 0);

    return (
        <main className="min-h-screen bg-linear-to-b from-white via-gray-50 to-white text-black font-sans pb-20">
            <div className="mx-auto px-6 max-w-[1400px]">

                {/* Header Section */}
                <div className="text-center pt-16 pb-12 border-b border-gray-100">
                    <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-teal-100">
                        <Play size={12} className="fill-teal-700" />
                        Video Library
                    </div>
                    <h1 className="text-5xl md:text-6xl font-serif font-medium mb-6 tracking-tight text-gray-900">
                        EnergDive Videos
                    </h1>
                    <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                        In-depth analysis, expert interviews, and comprehensive coverage of the global energy transition.
                        Watch the latest insights from industry leaders and energy analysts.
                    </p>
                </div>

                {/* Featured Video Hero - Only show when "All" is selected */}
                {activeCategory === "All" && (
                    <div className="py-12 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">Featured Video</h2>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        <Link href={`/videos/${featuredVideo.slug}`} className="group block">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500">
                                {/* Video Thumbnail */}
                                <div className="relative aspect-video lg:aspect-auto overflow-hidden bg-gray-900">
                                    <Image
                                        src={featuredVideo.thumbnail}
                                        alt={featuredVideo.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                                        <div className="w-20 h-20 bg-white/95 rounded-full flex items-center justify-center pl-1 shadow-2xl group-hover:scale-110 transition-transform">
                                            <Play size={32} className="text-red-600 fill-red-600" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-black/80 text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                                        {featuredVideo.duration}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 lg:p-10 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 text-xs font-black text-teal-700 uppercase tracking-widest mb-4">
                                        <span className="bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                                            {featuredVideo.category}
                                        </span>
                                    </div>

                                    <h3 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4 group-hover:text-teal-700 transition-colors">
                                        {featuredVideo.title}
                                    </h3>

                                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                        {featuredVideo.description}
                                    </p>

                                    {/* Metadata */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <span>{featuredVideo.date}</span>
                                        </div>
                                        {featuredVideo.views && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Eye size={14} />
                                                    <span>{featuredVideo.views}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Author */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                            <Image
                                                src={featuredVideo.author.avatar}
                                                alt={featuredVideo.author.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{featuredVideo.author.name}</p>
                                            <p className="text-xs text-gray-500">{featuredVideo.author.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Filter Section */}
                <div className="py-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <Filter size={18} className="text-gray-400" />
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">Filter by Category</h2>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all border-2 ${activeCategory === category
                                        ? "bg-black text-white border-black shadow-lg scale-105"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                    {gridVideos.map(video => (
                        <Link key={video.id} href={`/videos/${video.slug}`} className="group block">
                            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
                                {/* Thumbnail */}
                                <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center pl-0.5 shadow-lg group-hover:scale-110 transition-transform">
                                            <Play size={22} className="text-red-600 fill-red-600" />
                                        </div>
                                    </div>
                                    <span className="absolute bottom-3 right-3 bg-black/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                                        {video.duration}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-black text-teal-700 uppercase tracking-wider">
                                        <span>{video.category}</span>
                                    </div>

                                    <h3 className="text-xl font-bold leading-tight group-hover:text-teal-700 transition-colors line-clamp-2">
                                        {video.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                        {video.description}
                                    </p>

                                    {/* Meta & Author */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                                <Image
                                                    src={video.author.avatar}
                                                    alt={video.author.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <p className="text-xs font-semibold text-gray-700">{video.author.name}</p>
                                        </div>
                                        {video.views && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Eye size={12} />
                                                <span>{video.views}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredVideos.length === 0 && (
                    <div className="text-center py-20 text-gray-400 italic bg-white rounded-xl border border-gray-100">
                        <p className="text-xl">No videos found in this category.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
