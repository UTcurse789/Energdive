import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { DateChip } from "@/components/ui/date-chip";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

async function getLatestVideos() {
    try {
        const res = await fetch(
            `${STRAPI_BASE}/api/videos?populate[0]=thumbnail&populate[1]=sectors&sort=createdAt:desc&pagination[pageSize]=5`,
            { next: { revalidate: 120 } }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data || []).map((item: any) => {
            const thumbUrl = item.thumbnail?.url
                ? `${STRAPI_BASE}${item.thumbnail.url}`
                : `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`;

            return {
                id: item.id,
                title: item.title || "",
                slug: item.slug || "",
                youtubeId: item.youtubeId || "",
                thumbnail: thumbUrl,
                date: formatContentDate(item.date || item.createdAt),
                category: item.sectors?.[0]?.name || "Energy",
            };
        });
    } catch (err) {
        console.error("Homepage videos fetch error:", err);
        return [];
    }
}

export async function HomepageVideos() {
    const videos = await getLatestVideos();
    if (videos.length === 0) return null;

    return (
        <section className="py-20 bg-white border-b border-gray-100">
            <div className="container mx-auto px-4 md:px-6 lg:px-12 max-w-[1400px]">
                <SectionHeading
                    title="Videos"
                    linkText="View All Videos"
                    linkHref="/videos"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                    {videos.slice(0, 3).map((video: any) => (
                        <Link
                            key={video.id}
                            href={`/videos/${video.slug}`}
                            className="group block"
                        >
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 mb-4 shadow-sm group-hover:shadow-lg transition-shadow">
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center pl-1 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-2xl">
                                        <Play size={22} className="text-red-600 fill-red-600" />
                                    </div>
                                </div>
                            </div>
                            <span className="text-[9px] font-black text-[#00A651] uppercase tracking-widest">
                                {video.category}
                            </span>
                            <h3 className="text-lg font-bold leading-snug mt-1 text-gray-900 group-hover:text-[#00A651] transition-colors line-clamp-2">
                                {video.title}
                            </h3>
                            <DateChip value={video.date} className="text-[10px] mt-1" />
                        </Link>
                    ))}
                </div>

                {videos.length > 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                        {videos.slice(3, 5).map((video: any) => (
                            <Link
                                key={video.id}
                                href={`/videos/${video.slug}`}
                                className="group flex gap-5 items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#00A651]/30 hover:bg-white transition-all"
                            >
                                <div className="relative w-32 h-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center pl-0.5">
                                            <Play size={12} className="text-red-600 fill-red-600" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-[#00A651] uppercase tracking-widest">
                                        {video.category}
                                    </span>
                                    <h4 className="text-sm font-bold leading-snug mt-1 text-gray-900 group-hover:text-[#00A651] transition-colors line-clamp-2">
                                        {video.title}
                                    </h4>
                                    <DateChip value={video.date} className="text-[10px] mt-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
