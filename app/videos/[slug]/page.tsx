import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VIDEOS } from "@/data/dummy";
import { ArrowLeft, Share2, Youtube, Clock, Eye, Calendar, Tag } from "lucide-react";

export default async function VideoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const video = VIDEOS.find(v => v.slug === slug);

    if (!video) {
        notFound();
    }

    // Suggested videos (excluding current)
    const relatedVideos = VIDEOS
        .filter(v => v.id !== video.id)
        .slice(0, 4);

    // Extract potential tags from category
    const tags = [video.category, "Energy Transition", "Analysis", "Expert Insights"];

    return (
        <main className="min-h-screen bg-linear-to-b from-gray-50 to-white text-black font-sans pb-20">

            {/* Breadcrumb & Back Navigation */}
            <div className="border-b border-gray-100 bg-white">
                <div className="mx-auto px-6 max-w-[1400px] py-4">
                    <Link
                        href="/videos"
                        className="inline-flex items-center text-gray-600 hover:text-black transition-colors text-sm font-semibold group"
                    >
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Videos
                    </Link>
                </div>
            </div>

            {/* Video Player Section - Premium White Background */}
            <div className="bg-white border-b border-gray-100">
                <div className="mx-auto px-6 max-w-[1400px] pt-8 pb-12">

                    {/* Video Player Wrapper with Shadow */}
                    <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-900 mb-8">
                        <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0&rel=0`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>

                    {/* Video Title & Actions */}
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start mb-8">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-2 text-xs font-black text-teal-700 uppercase tracking-widest">
                                <Tag size={14} />
                                <span>{video.category}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight text-gray-900">
                                {video.title}
                            </h1>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>{video.date}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    <span>{video.duration}</span>
                                </div>
                                {video.views && (
                                    <>
                                        <span className="text-gray-300">•</span>
                                        <div className="flex items-center gap-1.5">
                                            <Eye size={14} />
                                            <span>{video.views}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <a
                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl"
                            >
                                <Youtube size={18} /> Watch on YouTube
                            </a>
                            <button className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border border-gray-200">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="mx-auto px-6 max-w-[1400px] pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Main Content - Left 2/3 */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* Description Card */}
                        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                            <h2 className="text-xl font-serif font-bold mb-4 text-gray-900">About this video</h2>
                            <div className="prose prose-lg text-gray-700 leading-relaxed">
                                <p>{video.description}</p>
                            </div>
                        </div>

                        {/* Author/Expert Card */}
                        <div className="bg-linear-to-br from-teal-50 to-white rounded-xl border border-teal-100 p-8 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wider text-teal-800 mb-4">Expert Analyst</h3>
                            <div className="flex items-center gap-5">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-teal-100 border-2 border-teal-200 flex-shrink:0">
                                    <Image
                                        src={video.author.avatar}
                                        alt={video.author.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-gray-900">{video.author.name}</p>
                                    <p className="text-sm text-teal-700 font-medium">{video.author.role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">Related Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full transition-colors cursor-pointer border border-gray-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Right 1/3 */}
                    <div className="space-y-8">

                        {/* Related Videos */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
                            <h3 className="font-serif text-xl font-bold border-b border-gray-100 pb-4 mb-6 text-gray-900">
                                More Videos
                            </h3>
                            <div className="space-y-5">
                                {relatedVideos.map(related => (
                                    <Link
                                        key={related.id}
                                        href={`/videos/${related.slug}`}
                                        className="group block"
                                    >
                                        <div className="flex gap-3">
                                            <div className="relative w-28 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink:0 border border-gray-200">
                                                <Image
                                                    src={related.thumbnail}
                                                    alt={related.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                                                        <Youtube size={14} className="text-red-600" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm leading-tight group-hover:text-teal-700 transition-colors mb-2 line-clamp-2">
                                                    {related.title}
                                                </h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Clock size={10} />
                                                    <span>{related.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <Link
                                href="/videos"
                                className="mt-6 block text-center py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-lg transition-colors border border-gray-200"
                            >
                                View All Videos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
