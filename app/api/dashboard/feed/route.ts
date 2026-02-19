import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/queries";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN || "";

/** Slugify a community name → Strapi sector slug */
function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/**
 * GET /api/dashboard/feed
 *
 * Returns Strapi content filtered by the current user's communities (sectors).
 * Query params: page, pageSize, type (e.g. "Articles")
 */
export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await getUserProfile(userId);
        const communities = profile?.communities || [];
        // Deduplicate using a Set on trimmed names
        const communityNames = Array.from(new Set(communities.map((c) => c.community_name.trim())));

        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const pageSize = Number(searchParams.get("pageSize")) || 10;
        const contentType = searchParams.get("type");
        const earlyAccess = searchParams.get("earlyAccess");
        const singleSector = searchParams.get("sector"); // filter by one specific sector slug

        // Build sector slug filters using $or
        let sectorFilter = "";
        if (singleSector) {
            // Single sector filter (for tab-based pages)
            sectorFilter = `&filters[sectors][slug][$eq]=${encodeURIComponent(slugify(singleSector))}`;
        } else if (communityNames.length > 0) {
            const parts = communityNames.map((name, i) => {
                const slug = slugify(name);
                return `filters[$or][${i}][sectors][slug][$eq]=${encodeURIComponent(slug)}`;
            });
            sectorFilter = `&${parts.join("&")}`;
        }

        const typeFilter = contentType
            ? `&filters[type_of_content][name][$eq]=${encodeURIComponent(contentType)}`
            : "";

        const earlyAccessFilter = earlyAccess === "true"
            ? `&filters[earlyAccess][$eq]=true`
            : "";

        const url =
            `${STRAPI}/api/contents?` +
            `populate=*` +
            `&sort=Date:desc` +
            `&pagination[page]=${page}` +
            `&pagination[pageSize]=${pageSize}` +
            sectorFilter +
            typeFilter +
            earlyAccessFilter;


        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${TOKEN}` },
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            console.error(`Strapi error: ${res.status} ${res.statusText}`);
            return NextResponse.json({ error: "Strapi error" }, { status: 502 });
        }

        const json = await res.json();
        const items = json?.data || [];


        // Map Strapi v5 flat items to feed shape
        const feedItems = items.map((item: any) => {
            // Excerpt — rich text blocks
            let summary = "";
            if (Array.isArray(item.Excerpt)) {
                const para = item.Excerpt.find((b: any) => b.type === "paragraph");
                if (para?.children?.[0]?.text) summary = para.children[0].text;
            }

            // Featured image
            const img = item.FeaturedImage;
            const imageUrl = img?.url
                ? `${STRAPI}${img.url}`
                : img?.formats?.small?.url
                    ? `${STRAPI}${img.formats.small.url}`
                    : null;

            // Sectors — flat array
            const sectorNames = (item.sectors || []).map((s: any) => s.name);

            // Author — flat object
            const authorName = item.author?.name || item.Author || "Team ENERGDIVE";
            const authorAvatarRaw = item.author?.avatar?.url || item.author?.avatar?.data?.attributes?.url || null;
            const authorAvatar = authorAvatarRaw ? `${STRAPI}${authorAvatarRaw}` : null;

            // Content type
            const contentTypeName = item.type_of_content?.name || "Articles";

            return {
                id: String(item.id),
                title: item.Title || item.TITLE || "Untitled",
                slug: item.slug || "",
                summary: summary || "Read the full article for details.",
                category: sectorNames[0] || contentTypeName,
                allSectors: sectorNames,
                date: item.Date || item.publishedAt || "",
                author: authorName,
                authorAvatar,
                readTime: "5 min read",
                image: imageUrl,
                contentType: contentTypeName,
            };
        });

        return NextResponse.json({
            items: feedItems,
            pagination: json?.meta?.pagination || { page, pageSize, total: feedItems.length },
            sectors: communityNames,
            totalContent: json?.meta?.pagination?.total || 0,
        });
    } catch (error) {
        console.error("[DASHBOARD_FEED]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
