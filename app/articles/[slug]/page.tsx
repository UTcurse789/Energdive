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
import { getLatestIssue } from "@/lib/api/getLatestIssue";
import { ArrowRight, Calendar, ChevronRight, Printer } from "lucide-react";
import { formatContentDate } from "@/lib/date";
import ArticleBody from "@/components/ArticleBody";
import { fetchDataBlocks } from "@/lib/parse-content-blocks";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { AdBanner } from "@/components/ads/AdBanner";
import { ArticleReadTime } from "@/components/article/ArticleReadTime";
import { AuthorBioBox } from "@/components/article/AuthorBioBox";
import { ArticleNewsletterCTA } from "@/components/article/ArticleNewsletterCTA";
import { ArticleStickyShare } from "@/components/article/ArticleStickyShare";

const STRAPI = "https://cms.energdive.com";

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
    const url =
        `${STRAPI}/api/contents?` +
        `filters[slug][$eq]=${slug}` +
        `&populate[author][populate]=avatar` +
        `&populate[FeaturedImage]=true` +
        `&populate[tags]=true` +
        `&populate[type_of_content]=true` +
        `&populate[sectors]=true` +
        `&populate[content_tag]=true` +
        `&populate[issue]=true` +
        `&populate[industries]=true` +
        `&populate[Seo]=true`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    return json?.data?.[0] ?? null;
}

/* ================= FETCH RELATED ================= */

async function getRelated(slug: string) {
    const res = await fetch(
        `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Articles&filters[slug][$ne]=${slug}&pagination[limit]=4&populate=*&sort=publishedAt:desc`,
        { cache: "no-store" }
    );
    const json = await res.json();
    return json?.data || [];
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
    const { slug } = await (params as any);
    const articleData = await getArticle(slug);

    if (!articleData) {
        return { title: { absolute: "Articles - ENERGDIVE" } };
    }

    const baseTitle = articleData.Title || "Articles";
    const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/articles/${slug}`);
    const description =
        articleData.Excerpt?.[0]?.children?.[0]?.text ||
        "Read in-depth energy articles on Energdive.";

    const imageUrl = articleData.FeaturedImage?.url
        ? strapiImageUrl(articleData.FeaturedImage.url)
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

export default async function ArticlePage(props: any) {
    const params = await props.params;
    const slug = params.slug;

    const articleData = await getArticle(slug);
    if (!articleData) notFound();

    const related = await getRelated(slug);

    const latestIssue = await getLatestIssue();
    const sectorData = articleData.sectors || articleData.sector?.data?.attributes || null;
    const sectorSlug: string | undefined = Array.isArray(sectorData)
        ? sectorData[0]?.slug || undefined
        : sectorData?.slug || undefined;

    // Tags
    const tagsData =
        articleData.tags?.data ||
        articleData.tags ||
        articleData.attributes?.tags?.data ||
        articleData.attributes?.tags ||
        [];
    const tags = Array.isArray(tagsData)
        ? tagsData.map((t: any) => normalizeTag(t)).filter(Boolean)
        : [];

    // Fetch chart/table data for any shortcodes in the content
    const contentBlocks = articleData.Content || [];
    const dataBlocks = await fetchDataBlocks(contentBlocks);
    const authorRelation =
        articleData.author ||
        articleData.Author ||
        articleData.attributes?.author ||
        articleData.attributes?.Author;
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

    const article = {
        title: articleData.Title,
        excerpt: articleData.Excerpt?.[0]?.children?.[0]?.text || "",
        content: contentBlocks,
        image: articleData.FeaturedImage?.url
            ? strapiImageUrl(articleData.FeaturedImage.url)
            : "/magazine-default.jpg",
        date: formatContentDate(articleData.Date || articleData.publishedAt || articleData.createdAt),
        author: authorName
            ? {
                name: authorName,
                avatar: authorAvatarUrl ? strapiImageUrl(authorAvatarUrl) : null,
            }
            : null,
        category: articleData.type_of_content?.name || "Article",
    };

    // Raw date for JSON-LD (needs ISO-8601, not formatted display string)
    const rawDate = articleData.Date || articleData.publishedAt || articleData.createdAt || "";
    const modifiedDate = articleData.updatedAt || rawDate;

    return (
        <div className="min-h-screen bg-white">
            <ArticleJsonLd
                title={article.title}
                datePublished={rawDate}
                dateModified={modifiedDate}
                authorName={article.author?.name}
                slug={slug}
                imageUrl={article.image}
                section="articles"
                description={article.excerpt}
            />
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

                        {/* Category Label */}
                        <div className="flex items-center mb-5">
                            <span className="bg-[#00A651] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm shadow-sm">
                                {article.category}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl  sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.08] tracking-tight text-gray-900 mb-4 sm:mb-6">
                            {article.title}
                        </h1>

                        {/* Excerpt */}
                        <p className="text-base sm:text-xl text-gray-500 font-serif leading-relaxed mb-6 sm:mb-8 border-l-4 border-teal-500 pl-4 sm:pl-5">
                            {article.excerpt}
                        </p>

                        {/* Author row */}
                        {article.author && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-8 border-b border-gray-100">
                                <div className="flex items-center gap-4">
                                    {article.author.avatar ? (
                                        <Image
                                            src={article.author.avatar}
                                            width={48}
                                            height={48}
                                            alt={article.author.name || ""}
                                            className="rounded-full object-cover w-12 h-12"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg shrink-0">
                                            {article.author.name?.charAt(0) || "A"}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <Link
                                            href={`/author/${slugify(article.author.name)}`}
                                            className="font-bold text-gray-900 text-xl hover:text-[#00A651] transition-colors leading-tight"
                                        >
                                            {article.author.name}
                                        </Link>
                                        <div className="flex items-center flex-wrap gap-2 text-gray-400 text-sm mt-0.5">
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
                                            <ArticleReadTime content={article.content} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto ml-16 sm:ml-0">
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
                                        text={article.excerpt}
                                        url={`https://energdive.com/articles/${slug}`}
                                        className="text-gray-600 hover:text-gray-900 font-medium text-sm border border-gray-200 px-4 py-2 rounded-full bg-white hover:bg-gray-50 shadow-sm"
                                        iconClassName="w-4 h-4"
                                    />
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </div>

                        {/* Article Body */}
                        <article className="relative">
                            {/* Decorative side line */}
                            {/* <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-12" /> */}

                            <div className="prose prose-lg max-w-none font-serif text-[18px] leading-[1.95] text-gray-800
        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
        prose-h2:text-[32px] prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
        prose-h3:text-[26px] prose-h3:mt-10 prose-h3:mb-4
        prose-h4:text-[23px] prose-h4:mt-10 prose-h4:mb-4
        prose-p:mb-6 prose-p:text-[18px]
        prose-a:text-teal-600 prose-a:decoration-teal-300 hover:prose-a:text-teal-800
        prose-strong:text-gray-900
        prose-blockquote:border-l-teal-500 prose-blockquote:bg-teal-50/30 prose-blockquote:rounded-r-lg prose-blockquote:py-2
        prose-img:rounded-lg prose-img:shadow-md prose-img:my-16
        prose-figcaption:text-center prose-figcaption:text-[14px] prose-figcaption:text-gray-500 prose-figcaption:mt-3 prose-figcaption:italic prose-figcaption:font-sans
        prose-li:marker:text-teal-500
        first:prose-p:first-letter:text-6xl first:prose-p:first-letter:font-serif first:prose-p:first-letter:font-bold first:prose-p:first-letter:float-left first:prose-p:first-letter:mr-3 first:prose-p:first-letter:mt-1 first:prose-p:first-letter:text-teal-700"
                            >
                                <ArticleBody
                                    content={article.content}
                                    dataBlocks={dataBlocks}
                                    midContentAds={[
                                        {
                                            placement: "article_mid_1",
                                            afterParagraphFraction: 1 / 3,
                                            sectorSlug,
                                            variant: "banner",
                                        },
                                        {
                                            placement: "article_mid_2",
                                            afterParagraphFraction: 2 / 3,
                                            sectorSlug,
                                            variant: "banner",
                                        },
                                    ]}
                                />
                            </div>
                        </article>

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-gray-100">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-4 font-bold">
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag: any) => (
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

                        {/* Newsletter CTA */}
                        <ArticleNewsletterCTA />

                        {/* Author Bio Box */}
                        {article.author && (
                            <AuthorBioBox author={article.author} />
                        )}

                        <AdBanner
                            placement="article_partner_end"
                            sectorSlug={sectorSlug}
                            variant="native"
                        />
                    </div>

                    {/* ═══════════════ SIDEBAR ═══════════════ */}
                    <aside className="lg:col-span-4">
                        <div className="sticky top-24 space-y-8">

                            {/* ── Subscribe CTA ── */}
                            <SidebarSubscribe />

                            <AdBanner
                                placement="article_sidebar"
                                sectorSlug={sectorSlug}
                                variant="card"
                            />

                            {/* ── Latest Issue ── */}
                            {latestIssue && (
                                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                    <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#00A651] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-lg bg-gradient-to-b from-white to-zinc-50 border border-white/20">
                                            <Calendar className="h-3.5 w-3.5 text-teal-500" />
                                            Latest Issue
                                        </div>
                                    </h3>

                                    <Link href={`/issues/${latestIssue.slug}`} className="group block">
                                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-gray-100 shadow-md mb-4 transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-0.5">
                                            <Image
                                                src={latestIssue.coverImage}
                                                alt={latestIssue.title}
                                                fill
                                                className="object-contain bg-white p-1 transition-transform duration-700 group-hover:scale-[1.02]"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                            {related.length > 0 && (
                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        <span className="h-px flex-1 bg-gray-200" />
                                        Related Stories
                                        <span className="h-px flex-1 bg-gray-200" />
                                    </h3>

                                    <div className="space-y-5">
                                        {related.map((item: any, idx: number) => {
                                            const imgUrl = item.FeaturedImage?.url
                                                ? strapiImageUrl(item.FeaturedImage.url)
                                                : "/magazine-default.jpg";

                                            const itemDate = formatContentDate(item.Date || item.publishedAt || item.createdAt);

                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/articles/${item.slug}`}
                                                    className="group flex gap-4 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50"
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="relative w-24 h-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                        <Image
                                                            src={imgUrl}
                                                            alt=""
                                                            fill
                                                            className="object-cover bg-white p-0.5 transition-transform duration-500 group-hover:scale-[1.02]"
                                                        />
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 min-w-0">
                                                        {/* Category Tag */}
                                                        {item.category && (
                                                            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-teal-700 bg-teal-50 rounded-full mb-1.5 uppercase tracking-wide">
                                                                {item.category.name}
                                                            </span>
                                                        )}
                                                        <h4 className="font-serif font-bold text-sm leading-snug text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-1">
                                                            {item.Title}
                                                        </h4>
                                                        {itemDate && (
                                                            <DateChip value={itemDate} className="text-[8px]" />
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
