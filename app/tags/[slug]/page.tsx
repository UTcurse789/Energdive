import Image from "next/image";
import Link from "next/link";
import { Tag, Play, ArrowUpRight } from "lucide-react";
import { TagBadge } from "@/components/ui/tag-badge";
import { slugify } from "@/lib/utils";
import { DateChip } from "@/components/ui/date-chip";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

function readAttrs(item: any) {
    return item?.attributes || item || {};
}

function toAbsoluteUrl(url?: string | null) {
    if (!url) return null;
    return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
}

function normalizeTag(tag: any) {
    const source = readAttrs(tag);
    const name = source?.name || "";
    const slug = source?.slug || (name ? slugify(name) : "");
    if (!name) return null;
    return { name, slug };
}

function getTagList(item: any) {
    const attrs = readAttrs(item);
    const tagsRaw = Array.isArray(attrs.tags?.data)
        ? attrs.tags.data
        : Array.isArray(attrs.tags)
            ? attrs.tags
            : [];
    return tagsRaw.map((tag: any) => normalizeTag(tag)).filter(Boolean);
}

function resolveImage(item: any) {
    const attrs = readAttrs(item);
    const imageSource = attrs.FeaturedImage || attrs.featuredImage || attrs.cover?.data || attrs.cover;
    if (!imageSource) return "/magazine-default.jpg";

    const imageAttrs = readAttrs(imageSource);
    const url =
        imageAttrs?.formats?.medium?.url ||
        imageAttrs?.formats?.small?.url ||
        imageAttrs?.formats?.thumbnail?.url ||
        imageAttrs?.url;
    return toAbsoluteUrl(url) || "/magazine-default.jpg";
}

async function fetchTagContent(tagSlug: string) {
    try {
        const res = await fetch(
            `${STRAPI_BASE}/api/contents?filters[tags][slug][$eq]=${encodeURIComponent(tagSlug)}&populate=*&sort=publishedAt:desc&pagination[pageSize]=50`,
            { next: { revalidate: 120 } }
        );
        if (!res.ok) return { articles: [], tagName: tagSlug };

        const json = await res.json();
        const rawData = json.data || [];

        const fallbackTagName = tagSlug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

        const matchedTag = rawData
            .flatMap((entry: any) => getTagList(entry))
            .find((tag: any) => tag.slug === tagSlug);

        const tagName = matchedTag?.name || fallbackTagName;

        const articles = rawData
            .map((entry: any) => {
                const attrs = readAttrs(entry);
                const excerptBlocks = attrs.Excerpt || attrs.excerpt;
                const excerpt = typeof excerptBlocks === "string"
                    ? excerptBlocks
                    : excerptBlocks?.[0]?.children?.[0]?.text || "";

                const sectorsRaw = Array.isArray(attrs.sectors?.data)
                    ? attrs.sectors.data
                    : Array.isArray(attrs.sectors)
                        ? attrs.sectors
                        : [];
                const firstSector = readAttrs(sectorsRaw[0]);

                return {
                    id: attrs.id || entry.id,
                    title: attrs.Title || attrs.title || "",
                    slug: attrs.slug || "",
                    image: resolveImage(entry),
                    date: formatContentDate(attrs.publishedAt || attrs.createdAt || attrs.date || attrs.Date),
                    excerpt,
                    contentType:
                        attrs.type_of_content?.name ||
                        attrs.type_of_content?.data?.attributes?.name ||
                        attrs.type_of_content ||
                        "Articles",
                    sector: firstSector?.name || "",
                    tags: getTagList(entry),
                };
            })
            .filter((item: any) => item.slug);

        return { articles, tagName };
    } catch (err) {
        console.error("Tag content fetch error:", err);
        return { articles: [], tagName: tagSlug };
    }
}

async function fetchTagVideos(tagSlug: string) {
    try {
        const res = await fetch(
            `${STRAPI_BASE}/api/videos?filters[tags][slug][$eq]=${encodeURIComponent(tagSlug)}&populate=*&sort=createdAt:desc`,
            { next: { revalidate: 120 } }
        );
        if (!res.ok) return [];

        const json = await res.json();
        return (json.data || [])
            .map((entry: any) => {
                const attrs = readAttrs(entry);
                const thumbSource = attrs.thumbnail?.data || attrs.thumbnail;
                const thumbAttrs = readAttrs(thumbSource);
                const thumbnailUrl =
                    thumbAttrs?.formats?.medium?.url ||
                    thumbAttrs?.formats?.small?.url ||
                    thumbAttrs?.formats?.thumbnail?.url ||
                    thumbAttrs?.url;

                return {
                    id: attrs.id || entry.id,
                    title: attrs.title || attrs.Title || "",
                    slug: attrs.slug || "",
                    thumbnail:
                        toAbsoluteUrl(thumbnailUrl) ||
                        `https://img.youtube.com/vi/${attrs.youtubeId}/mqdefault.jpg`,
                    date: formatContentDate(attrs.date || attrs.createdAt),
                };
            })
            .filter((video: any) => video.slug);
    } catch {
        return [];
    }
}

function getContentRoute(item: any) {
    const type = String(item.contentType || "").toLowerCase();
    if (type.includes("opinion")) return `/opinion/${item.slug}`;
    if (type.includes("news")) return `/news/${item.slug}`;
    if (type.includes("report")) return `/reports/${item.slug}`;
    return `/articles/${item.slug}`;
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [{ articles, tagName }, videos] = await Promise.all([
        fetchTagContent(slug),
        fetchTagVideos(slug),
    ]);

    return (
        <div className="min-h-screen bg-[#f5f7fa] text-zinc-900">
            <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 text-white py-20 md:py-24">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,166,81,0.3),transparent_40%),radial-gradient(circle_at_82%_0%,rgba(9,182,151,0.18),transparent_40%)]" />
                <div className="container relative z-10 mx-auto px-6 lg:px-16 max-w-[1400px]">
                    <div className="flex items-center gap-3 mb-4">
                        <Tag size={14} className="text-[#00A651]" />
                        <span className="text-[10px] font-black text-[#00A651] uppercase tracking-[0.2em]">Tag</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">{tagName}</h1>
                    <p className="text-zinc-400 mt-4 text-lg">
                        All content tagged with &ldquo;{tagName}&rdquo; - {articles.length + videos.length} items
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider">
                            {articles.length} Articles
                        </span>
                        <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider">
                            {videos.length} Videos
                        </span>
                    </div>
                </div>
            </section>

            {articles.length > 0 && (
                <section className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-16">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 pb-4 border-b border-zinc-200">
                        Articles & Content ({articles.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                        {articles.map((item: any) => (
                            <article
                                key={item.id}
                                className="group rounded-3xl border border-zinc-200/80 bg-white overflow-hidden shadow-[0_12px_34px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-300"
                            >
                                <Link href={getContentRoute(item)} className="block">
                                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-200">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                                        <div className="absolute top-4 right-4 rounded-full bg-white/90 p-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <ArrowUpRight className="w-4 h-4 text-zinc-900" />
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#00A651] mb-3">
                                            <DateChip value={item.date} className="text-[10px]" />
                                            {item.sector && (
                                                <>
                                                    <span className="text-zinc-300">-</span>
                                                    <span className="text-zinc-500">{item.sector}</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-serif font-bold leading-snug group-hover:text-[#00A651] transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-zinc-500 mt-3 line-clamp-3">{item.excerpt}</p>
                                    </div>
                                </Link>

                                {item.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 px-5 pb-5">
                                        {item.tags.slice(0, 3).map((tag: any) => (
                                            <TagBadge key={tag.slug} name={tag.name} slug={tag.slug} />
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {videos.length > 0 && (
                <section className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-16 border-t border-zinc-200">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8 pb-4 border-b border-zinc-200">
                        Videos ({videos.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                        {videos.map((video: any) => (
                            <article
                                key={video.id}
                                className="group rounded-3xl border border-zinc-200/80 bg-white overflow-hidden shadow-[0_12px_34px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-300"
                            >
                                <Link href={`/videos/${video.slug}`} className="block">
                                    <div className="relative aspect-video overflow-hidden bg-zinc-200">
                                        <Image
                                            src={video.thumbnail}
                                            alt={video.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                                <Play className="w-5 h-5 fill-red-600 text-red-600 ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-base font-bold group-hover:text-[#00A651] transition-colors line-clamp-2">{video.title}</h3>
                                        <DateChip value={video.date} className="text-[10px] mt-2" />
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {articles.length === 0 && videos.length === 0 && (
                <section className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-32 text-center">
                    <Tag size={48} className="text-zinc-200 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-zinc-300 mb-2">No Content Found</h2>
                    <p className="text-zinc-400">No content has been tagged with &ldquo;{tagName}&rdquo; yet.</p>
                </section>
            )}

            <div className="h-24" />
        </div>
    );
}
