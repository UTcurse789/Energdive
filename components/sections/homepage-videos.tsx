import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatContentDate } from "@/lib/date";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export async function getLatestVideos() {
    try {
        const res = await fetch(
            `${STRAPI_BASE}/api/videos?populate[0]=thumbnail&populate[1]=sectors&sort=createdAt:desc&pagination[pageSize]=5`,
            { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data || []).map((item: any) => {
            const thumbUrl = item.thumbnail?.url
                ? strapiImageUrl(item.thumbnail.url)
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
        <section className="py-16 lg:py-10 bg-white border-y border-slate-100">
            <div className="max-w-6xl mx-auto px-8 sm:px-10 lg:px-16">
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-red-600 rounded-sm animate-pulse" />
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                            Multimedia &amp; Video Coverage
                        </h2>
                    </div>
                    <Link
                        href="/videos"
                        className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                        View All Videos &rarr;
                    </Link>
                </div>

                {/* Top 3 grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.slice(0, 3).map((video: any) => (
                        <Link
                            key={video.id}
                            href={`/videos/${video.slug}`}
                            className="group block"
                        >
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 mb-4 border border-slate-200 shadow-sm group-hover:border-emerald-400/60 group-hover:shadow-md transition-all duration-300">
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                                    <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center pl-1 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-2xl">
                                        <Play size={22} className="fill-white" />
                                    </div>
                                </div>
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-slate-200/80">
                                    {video.category}
                                </div>
                            </div>
                            <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                                {video.title}
                            </h3>
                            <div className="text-[11px] text-slate-500 font-medium mt-1">
                                <time>{video.date}</time>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom 2 list */}
                {videos.length > 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-200">
                        {videos.slice(3, 5).map((video: any) => (
                            <Link
                                key={video.id}
                                href={`/videos/${video.slug}`}
                                className="group flex gap-5 items-center p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400/50 hover:bg-emerald-50/40 transition-all"
                            >
                                <div className="relative w-36 h-24 shrink-0 overflow-hidden rounded-lg bg-slate-200 border border-slate-200">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        sizes="144px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                        <div className="w-9 h-9 bg-red-600/90 rounded-full flex items-center justify-center pl-0.5 text-white">
                                            <Play size={14} className="fill-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                        {video.category}
                                    </span>
                                    <h4 className="text-sm font-bold leading-snug mt-1 text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                                        {video.title}
                                    </h4>
                                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                                        <time>{video.date}</time>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
