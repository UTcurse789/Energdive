import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import ArticleBody from "@/components/ArticleBody";
import { fetchDataBlocks } from "@/lib/parse-content-blocks";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { DateChip } from "@/components/ui/date-chip";
import { ShareButton } from "@/components/ui/share-button";
import { ArrowLeft, Youtube, Tag, Printer } from "lucide-react";
import { formatContentDate } from "@/lib/date";
import { strapiImageUrl } from "@/lib/strapi-image";
import { AdBanner } from "@/components/ads/AdBanner";
import { getCanonicalUrl } from "@/lib/seo";

function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

async function getVideoData(slug: string) {
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

    try {
        // CORRECTED: Added ${slug} to the template literal
        const res = await fetch(
            `${baseUrl}/api/videos?filters[slug][$eq]=${slug}&populate[0]=thumbnail&populate[1]=author.avatar&populate[2]=sectors`,
            { next: { revalidate: 3600 } }
        );

        const json = await res.json();
        const data = json.data;

        // Fetch recent videos for sidebar
        const recentRes = await fetch(`${baseUrl}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&populate[2]=sectors&pagination[limit]=5`);
        const recentJson = await recentRes.json();
        const recentData = recentJson.data;

        if (!data || data.length === 0) {
            return { video: null, moreVideos: [] };
        }

        return {
            video: data[0],
            moreVideos: recentData ? recentData.filter((v: any) => v.slug !== slug) : []
        };
    } catch (error) {
        console.error("Fetch Error:", error);
        return { video: null, moreVideos: [] };
    }
}

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const { video } = await getVideoData(slug);

    if (!video) {
        return { title: { absolute: "Video - ENERGDIVE" } };
    }

    const baseTitle = video.title || "Video";
    const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/videos/${slug}`);
    
    // Extract a plain text description from blocks content
    let description = "Watch this exclusive energy sector video on ENERGDIVE.";
    if (video.description && Array.isArray(video.description)) {
        const text = video.description
            .map((block: any) => (block.children || []).map((child: any) => child.text || "").join(""))
            .join(" ")
            .trim();
        if (text) description = text.substring(0, 160) + (text.length > 160 ? "..." : "");
    }

    const imageUrl = video.youtubeId 
        ? `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
        : getCanonicalUrl("/og-image.jpg");

    return {
        title: { absolute: shareTitle },
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: shareTitle,
            description,
            url: canonicalUrl,
            siteName: "ENERGDIVE",
            images: [
                {
                    url: imageUrl,
                    width: 1280,
                    height: 720,
                    alt: shareTitle,
                },
            ],
            type: "video.other",
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description,
            images: [imageUrl],
        },
    };
}
export default async function VideoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { video, moreVideos } = await getVideoData(slug);

    if (!video) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

    // Extract metadata
    const title = video.title;
    const youtubeId = video.youtubeId;
    const createdAt = formatContentDate(video.publishedAt);
    const description: BlocksContent = video.description;
    const category = video.sectors?.[0]?.name || "Energy";
    const sectorSlug = video.sectors?.[0]?.slug || undefined;
    const authorName = video.author?.name || "Team ENERGDIVE";
    const authorAvatar = video.author?.avatar?.url
        ? strapiImageUrl(video.author.avatar.url)
        : "/api/placeholder/40/40";

    const dataBlocks = await fetchDataBlocks(description as any[] || []);

    return (
        <main className="min-h-screen bg-gray-50 text-black font-sans pb-20">
            <ScrollProgress />
            {/* Navigation */}
            <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="mx-auto px-6 max-w-[1400px] py-4">
                    <Link href="/videos" className="inline-flex items-center text-gray-500 hover:text-teal-600 transition-colors text-sm font-bold group">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        BACK TO VIDEO
                    </Link>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20 pt-6 lg:pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    {/* Left Side: Video Player & Details */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Video Player */}
                        <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
                                title={title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>

                        {/* Title & Metadata */}
                        <div className="space-y-3 pt-2">
                            <h1 className="text-xl md:text-2xl font-bold leading-tight text-gray-900">
                                {title}
                            </h1>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                    <DateChip value={createdAt} />
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <ShareButton 
                                        title={title} 
                                        url={`https://www.youtube.com/watch?v=${youtubeId}`} 
                                        className="text-gray-600 hover:text-gray-900 font-medium text-sm border border-gray-200 px-4 py-2 rounded-full bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Overview */}
                        <section className="bg-gray-100/60 p-4 rounded-xl mt-2">
                            <div className="prose prose-sm prose-teal max-w-none text-gray-800">
                                <ArticleBody content={description} dataBlocks={dataBlocks} />
                            </div>
                        </section>

                        <div className="pt-8">
                            <AdBanner
                                placement="videos_partner_end"
                                sectorSlug={sectorSlug}
                                variant="native"
                            />
                        </div>
                    </div>

                    {/* Right Side: More Videos Sidebar */}
                    <div className="lg:col-span-4">
                        <aside className="sticky top-24 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-gray-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg">More Videos</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                {moreVideos.map((item: any) => {
                                    const thumb = `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
                                    const itemAuthor = item.author?.name || "Team ENERGDIVE";
                                    return (
                                        <Link key={item.id} href={`/videos/${item.slug}`} className="group flex gap-3 items-start">
                                            <div className="relative w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-100">
                                                <Image src={thumb} sizes="144px" alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                            </div>
                                            <div className="flex flex-col pt-1">
                                                <h4 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h4>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </aside>
                    </div>

                </div>
            </div>
        </main>
    );
}
