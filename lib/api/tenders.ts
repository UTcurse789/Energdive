const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

/**
 * Normalizes attributes from Strapi response
 */
export function normalizeTenderAttrs(item: any) {
    if (!item) return null;
    return item.attributes || item;
}

/**
 * Fetch a paginated list of tenders
 */
export async function getAllTenders(page = 1, pageSize = 30) {
    try {
        const query = new URLSearchParams({
            "pagination[page]": String(page),
            "pagination[pageSize]": String(pageSize),
            "sort[0]": "publishedAt:desc",
            "populate": "*",
        });

        const res = await fetch(`${STRAPI_BASE_URL}/api/tenders?${query.toString()}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) return { data: [], meta: null };
        const json = await res.json();
        return { data: json?.data || [], meta: json?.meta || null };
    } catch (e) {
        console.error("Error fetching tenders:", e);
        return { data: [], meta: null };
    }
}

/**
 * Fetch a single tender by slug
 */
export async function getTenderBySlug(slug: string) {
    try {
        const query = new URLSearchParams({
            "filters[slug][$eq]": slug,
            "populate[sectors]": "true",
            "populate[gated_content]": "true",
            "populate[seo]": "true",
            "populate[featured_image]": "true",
        });

        // Add additional population fields as needed for specific components

        const url = `${STRAPI_BASE_URL}/api/tenders?${query.toString()}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return null;

        const json = await res.json();
        return json?.data?.[0] ?? null;
    } catch (e) {
        console.error(`Error fetching tender ${slug}:`, e);
        return null;
    }
}

/**
 * Fetch featured tenders
 */
export async function getFeaturedTenders(limit = 4) {
    try {
        const query = new URLSearchParams({
            "filters[featured][$eq]": "true",
            "pagination[limit]": String(limit),
            "sort[0]": "publishedAt:desc",
            "populate": "*",
        });

        const res = await fetch(`${STRAPI_BASE_URL}/api/tenders?${query.toString()}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) return [];
        const json = await res.json();
        return json?.data || [];
    } catch (e) {
        console.error("Error fetching featured tenders:", e);
        return [];
    }
}

/**
 * Fetch related tenders based on common sectors
 */
export async function getRelatedTenders(sectorSlugs: string[], currentSlug: string, limit = 4) {
    try {
        const queryParams: Record<string, string> = {
            "filters[slug][$ne]": currentSlug,
            "sort[0]": "publishedAt:desc",
            "pagination[limit]": String(limit),
            "populate[sectors]": "true",
            "populate[featured_image]": "true",
        };

        if (sectorSlugs.length > 0) {
            sectorSlugs.forEach((slug, index) => {
                queryParams[`filters[sectors][slug][$in][${index}]`] = slug;
            });
        }

        const query = new URLSearchParams(queryParams);
        const res = await fetch(`${STRAPI_BASE_URL}/api/tenders?${query.toString()}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) return [];
        const json = await res.json();
        return json?.data || [];
    } catch (e) {
        console.error("Error fetching related tenders:", e);
        return [];
    }
}
