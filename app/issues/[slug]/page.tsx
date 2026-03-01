import { notFound } from "next/navigation";
import IssueDetailClient from "@/components/issue-detail-client";
import { Issue } from "@/types";
import { getRoutePrefix, extractContentTypeName } from "@/lib/content-routes";

const STRAPI_URL = "http://206.189.132.187:1337";

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
function getContentRoute(typeOfContent: any): string {
    const name = extractContentTypeName(typeOfContent);
    return getRoutePrefix(name);
}
async function getIssue(slug: string) {
    const parsed = parseSlug(slug);
    if (!parsed) return null;

    const { month, year } = parsed;

    // First fetch: list
    const res = await fetch(`${STRAPI_URL}/api/issues?populate[0]=CoverImage&populate[1]=contents&populate[2]=contents.type_of_content&populate[3]=contents.sectors&populate[4]=contents.author&populate[5]=contents.FeaturedImage`, {
        next: { revalidate: 120 },
    });

    if (!res.ok) return null;

    const json = await res.json();

    const item = json.data?.find((d: any) =>
        String(d.Month).toLowerCase() === month.toLowerCase() &&
        String(d.Year) === String(year)
    );

    if (!item) return null;

    // Second fetch: detail (USE ID, NOT documentId)
    const detailRes = await fetch(
        `${STRAPI_URL}/api/issues/${item.id}?populate[0]=CoverImage&populate[1]=contents&populate[2]=contents.type_of_content&populate[3]=contents.sectors&populate[4]=contents.author&populate[5]=contents.FeaturedImage`,
        { next: { revalidate: 120 } }
    );

    if (!detailRes.ok) return mapIssue(item, slug);

    const detail = await detailRes.json();

    return mapIssue(detail.data, slug);
}

function mapIssue(item: any, slug: string): Issue {
    const rawCover =
        item.CoverImage?.[0]?.url ??
        item.CoverImage?.url ??
        null;

    const coverImage = rawCover
        ? rawCover.startsWith("http") ? rawCover : STRAPI_URL + rawCover
        : "/Energdive-Logo.png";

    return {
        id: item.id,
        slug,
        title: `${item.Month} ${item.Year}`,
        description: item.Description ?? item.description ?? "",
        date: item.Date ?? item.publishedAt ?? item.createdAt ?? "",
        month: item.Month,
        year: String(item.Year),
        volume: item.Volume,
        Issue: item.IssueNumber,
        coverImage,
        sections: [
            {
                title: "Contents",
                articles: (item.contents ?? []).map((c: any) => {
                    const rawImage =
                        c.FeaturedImage?.[0]?.url ??
                        c.FeaturedImage?.url ??
                        c.featuredImage?.[0]?.url ??
                        c.featuredImage?.url ??
                        null;
                    const image = rawImage
                        ? rawImage.startsWith("http") ? rawImage : STRAPI_URL + rawImage
                        : null;

                    // Build correct route from type_of_content
                    const route = getContentRoute(c.type_of_content);
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
                    };
                }),
            },
        ],
    };
}

export async function generateStaticParams() {
    const res = await fetch(`${STRAPI_URL}/api/issues`, { next: { revalidate: 120 } });
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