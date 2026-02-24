import Image from "next/image";
import Link from "next/link";
import { Clock, Tag } from "lucide-react";
import { TagBadge } from "@/components/ui/tag-badge";
import { slugify } from "@/lib/utils";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

function formatDate(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

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
                    date: formatDate(attrs.publishedAt || attrs.createdAt || attrs.date || attrs.Date),
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
                    date: formatDate(attrs.date || attrs.createdAt),
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
        <div className="min-h-screen bg-[#fafafa]">
            <section className="bg-zinc-950 text-white py-24 border-b border-zinc-800">
                <div className="container mx-auto px-6 lg:px-16 max-w-[1400px]">
                    <div className="flex items-center gap-3 mb-4">
                        <Tag size={14} className="text-[#00A651]" />
                        <span className="text-[10px] font-black text-[#00A651] uppercase tracking-[0.2em]">Tag</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">{tagName}</h1>
                    <p className="text-zinc-400 mt-4 text-lg">
                        All content tagged with &ldquo;{tagName}&rdquo; - {articles.length + videos.length} items
                    </p>
                </div>
            </section>

            {articles.length > 0 && (
                <section className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-16">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8 pb-4 border-b">
                        Articles & Content ({articles.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {articles.map((item: any) => (
                            <article key={item.id} className="group">
                                <Link href={getContentRoute(item)} className="block">
                                    <div className="relative aspect-16/10 overflow-hidden rounded-xl mb-4 bg-zinc-200">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#00A651] mb-2">
                                        <Clock size={10} />
                                        <span>{item.date}</span>
                                        {item.sector && (
                                            <>
                                                <span className="text-zinc-300">-</span>
                                                <span className="text-zinc-400">{item.sector}</span>
                                            </>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold leading-snug group-hover:text-[#00A651] transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{item.excerpt}</p>
                                </Link>

                                {item.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
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
                <section className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-16 border-t border-zinc-100">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8 pb-4 border-b">
                        Videos ({videos.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {videos.map((video: any) => (
                            <Link key={video.id} href={`/videos/${video.slug}`} className="group block">
                                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-zinc-200">
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-1">
                                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-red-600 border-b-[6px] border-b-transparent"></div>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold group-hover:text-[#00A651] transition-colors line-clamp-2">{video.title}</h3>
                                <span className="text-[10px] text-zinc-400 mt-1 block">{video.date}</span>
                            </Link>
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

