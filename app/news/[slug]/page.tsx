import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { SidebarSubscribe } from "@/components/sidebar-subscribe";
import { AdBanner } from "@/components/ads/AdBanner";
import { TagBadge } from "@/components/ui/tag-badge";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { DateChip } from "@/components/ui/date-chip";
import { ShareButton } from "@/components/ui/share-button";
import { getLatestIssue } from "@/lib/api/getLatestIssue";
import { ArrowRight, Calendar, ChevronRight, Printer } from "lucide-react";
import { formatContentDate } from "@/lib/date";
import ArticleBody from "@/components/ArticleBody";
import { fetchDataBlocks } from "@/lib/parse-content-blocks";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { ArticleReadTime } from "@/components/article/ArticleReadTime";
import { AuthorBioBox } from "@/components/article/AuthorBioBox";
import { ArticleNewsletterCTA } from "@/components/article/ArticleNewsletterCTA";
import { ArticleStickyShare } from "@/components/article/ArticleStickyShare";
import { SaveArticleButton } from "@/components/article/SaveArticleButton";
import { ArticlePremiumSpotlight } from "@/components/onboarding/article-premium-spotlight";
import { SidebarDiscoverySpotlight } from "@/components/onboarding/sidebar-discovery-spotlight";

const STRAPI_BASE_URL = "https://cms.energdive.com";

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
    const url = `${STRAPI_BASE_URL}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate[FeaturedImage]=true&populate[tags]=true&populate[type_of_content]=true&populate[sectors]=true`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
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

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
}
import type { Metadata } from "next";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getCanonicalUrl } from "@/lib/seo";

/* ================= METADATA (OG tags for WhatsApp / social) ================= */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const articleData = await getArticle(slug);

    if (!articleData) {
        return { title: { absolute: "News - ENERGDIVE" } };
    }

    const attrs = articleData.attributes || articleData;
    const baseTitle = attrs.Title || "News";
    const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/news/${slug}`);
    const excerptBlock = attrs.Excerpt;
    const description =
        (Array.isArray(excerptBlock)
            ? excerptBlock[0]?.children?.[0]?.text
            : null) || "Read the latest energy news on Energdive.";

    const imageUrl = attrs.FeaturedImage?.url
        ? strapiImageUrl(attrs.FeaturedImage.url)
        : getCanonicalUrl("/fav.jpg");

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
            siteName: "Energdive",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: shareTitle,
                },
            ],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description,
            images: [imageUrl],
        },
    };
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

    // Extract sector slug for targeted ad
    const sectorData = attrs.sectors || attrs.sector?.data?.attributes || null;
    const sectorSlug: string | undefined = Array.isArray(sectorData)
        ? sectorData[0]?.slug || undefined
        : sectorData?.slug || undefined;

    const authorRelation = attrs.author || attrs.Author;
    const author =
        authorRelation?.data?.attributes ||
        authorRelation?.data?.[0]?.attributes ||
        authorRelation?.attributes ||
        authorRelation?.[0] ||
        authorRelation ||
        null;
    const authorName = author?.name || author?.Name || null;
    const authorAvatarUrl =
        author?.avatar?.url ||
        author?.avatar?.data?.attributes?.url ||
        author?.Avatar?.url ||
        author?.Avatar?.data?.attributes?.url ||
        null;

    const latestIssue = await getLatestIssue();

    const articleContent = attrs.Content || [];
    const dataBlocks = await fetchDataBlocks(articleContent);

    const article = {
        title: attrs.Title,
        excerpt: attrs.Excerpt || [],
        content: articleContent,
        image: attrs.FeaturedImage?.url
            ? strapiImageUrl(attrs.FeaturedImage.url)
            : "/magazine-default.jpg",
        date: formatContentDate(attrs.Date || attrs.publishedAt || attrs.createdAt),
        author: authorName
            ? {
                name: authorName,
                avatar: authorAvatarUrl ? strapiImageUrl(authorAvatarUrl) : null,
            }
            : null,
        tags: normalizedTags,
        category:
            attrs.type_of_content?.name ||
            attrs.type_of_content?.data?.attributes?.name ||
            "News",
    };

    // Raw date for JSON-LD and display (prioritizing publishedAt for accurate automatic time)
    const rawDate = attrs.publishedAt || attrs.createdAt || attrs.Date || "";
    const modifiedDate = attrs.updatedAt || rawDate;
    const excerptText = Array.isArray(attrs.Excerpt)
        ? attrs.Excerpt[0]?.children?.[0]?.text || ""
        : "";
    const canonicalUrl = getCanonicalUrl(`/news/${slug}`);

    return (
        <div className="min-h-screen bg-white">
            <ArticleJsonLd
                title={article.title}
                datePublished={rawDate}
                dateModified={modifiedDate}
                authorName={article.author?.name}
                slug={slug}
                imageUrl={article.image}
                section="news"
                description={excerptText}
            />
            <ScrollProgress />
            <Header />

            <main className="pt-20 pb-24">
                <ArticleStickyShare title={article.title} url={canonicalUrl} />
                <ArticlePremiumSpotlight
                    loginHref={`/auth?redirect_url=${encodeURIComponent(canonicalUrl)}`}
                />

                {/* ─── Breadcrumb ─── */}
                <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-sans">
                        <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-gray-600 font-medium truncate max-w-[200px]">{article.category}</span>
                    </nav>
                </div>

                <div className="h-8 sm:h-10" />

                <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 max-w-7xl">

                    {/* ═══════════════ MAIN COLUMN ═══════════════ */}
                    <div className="lg:col-span-8">

                        {/* Category Label */}
                        <div className="flex items-center mb-5">
                            <span className="bg-[#00A651] text-white px-3 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider shadow-sm">
                                {article.category}
                            </span>
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    {article.author.avatar ? (
                                        <Image
                                            src={article.author.avatar}
                                            width={36}
                                            height={36}
                                            alt={article.author.name || ""}
                                            className="rounded-full object-cover w-9 h-9 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                                            {article.author.name?.charAt(0) || "A"}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <div className="text-gray-600 text-[14px]">
                                            By{" "}
                                            <Link
                                                href={`/author/${slugify(article.author.name)}`}
                                                className="font-bold text-gray-900 hover:text-[#00A651] transition-colors"
                                            >
                                                {article.author.name}
                                            </Link>
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2 text-gray-400 text-[13px] mt-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>
                                                    {(() => {
                                                        const d = new Date(rawDate);
                                                        if (Number.isNaN(d.getTime())) return article.date;
                                                        return new Intl.DateTimeFormat("en-GB", {
                                                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata"
                                                        }).format(d).replace(",", "") + " IST";
                                                    })()}
                                                </span>
                                            </div>
                                            <span className="text-gray-300 hidden sm:inline">|</span>
                                            <ArticleReadTime content={articleContent} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <Link
                                        href={`/print/${slug}`}
                                        target="_blank"
                                        className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm border border-gray-200 px-4 py-2 rounded-full bg-white hover:bg-gray-50 shadow-sm transition-colors"
                                        title="Print this article"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print
                                    </Link>
                                    <ShareButton
                                        title={article.title}
                                        text={excerptText}
                                        url={canonicalUrl}
                                        className="text-gray-600 hover:text-gray-900 font-medium text-sm border border-gray-200 px-4 py-2 rounded-full bg-white hover:bg-gray-50 shadow-sm"
                                        iconClassName="w-4 h-4"
                                    />
                                    <SaveArticleButton title={article.title} url={canonicalUrl} />
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

first:prose-p:first-letter:text-6xl first:prose-p:first-letter:font-serif first:prose-p:first-letter:font-bold first:prose-p:first-letter:float-left first:prose-p:first-letter:mr-3 first:prose-p:first-letter:mt-1 first:prose-p:first-letter:text-teal-700 last:prose-p:mb-0"
                            >
                                <ArticleBody content={article.content} enableSectionSharing={true} dataBlocks={dataBlocks} />
                            </div>
                        </article>

                        {/* Tags */}
                        {article.tags.length > 0 && (
                            <div className="mt-2 pt-5 border-t border-gray-100">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-4 font-bold">
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {article.tags.map((tag: any, i: number) => (
                                        <TagBadge
                                            key={`${tag.slug}-${i}`}
                                            name={tag.name}
                                            slug={tag.slug}
                                            className="bg-teal-50 text-teal-700 px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full border border-teal-100 hover:bg-teal-600 hover:text-white hover:border-teal-600"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Newsletter CTA */}
                        <ArticleNewsletterCTA />

                        {/* Author Bio Box */}
                        {article.author && (
                            <AuthorBioBox author={article.author} />
                        )}

                        {/* Industry Partner Ad */}
                        <AdBanner
                            placement="news_partner_end"
                            sectorSlug={sectorSlug}
                            variant="native"
                        />
                    </div>

                    {/* ═══════════════ SIDEBAR ═══════════════ */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 space-y-8">

                            {/* ── Subscribe CTA ── */}
                            <SidebarSubscribe />

                            {/* ── Sidebar Ad — 300×250 ── */}
                            <AdBanner
                                placement="new_sidebar"
                                sectorSlug={sectorSlug}
                                variant="card"
                            />

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

                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:gap-2 transition-all">
                                            Read Issue
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </Link>
                                </div>
                            )}

                            {/* ── Related Stories ── */}
                            {relatedArticles.length > 0 && (
                                <SidebarDiscoverySpotlight>
                                    <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                                        <h3 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            <span className="h-px flex-1 bg-gray-200" />
                                            Latest News
                                            <span className="h-px flex-1 bg-gray-200" />
                                        </h3>

                                        <div className="space-y-5">
                                            {relatedArticles.map((item: any) => {
                                                const r = item.attributes || item;
                                                const imgUrl = r.FeaturedImage?.url
                                                    ? strapiImageUrl(r.FeaturedImage.url)
                                                    : "/magazine-default.jpg";

                                                const itemDate = formatContentDate(r.Date || r.publishedAt || item.publishedAt);

                                                return (
                                                    <Link
                                                        key={item.id}
                                                        href={`/news/${r.slug}`}
                                                        className="group flex gap-4 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50"
                                                    >
                                                        <div className="relative w-24 h-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                            <Image
                                                                src={imgUrl}
                                                                alt=""
                                                                fill
                                                                className="object-contain bg-white p-0.5 transition-transform duration-500 group-hover:scale-[1.02]"
                                                            />
                                                        </div>

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
                                </SidebarDiscoverySpotlight>
                            )}

                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
