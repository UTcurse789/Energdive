import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { SidebarSubscribe } from "@/components/sidebar-subscribe";
import { TagBadge } from "@/components/ui/tag-badge";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { DateChip } from "@/components/ui/date-chip";
import { ShareButton } from "@/components/ui/share-button";
import { ISSUES } from "@/data/dummy";
import { ArrowRight, Calendar, ChevronRight } from "lucide-react";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE_URL = "http://206.189.132.187:1337";

function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeTag(tag: any) {
    const source = tag?.attributes || tag;
    const name = source?.name || "";
    const slug = source?.slug || (name ? slugify(name) : "");
    if (!name) return null;
    return { name, slug };
}

/* ================= FETCH ARTICLE ================= */

async function getArticle(slug: string) {
    const url = `${STRAPI_BASE_URL}/api/contents?filters[slug][$eq]=${slug}&populate=*`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.[0] || null;
}

/* ================= FETCH RELATED ================= */

async function getRelated(tags: string[], currentSlug: string) {
    if (!tags.length) {
        // Fallback: fetch latest news excluding current
        const res = await fetch(
            `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=News&filters[slug][$ne]=${currentSlug}&pagination[limit]=4&populate=*&sort=publishedAt:desc`,
            { cache: "no-store" }
        );
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    }

    const tagFilters = tags
        .map((tag, i) => `filters[tags][slug][$in][${i}]=${tag}`)
        .join("&");

    const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=News&${tagFilters}&filters[slug][$ne]=${currentSlug}&populate=*&pagination[limit]=4`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
}

/* ================= PAGE ================= */

export default async function NewsDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const articleData = await getArticle(slug);
    if (!articleData) notFound();

    const attrs = articleData.attributes || articleData;

    const tagsData = attrs.tags?.data || attrs.tags || [];
    const normalizedTags = Array.isArray(tagsData)
        ? tagsData.map((t: any) => normalizeTag(t)).filter(Boolean)
        : [];
    const tagSlugs = normalizedTags
        .map((t: any) => t.slug)
        .filter(Boolean);

    const relatedArticles = await getRelated(tagSlugs, slug);

    const author = attrs.author?.data?.attributes || attrs.author;

    // Get latest issue from dummy data
    const latestIssue = ISSUES[0];

    const article = {
        title: attrs.Title,
        excerpt: attrs.Excerpt || [],
        content: attrs.Content || [],
        image: attrs.FeaturedImage?.url
            ? `${STRAPI_BASE_URL}${attrs.FeaturedImage.url}`
            : "/magazine-default.jpg",
        date: formatContentDate(attrs.Date || attrs.publishedAt || attrs.createdAt),
        author: author
            ? {
                name: author.name,
                avatar: author.avatar?.url
                    ? `${STRAPI_BASE_URL}${author.avatar.url}`
                    : author.avatar?.data?.attributes?.url
                        ? `${STRAPI_BASE_URL}${author.avatar.data.attributes.url}`
                        : null,
            }
            : null,
        tags: normalizedTags,
        category:
            attrs.type_of_content?.name ||
            attrs.type_of_content?.data?.attributes?.name ||
            "News",
    };

    return (
        <div className="min-h-screen bg-white">
            <ScrollProgress />
            <Header />

            <main className="pt-20 pb-24">
                {/* ─── Breadcrumb ─── */}
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 mb-6 sm:mb-8">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-sans">
                        <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-gray-600 font-medium truncate max-w-[200px]">{article.category}</span>
                    </nav>
                </div>

                <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 max-w-7xl">

                    {/* ═══════════════ MAIN COLUMN ═══════════════ */}
                    <div className="lg:col-span-8">

                        {/* Category + Date + Share */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <span className="inline-block bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                    {article.category}
                                </span>
                                <DateChip value={article.date} />
                            </div>
                            <ShareButton
                                title={article.title}
                                text={article.excerpt.length ? article.excerpt[0]?.children?.[0]?.text : "Check out this news"}
                                className="text-gray-500 hover:text-teal-600 font-medium text-sm border border-gray-200 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 shadow-sm"
                            />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.08] tracking-tight text-gray-900 mb-4 sm:mb-6">
                            {article.title}
                        </h1>

                        {/* Excerpt */}
                        <div className="text-base sm:text-xl text-gray-500 font-serif leading-relaxed mb-6 sm:mb-8 border-l-4 border-teal-500 pl-4 sm:pl-5">
                            <BlocksRenderer content={article.excerpt} />
                        </div>

                        {/* Author row */}
                        {article.author && (
                            <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-100">
                                {article.author.avatar ? (
                                    <Image
                                        src={article.author.avatar}
                                        width={52}
                                        height={52}
                                        alt={article.author.name || ""}
                                        className="rounded-full ring-2 ring-teal-100"
                                    />
                                ) : (
                                    <div className="w-[52px] h-[52px] rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                                        {article.author.name?.charAt(0) || "A"}
                                    </div>
                                )}
                                <div>
                                    <Link
                                        href={`/author/${slugify(article.author.name)}`}
                                        className="font-bold text-gray-900 hover:text-teal-600 transition-colors"
                                    >
                                        {article.author.name}
                                    </Link>
                                    <DateChip value={article.date} className="mt-0.5" />
                                </div>
                            </div>
                        )}

                        {/* Featured Image */}
                        <div className="relative aspect-video mb-12 rounded-xl overflow-hidden shadow-lg shadow-black/10 group">
                            <Image
                                src={article.image}
                                alt={article.title || ""}
                                fill
                                priority
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                        </div>

                        {/* Article Body */}
                        <article className="relative">
                            {/* Decorative side line */}
                            {/* <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12" /> */}

                            <div className="prose prose-lg max-w-none font-serif text-[18px] leading-[1.95] text-gray-800
                                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
                                prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-3
                                prose-p:mb-6
                                prose-a:text-teal-600 prose-a:decoration-teal-300 hover:prose-a:text-teal-800
                                prose-strong:text-gray-900
                                prose-blockquote:border-l-teal-500 prose-blockquote:bg-teal-50/30 prose-blockquote:rounded-r-lg prose-blockquote:py-2
                                prose-img:rounded-lg prose-img:shadow-md
                                prose-li:marker:text-teal-500
                                first:prose-p:first-letter:text-6xl first:prose-p:first-letter:font-serif first:prose-p:first-letter:font-bold first:prose-p:first-letter:float-left first:prose-p:first-letter:mr-3 first:prose-p:first-letter:mt-1 first:prose-p:first-letter:text-teal-700"
                            >
                                <BlocksRenderer content={article.content} />
                            </div>
                        </article>

                        {/* Tags */}
                        {article.tags.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-gray-100">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-4 font-bold">
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {article.tags.map((tag: any) => (
                                        <TagBadge
                                            key={tag.slug}
                                            name={tag.name}
                                            slug={tag.slug}
                                            className="bg-teal-50 text-teal-700 px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full border border-teal-100 hover:bg-teal-600 hover:text-white hover:border-teal-600"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══════════════ SIDEBAR ═══════════════ */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 space-y-8">

                            {/* ── Subscribe CTA ── */}
                            <SidebarSubscribe />

                            {/* ── Latest Issue ── */}
                            {latestIssue && (
                                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#00A651] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-lg bg-linear-to-b from-white to-zinc-50 border border-white/20">
                                        <Calendar className="h-3.5 w-3.5 text-teal-500" />
                                        Latest Issue
                                    </div>

                                    <Link href={`/issues/${latestIssue.slug}`} className="group block">
                                        <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border border-gray-100 shadow-md mb-4 transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-0.5">
                                            <Image
                                                src={latestIssue.coverImage}
                                                alt={latestIssue.title}
                                                fill
                                                className="object-contain bg-white p-1 transition-transform duration-700 group-hover:scale-[1.02]"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        <h4 className="font-serif font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">
                                            {latestIssue.month} {latestIssue.year}
                                        </h4>

                                        {latestIssue.volume && (
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                                                Vol. {latestIssue.volume}, No. {latestIssue.number}
                                            </p>
                                        )}

                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:gap-2 transition-all">
                                            Read Issue
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </Link>
                                </div>
                            )}

                            {/* ── Related Stories ── */}
                            {relatedArticles.length > 0 && (
                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        <span className="h-px flex-1 bg-gray-200" />
                                        Related Stories
                                        <span className="h-px flex-1 bg-gray-200" />
                                    </h3>

                                    <div className="space-y-5">
                                        {relatedArticles.map((item: any) => {
                                            const r = item.attributes || item;
                                            const imgUrl = r.FeaturedImage?.url
                                                ? `${STRAPI_BASE_URL}${r.FeaturedImage.url}`
                                                : "/magazine-default.jpg";

                                            const itemDate = formatContentDate(r.publishedAt || item.publishedAt);

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/news/${r.slug}`}
                                                    className="group flex gap-4 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50"
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="relative w-24 h-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                        <Image
                                                            src={imgUrl}
                                                            alt=""
                                                            fill
                                                            className="object-contain bg-white p-0.5 transition-transform duration-500 group-hover:scale-[1.02]"
                                                        />
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-serif font-bold text-sm leading-snug text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-1">
                                                            {r.Title}
                                                        </h4>
                                                        {itemDate && (
                                                            <DateChip value={itemDate} className="text-[10px]" />
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
