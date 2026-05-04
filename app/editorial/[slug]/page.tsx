import { notFound, redirect } from "next/navigation";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { getOpinionContentKind } from "@/lib/content-tags";
import { getCanonicalUrl } from "@/lib/seo";
import OpinionContent from "@/app/opinion/[slug]/opinion-content";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

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

function extractTypeName(typeOfContent: any): string | null {
    if (!typeOfContent) return null;
    if (Array.isArray(typeOfContent)) {
        return typeOfContent[0]?.name ?? typeOfContent[0]?.Name ?? null;
    }
    return typeOfContent?.name ?? typeOfContent?.Name ?? typeOfContent?.data?.attributes?.name ?? null;
}

function isEditorialArticle(item: any): boolean {
    const kind = getOpinionContentKind(item);
    if (kind === "editorial") return true;

    const attrs = item?.attributes || item;
    return extractTypeName(attrs?.type_of_content)?.toLowerCase() === "editorial";
}

async function getArticle(slug: string) {
    const url = `${STRAPI_BASE_URL}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate[FeaturedImage]=true&populate[tags]=true&populate[type_of_content]=true&populate[sectors]=true&populate[content_tag]=true&populate[issue]=true&populate[industries]=true&populate[Seo]=true`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0] || null;
}

async function getRelated(currentSlug: string) {
    const res = await fetch(
        `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=Opinion&filters[content_tag][title][$eq]=Editorial&filters[slug][$ne]=${currentSlug}&pagination[limit]=4&populate=*&sort=publishedAt:desc`,
        { cache: "no-store" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
}
import type { Metadata } from "next";
import { strapiImageUrl } from "@/lib/strapi-image";

/* ================= METADATA (OG tags for WhatsApp / social) ================= */

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const articleData = await getArticle(slug);

    if (!articleData) {
        return { title: { absolute: "Editorial - ENERGDIVE" } };
    }

    const opinionKind = getOpinionContentKind(articleData);
    const interviewContent = opinionKind === "interview";
    const editorialContent = isEditorialArticle(articleData);
    const attrs = articleData.attributes || articleData;
    const baseTitle =
        attrs.Title ||
        (interviewContent ? "Interview" : editorialContent ? "Editorial" : "Opinion");
    const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(
        interviewContent
            ? `/interviews/${slug}`
            : editorialContent
                ? `/editorial/${slug}`
                : `/opinion/${slug}`
    );
    const excerptBlock = attrs.Excerpt;
    const description =
        (Array.isArray(excerptBlock)
            ? excerptBlock[0]?.children?.[0]?.text
            : null) || (
                interviewContent
                    ? "Read exclusive interviews with energy leaders at Energdive."
                    : editorialContent
                        ? "Read ENERGDIVE editorials on energy policy, markets, and leadership."
                        : "Read expert opinions on energy policy and markets at Energdive."
            );

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

export default async function EditorialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const articleData = await getArticle(slug);
    if (!articleData) notFound();

    const opinionKind = getOpinionContentKind(articleData);
    if (opinionKind === "interview") {
        redirect(`/interviews/${slug}`);
    }
    if (!isEditorialArticle(articleData)) {
        redirect(`/opinion/${slug}`);
    }

    const attrs = articleData.attributes || articleData;
    const tagsData = attrs.tags?.data || attrs.tags || [];
    const normalizedTags = Array.isArray(tagsData) ? tagsData.map((t: any) => normalizeTag(t)).filter(Boolean) : [];
    const relatedArticles = await getRelated(slug);
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
    const sectorData = attrs.sectors || attrs.sector?.data?.attributes || null;
    const sectorSlug: string | undefined = Array.isArray(sectorData)
        ? sectorData[0]?.slug || undefined
        : sectorData?.slug || undefined;

    const excerptText = Array.isArray(attrs.Excerpt)
        ? attrs.Excerpt[0]?.children?.[0]?.text || ""
        : "";

    const article = {
        id: articleData.id,
        slug,
        title: attrs.Title,
        excerpt: excerptText,
        content: attrs.Content || [],
        category: "Editorial",
        readTime: "6 min read",
        tags: normalizedTags,
        sectorSlug,
        sectionPath: "/editorial",
        backLabel: "Back to Editorials",
        footerTitle: "More Editorial & Analysis.",
        footerLinkLabel: "Explore All",
        featuredImage: attrs.FeaturedImage?.url ? strapiImageUrl(attrs.FeaturedImage.url) : "/magazine-default.jpg",
        author: {
            name: authorName || "Editorial Staff",
            role: author?.designation || author?.Designation || "Senior Analyst",
            avatar: authorAvatarUrl ? strapiImageUrl(authorAvatarUrl) : "/placeholder.jpg",
        },
    };

    const recommended = relatedArticles.map((item: any) => {
        const related = item.attributes || item;
        return {
            id: item.id,
            slug: related.slug,
            title: related.Title,
            category: "Editorial",
            featuredImage: related?.FeaturedImage?.url ? strapiImageUrl(related.FeaturedImage.url) : "/placeholder.jpg",
            author: { name: related?.author?.name || "Editorial Staff" },
        };
    });

    // Raw date for JSON-LD (needs ISO-8601, not formatted display string)
    const rawDate = attrs.Date || attrs.publishedAt || attrs.createdAt || "";
    const modifiedDate = attrs.updatedAt || rawDate;

    return (
        <>
            <ArticleJsonLd
                title={article.title}
                datePublished={rawDate}
                dateModified={modifiedDate}
                authorName={article.author?.name}
                slug={slug}
                imageUrl={article.featuredImage}
                section="editorial"
                description={excerptText}
            />
            <OpinionContent opinion={article} recommended={recommended} />
        </>
    );
}
