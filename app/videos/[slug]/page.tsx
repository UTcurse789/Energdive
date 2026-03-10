import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import ArticleBody from "@/components/ArticleBody";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { DateChip } from "@/components/ui/date-chip";
import { ShareButton } from "@/components/ui/share-button";
import { ArrowLeft, Youtube, Tag, Printer } from "lucide-react";
import { formatContentDate } from "@/lib/date";

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
    const authorName = video.author?.name || "Team ENERGDIVE";
    const authorAvatar = video.author?.avatar?.url
        ? `${baseUrl}${video.author.avatar.url}`
        : "/api/placeholder/40/40";

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

            {/* Video Player Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="mx-auto px-6 max-w-[1200px] pt-8 pb-12">
                    <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl border-12px border-gray-900">
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        />
                    </div>

                    <div className="mt-10 space-y-4">
                        <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-[0.2em]">
                            <Tag size={12} />
                            <span>{category}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight text-gray-900">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-400 font-medium">
                            <DateChip value={createdAt} />
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/print/${slug}`}
                                    target="_blank"
                                    className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 font-medium text-sm border border-gray-200 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                    title="Print this article"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    Print
                                </Link>
                                <div className="flex items-center gap-2 text-red-600 font-bold hover:opacity-80">
                                    <ShareButton title={title} url={`https://www.youtube.com/watch?v=${youtubeId}`} className="text-red-600 hover:text-red-700" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content & Sidebar */}
            <div className="mx-auto px-6 max-w-[1200px] pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

                    {/* Left Side: Description & Author */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 border-b pb-2">Overview</h2>
                            <div className="prose prose-lg prose-teal max-w-none text-gray-700 leading-relaxed">
                                <ArticleBody content={description} />
                            </div>
                        </section>

                        {/* <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-6">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-0 bg-gray-50 border border-gray-100">
                                <Image src={authorAvatar} sizes="32px" alt={authorName} fill className="object-cover" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Contributed By</span>
                                <Link href={`/author/${slugify(authorName)}`} className="block hover:opacity-80 transition-opacity">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-teal-600 transition-colors">{authorName}</h3>
                                </Link>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    The editorial unit of ENERGDIVE, tracking policy and innovation breakthroughs in the energy sector.
                                </p>
                            </div>
                        </section> */}
                    </div>

                    {/* Right Side: More Videos */}
                    <aside className="space-y-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                                <Youtube size={18} className="text-red-600" />
                                More Videos
                            </h3>
                            <div className="space-y-6">
                                {moreVideos.map((item: any) => {
                                    const thumb = `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`;
                                    const itemAuthor = item.author?.name || "Team ENERGDIVE";
                                    const itemAuthorImg = item.author?.avatar?.url
                                        ? `${baseUrl}${item.author.avatar.url}`
                                        : "/api/placeholder/30/30";

                                    return (
                                        <div key={item.id} className="group">
                                            <div className="flex gap-4">
                                                <Link href={`/videos/${item.slug}`} className="block">
                                                    <div className="relative w-32 aspect-video rounded-xl overflow-hidden flex-0 border border-gray-200">
                                                        <Image src={thumb} priority sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform" />
                                                    </div>
                                                </Link>
                                                <div className="space-y-2">
                                                    <Link href={`/videos/${item.slug}`}>
                                                        <h4 className="text-sm font-bold leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                                                            {item.title}
                                                        </h4>
                                                    </Link>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                                            <Image src={itemAuthorImg} alt={itemAuthor} fill className="object-cover" />
                                                        </div>
                                                        <Link href={`/author/${slugify(itemAuthor)}`} className="text-[10px] font-bold text-gray-400 hover:text-teal-600 transition-colors">{itemAuthor}</Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                </div>
            </div>
        </main>
    );
}
