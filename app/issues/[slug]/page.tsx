import { notFound } from "next/navigation";
import type { Metadata } from "next";
import IssueDetailClient from "@/components/issue-detail-client";
import { Issue, Section } from "@/types";
import { getRoutePrefix, extractContentTypeName } from "@/lib/content-routes";
import { getCanonicalUrl } from "@/lib/seo";
import { strapiImageUrl, strapiMediaUrl } from "@/lib/strapi-image";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

/* ── 12 ordered content sections ── */
// altTypeMatch: when content_tag is unavailable, also try matching type_of_content by this value
const SECTION_ORDER = [
    { label: "Editorial", matchField: "content_tag", matchValue: "Editorial", fallbackTypeMatch: "editorial", altTypeMatch: "editorial" },
    { label: "Cover Story", matchField: "type_of_content", matchValue: "Cover Story", fallbackTypeMatch: "cover story", altTypeMatch: null },
    { label: "Featured Stories", matchField: "content_tag", matchValue: "Featured Stories", fallbackTypeMatch: "featured stories", altTypeMatch: "featured stories" },
    { label: "Interview", matchField: "content_tag", matchValue: "Interview", fallbackTypeMatch: "interview", altTypeMatch: "interview" },
    { label: "Opinion", matchField: "type_of_content", matchValue: "Opinion", fallbackTypeMatch: "opinion", altTypeMatch: null },
    { label: "Industry Outlook", matchField: "content_tag", matchValue: "Industry Outlook", fallbackTypeMatch: "industry outlook", altTypeMatch: "industry outlook" },
    { label: "Case Study", matchField: "type_of_content", matchValue: "Case Study", fallbackTypeMatch: "case study", altTypeMatch: null },
    { label: "Technical Paper", matchField: "content_tag", matchValue: "Technical Paper", fallbackTypeMatch: "technical paper", altTypeMatch: "technical paper" },
    { label: "Curtain Raiser", matchField: "content_tag", matchValue: "Curtain Raiser", fallbackTypeMatch: "curtain raiser", altTypeMatch: "curtain raiser" },
    { label: "Event Intelligence", matchField: "content_tag", matchValue: "Event Intelligence", fallbackTypeMatch: "event intelligence", altTypeMatch: "event intelligence" },
    { label: "Dashboard", matchField: "content_tag", matchValue: "Dashboard", fallbackTypeMatch: "dashboard", altTypeMatch: "dashboard" },
    { label: "The Preview Brief", matchField: "content_tag", matchValue: "The Preview Brief", fallbackTypeMatch: "The Preview Brief", altTypeMatch: "The Preview Brief" },
];

function classifyContent(c: any): string | null {
    const tagTitle = extractContentTagTitle(c.content_tag);
    const typeName = extractTypeOfContentName(c.type_of_content);

    // 1. content_tag match — checks ALL sections (highest priority)
    if (tagTitle) {
        const lowerTag = tagTitle.toLowerCase();
        for (const section of SECTION_ORDER) {
            if (lowerTag === section.matchValue.toLowerCase()) {
                return section.label;
            }
        }
    }

    // 2. altTypeMatch — lets Interview/Editorial be identified by type_of_content
    //    These are listed BEFORE Opinion in SECTION_ORDER, so they win first.
    if (typeName) {
        const lowerType = typeName.toLowerCase();
        for (const section of SECTION_ORDER) {
            if (section.altTypeMatch && lowerType === section.altTypeMatch.toLowerCase()) {
                return section.label;
            }
        }
    }

    // 3. Exact type_of_content match for sections whose primary matchField is type_of_content
    if (typeName) {
        const lowerType = typeName.toLowerCase();
        for (const section of SECTION_ORDER) {
            if (section.matchField === "type_of_content" && lowerType === section.matchValue.toLowerCase()) {
                return section.label;
            }
        }
    }

    // 4. Robust fallback — fallbackTypeMatch scan in order
    if (typeName) {
        const lowerType = typeName.toLowerCase();
        for (const section of SECTION_ORDER) {
            if (section.fallbackTypeMatch === lowerType) {
                return section.label;
            }
        }
    }

    return null;
}

function extractText(blocks: any[]) {
    if (!blocks) return "";
    return blocks
        .map((b) => b.children?.map((c: any) => c.text).join("") || "")
        .join(" ");
}

function parseSlug(slug: string): { month: string; year: number } | null {
    const parts = slug.split("-");
    if (parts.length < 2) return null;
    const yearStr = parts[parts.length - 1];
    const year = parseInt(yearStr, 10);
    if (isNaN(year) || !/^\d{4}$/.test(yearStr)) return null;
    const monthRaw = parts.slice(0, parts.length - 1).join("-");
    const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1).toLowerCase();
    return { month, year };
}

/** Map type_of_content name → URL prefix */
function getContentRoute(typeOfContent: any, contentTag?: any): string {
    const name = extractContentTypeName(typeOfContent);
    return getRoutePrefix(name, contentTag);
}

/** Extract content_tag title from various Strapi shapes */
function extractContentTagTitle(contentTag: any): string | null {
    if (!contentTag) return null;
    if (Array.isArray(contentTag)) {
        return contentTag[0]?.title ?? contentTag[0]?.Title ?? null;
    }
    return contentTag.title ?? contentTag.Title ?? contentTag.data?.attributes?.title ?? null;
}

/** Extract type_of_content name from various Strapi shapes */
function extractTypeOfContentName(typeOfContent: any): string | null {
    if (!typeOfContent) return null;
    if (Array.isArray(typeOfContent)) {
        return typeOfContent[0]?.name ?? typeOfContent[0]?.Name ?? null;
    }
    return typeOfContent.name ?? typeOfContent.Name ?? typeOfContent.data?.attributes?.name ?? null;
}

const BASE_POPULATE_PARAMS = [
    "populate[0]=CoverImage",
    "populate[1]=contents",
    "populate[2]=contents.type_of_content",
    "populate[3]=contents.sectors",
    "populate[4]=contents.author",
    "populate[5]=contents.FeaturedImage",
    "populate[6]=contents.content_tag",
].join("&");

const PDF_POPULATE_PARAM = "populate[7]=issue_Epdf";

function getPopulateParams(includeIssuePdf = true) {
    return includeIssuePdf
        ? `${BASE_POPULATE_PARAMS}&${PDF_POPULATE_PARAM}`
        : BASE_POPULATE_PARAMS;
}

async function fetchIssuesWithFallback(includeIssuePdf = true): Promise<Response> {
    const res = await fetch(`${STRAPI_URL}/api/issues?${getPopulateParams(includeIssuePdf)}`, {
        next: { revalidate: 120 },
    });

    if (!res.ok && includeIssuePdf && res.status === 400) {
        return fetchIssuesWithFallback(false);
    }

    return res;
}

async function fetchIssueDetailWithFallback(id: number | string, includeIssuePdf = true): Promise<Response> {
    const res = await fetch(
        `${STRAPI_URL}/api/issues/${id}?${getPopulateParams(includeIssuePdf)}`,
        { next: { revalidate: 3600 } }
    );

    if (!res.ok && includeIssuePdf && res.status === 400) {
        return fetchIssueDetailWithFallback(id, false);
    }

    return res;
}

async function getIssue(slug: string) {
    const parsed = parseSlug(slug);
    if (!parsed) return null;

    const { month, year } = parsed;

    // First fetch: list
    const res = await fetchIssuesWithFallback();

    if (!res.ok) return null;

    const json = await res.json();

    const item = json.data?.find((d: any) =>
        String(d.Month).toLowerCase() === month.toLowerCase() &&
        String(d.Year) === String(year)
    );

    if (!item) return null;

    // Second fetch: detail (USE ID, NOT documentId)
    const detailRes = await fetchIssueDetailWithFallback(item.id);

    if (!detailRes.ok) return mapIssue(item, slug);

    const detail = await detailRes.json();

    return mapIssue(detail.data, slug);
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const issue = await getIssue(slug);

    if (!issue) {
        return {
            title: { absolute: "Issue - ENERGDIVE" },
            description: "Explore ENERGDIVE magazine issues and editions.",
        };
    }

    const cleanIssueTitle = String(issue.title).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanIssueTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/issues/${slug}`);
    const description =
        issue.description?.trim() ||
        `Explore ${issue.title} featuring expert insights on India's energy transition.`;
    const imageUrl = issue.coverImage?.startsWith("http")
        ? issue.coverImage
        : getCanonicalUrl(issue.coverImage || "/fav.jpg");

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




function mapArticle(c: any) {
    const rawImage =
        c.FeaturedImage?.[0]?.url ??
        c.FeaturedImage?.url ??
        c.featuredImage?.[0]?.url ??
        c.featuredImage?.url ??
        null;
    const image = rawImage ? strapiImageUrl(rawImage) : null;

    // Build correct route from type_of_content
    const route = getContentRoute(c.type_of_content, c.content_tag);
    const articleSlug = c.slug ?? c.documentId ?? String(c.id);

    // Extract sectors
    const sectors: string[] = (c.sectors ?? []).map(
        (s: any) => s.Name ?? s.name ?? s.Title ?? s.title ?? ""
    ).filter(Boolean);

    // Extract tags
    const tags: string[] = (c.tags ?? []).map(
        (t: any) => t.Name ?? t.name ?? t.Title ?? t.title ?? ""
    ).filter(Boolean);

    // Extract type label
    const contentType =
        c.type_of_content?.[0]?.Name ??
        c.type_of_content?.[0]?.name ??
        c.type_of_content?.Name ??
        c.type_of_content?.name ??
        null;

    // Extract content_tag label
    const contentTag = extractContentTagTitle(c.content_tag);

    // Extract author
    const authorName =
        c.Author?.Name ??
        c.Author?.name ??
        c.author?.Name ??
        c.author?.name ??
        null;

    return {
        id: c.id,
        slug: articleSlug,
        href: `/${route}/${articleSlug}`,
        title: c.Title ?? c.title ?? "Untitled",
        excerpt: extractText(c.Excerpt ?? c.excerpt ?? []),
        author: authorName ? { name: authorName } : null,
        image,
        sectors,
        tags,
        contentType,
        contentTag,
    };
}

function mapIssue(item: any, slug: string): Issue {
    const coverImage = strapiMediaUrl(item.CoverImage, "/Energdive-Logo.png");
    const pdfUrl = strapiMediaUrl(item.issue_Epdf, "");
    const pdfSource = Array.isArray(item.issue_Epdf) ? item.issue_Epdf[0] : item.issue_Epdf;
    const pdfData = pdfSource?.data ?? pdfSource;
    const pdfAttrs = pdfData?.attributes ?? pdfData;

    // Group articles into 12 ordered sections
    const sectionBuckets: Record<string, any[]> = {};
    for (const sec of SECTION_ORDER) {
        sectionBuckets[sec.label] = [];
    }
    const uncategorized: any[] = [];

    for (const c of item.contents ?? []) {
        const sectionLabel = classifyContent(c);
        if (sectionLabel && sectionBuckets[sectionLabel]) {
            sectionBuckets[sectionLabel].push(mapArticle(c));
        } else {
            uncategorized.push(mapArticle(c));
        }
    }

    // Build sections in order, skip empty
    const sections: Section[] = [];
    for (const sec of SECTION_ORDER) {
        if (sectionBuckets[sec.label].length > 0) {
            sections.push({
                title: sec.label,
                articles: sectionBuckets[sec.label],
            });
        }
    }

    // Add fallback for uncategorized
    if (uncategorized.length > 0) {
        sections.push({
            title: "Policy Updates",
            articles: uncategorized,
        });
    }

    return {
        id: item.id,
        slug,
        title: `${item.Month} ${item.Year}`,
        subTitle: item.sub_title ?? item.Sub_Title ?? item.subTitle ?? "",
        description: item.Discription ?? item.Description ?? item.description ?? "",
        date: item.Date ?? item.publishedAt ?? item.createdAt ?? "",
        month: item.Month,
        year: String(item.Year),
        volume: item.Volume,
        Issue: item.IssueNumber,
        coverImage,
        pdfUrl: pdfUrl || undefined,
        pdfName: pdfAttrs?.name || undefined,
        sections,
    };
}

export async function generateStaticParams() {
    const res = await fetch(`${STRAPI_URL}/api/issues`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((item: any) => ({
        slug: `${String(item.Month).toLowerCase()}-${item.Year}`,
    }));
}

export default async function IssueDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const issue = await getIssue(slug);
    if (!issue) notFound();
    return <IssueDetailClient issue={issue} />;
}
