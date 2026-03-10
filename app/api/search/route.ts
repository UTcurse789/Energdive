import { NextResponse } from "next/server";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

function extractExcerpt(item: any): string {
    const excerpt = item.Excerpt || item.description || item.Description;

    if (typeof excerpt === "string") return excerpt;

    if (!excerpt || !Array.isArray(excerpt)) return "";

    return excerpt
        .map((block: any) =>
            (block.children || []).map((child: any) => child.text || "").join("")
        )
        .filter(Boolean)
        .join(" ")
        .trim();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        // ─── 1. Search ALL contents (articles, news, opinion, cover story, etc.) ───
        const contentsUrl = new URL(`${STRAPI_BASE}/api/contents`);
        // Search by Title (contains)
        contentsUrl.searchParams.append("filters[$or][0][Title][$containsi]", query);
        // Also search by slug (for keyword matches)
        contentsUrl.searchParams.append("filters[$or][1][slug][$containsi]", query);
        // Populate content type info
        contentsUrl.searchParams.append("populate", "type_of_content");
        contentsUrl.searchParams.append("pagination[limit]", "20");
        contentsUrl.searchParams.append("sort", "Date:desc");

        // ─── 2. Search videos ───
        const videosUrl = new URL(`${STRAPI_BASE}/api/videos`);
        videosUrl.searchParams.append("filters[$or][0][title][$containsi]", query);
        videosUrl.searchParams.append("filters[$or][1][slug][$containsi]", query);
        videosUrl.searchParams.append("pagination[limit]", "5");
        videosUrl.searchParams.append("sort", "createdAt:desc");

        // ─── 3. Search events ───
        const eventsUrl = new URL(`${STRAPI_BASE}/api/events`);
        eventsUrl.searchParams.append("filters[$or][0][title][$containsi]", query);
        eventsUrl.searchParams.append("filters[$or][1][slug][$containsi]", query);
        eventsUrl.searchParams.append("pagination[limit]", "5");
        eventsUrl.searchParams.append("sort", "createdAt:desc");

        // ─── 4. Search reports ───
        const reportsUrl = new URL(`${STRAPI_BASE}/api/reports`);
        reportsUrl.searchParams.append("filters[$or][0][Title][$containsi]", query);
        reportsUrl.searchParams.append("filters[$or][1][slug][$containsi]", query);
        reportsUrl.searchParams.append("pagination[limit]", "5");
        reportsUrl.searchParams.append("sort", "createdAt:desc");

        const [contentsRes, videosRes, eventsRes, reportsRes] = await Promise.all([
            fetch(contentsUrl.toString(), { next: { revalidate: 600 } }).catch(() => null),
            fetch(videosUrl.toString(), { next: { revalidate: 600 } }).catch(() => null),
            fetch(eventsUrl.toString(), { next: { revalidate: 600 } }).catch(() => null),
            fetch(reportsUrl.toString(), { next: { revalidate: 600 } }).catch(() => null),
        ]);

        const allResults: any[] = [];

        // ── Process contents ──
        if (contentsRes?.ok) {
            const data = await contentsRes.json();
            if (data.data) {
                for (const item of data.data) {
                    const rawType = item.type_of_content?.name || "Article";
                    // Normalize display type
                    let displayType = rawType;
                    if (rawType.toLowerCase() === "articles") displayType = "Article";

                    allResults.push({
                        id: `content-${item.id}`,
                        title: item.Title || "Untitled",
                        slug: item.slug || "",
                        type: displayType,
                        excerpt: extractExcerpt(item),
                        date: formatContentDate(item.Date || item.publishedAt || item.createdAt),
                    });
                }
            }
        }

        // ── Process videos ──
        if (videosRes?.ok) {
            const data = await videosRes.json();
            if (data.data) {
                for (const item of data.data) {
                    allResults.push({
                        id: `video-${item.id}`,
                        title: item.title || item.Title || "Untitled",
                        slug: item.slug || "",
                        type: "Video",
                        excerpt: extractExcerpt(item) || "",
                        date: formatContentDate(item.date || item.publishedAt || item.createdAt),
                    });
                }
            }
        }

        // ── Process events ──
        if (eventsRes?.ok) {
            const data = await eventsRes.json();
            if (data.data) {
                for (const item of data.data) {
                    allResults.push({
                        id: `event-${item.id}`,
                        title: item.title || item.Title || "Untitled",
                        slug: item.slug || "",
                        type: "Event",
                        excerpt: item.venue || item.location || extractExcerpt(item) || "",
                        date: formatContentDate(item.date || item.publishedAt || item.createdAt),
                    });
                }
            }
        }

        // ── Process reports ──
        if (reportsRes?.ok) {
            const data = await reportsRes.json();
            if (data.data) {
                for (const item of data.data) {
                    allResults.push({
                        id: `report-${item.id}`,
                        title: item.Title || item.title || "Untitled",
                        slug: item.slug || "",
                        type: "Report",
                        excerpt: extractExcerpt(item) || "",
                        date: formatContentDate(item.Date || item.publishedAt || item.createdAt),
                    });
                }
            }
        }

        return NextResponse.json({ results: allResults });

    } catch (error) {
        console.error("Global Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
