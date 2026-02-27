import { NextResponse } from "next/server";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

function extractExcerpt(article: any): string {
    const excerpt = article.Excerpt || article.description;

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
        // Query both Title and Excerpt for matches, and only fetch Articles or Opinion
        const apiUrl = new URL(`${STRAPI_BASE}/api/contents`);

        // Filter by type: Articles or Opinion
        apiUrl.searchParams.append("filters[$or][0][type_of_content][name][$eq]", "Articles");
        apiUrl.searchParams.append("filters[$or][1][type_of_content][name][$eq]", "Opinion");
        apiUrl.searchParams.append("filters[$or][2][type_of_content][name][$eq]", "News");

        // Filter by text match in Title or Excerpt
        apiUrl.searchParams.append("filters[$and][0][$or][0][Title][$contains]", query);
        // Note: Filtering rich text blocks directly in Strapi REST API can be tricky depending on the setup. 
        // We will rely heavily on Title containing the query for backend filtering to be safe, 
        // but can try excerpt matching if Strapi supports it for this field.

        // Populate necessary fields
        apiUrl.searchParams.append("populate", "type_of_content");
        apiUrl.searchParams.append("pagination[limit]", "15"); // Limit to top 15 results for performance

        const response = await fetch(apiUrl.toString(), {
            headers: {
                "Content-Type": "application/json",
            },
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            console.error(`Strapi API error: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: "Failed to fetch from CMS" }, { status: 500 });
        }

        const data = await response.json();

        if (!data.data) {
            return NextResponse.json({ results: [] });
        }

        const fallbackType = "Article";

        const formattedResults = data.data.map((item: any) => {
            const rawType = item.type_of_content?.name || fallbackType;
            let displayType = rawType;
            // Standardize display type badge names
            if (rawType.toLowerCase() === "articles") displayType = "Article";
            if (rawType.toLowerCase() === "opinion") displayType = "Opinion";
            if (rawType.toLowerCase() === "news") displayType = "News";

            return {
                id: String(item.id),
                title: item.Title || "Untitled",
                slug: item.slug || "",
                type: displayType,
                excerpt: extractExcerpt(item),
                date: formatContentDate(item.Date || item.publishedAt || item.createdAt)
            };
        });

        return NextResponse.json({ results: formattedResults });

    } catch (error) {
        console.error("Global Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
