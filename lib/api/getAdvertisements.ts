const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

export interface Advertisement {
    id: number;
    documentId: string;
    title: string;
    placement: string;
    partner_name: string;
    target_url: string | null;
    is_active: boolean;
    start_date: string;
    end_date: string;
    priority: number | null;
    logo: StrapiMedia[] | null;
    creative: StrapiMedia[] | null;
    sectors: { id: number; name: string; slug: string | null }[];
}

interface StrapiMedia {
    id: number;
    url: string;
    width: number;
    height: number;
    alternativeText: string | null;
    formats: {
        small?: { url: string; width: number; height: number };
        medium?: { url: string; width: number; height: number };
        large?: { url: string; width: number; height: number };
        thumbnail?: { url: string; width: number; height: number };
    } | null;
}

interface GetAdvertisementsOptions {
    placement: string;
    sectorSlug?: string;
}

/**
 * Fetch active advertisements from Strapi, filtered by placement and optionally sector.
 * Falls back to placement-only ads if no sector-specific ads exist.
 */
export async function getAdvertisements({
    placement,
    sectorSlug,
}: GetAdvertisementsOptions): Promise<Advertisement[]> {
    try {
        const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // Build filters
        const filters: Record<string, any> = {
            placement: { $eq: placement },
            is_active: { $eq: true },
            start_date: { $lte: now },
            end_date: { $gte: now },
        };

        // If sector slug provided, try sector-specific first
        if (sectorSlug) {
            filters.sectors = { slug: { $eq: sectorSlug } };
        }

        const params = new URLSearchParams();
        // We'll build the query manually for nested filters
        const url = buildUrl(filters, placement, sectorSlug, now);

        const res = await fetch(url, {
            headers: {
                ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
            },
            next: { revalidate: 300 },
        });

        if (!res.ok) {
            console.error(`[Ads] Strapi error: ${res.status} ${res.statusText}`);
            return [];
        }

        const json = await res.json();
        let ads: Advertisement[] = json.data || [];

        // Filter by date in code (null dates = always active)
        ads = ads.filter((ad) => {
            if (ad.start_date && ad.start_date > now) return false;
            if (ad.end_date && ad.end_date < now) return false;
            return true;
        });

        // If sector-specific query returned nothing, fallback to placement-only
        if (ads.length === 0 && sectorSlug) {
            return getAdvertisements({ placement });
        }

        // Sort by priority DESC (higher priority first), nulls last
        ads.sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));

        return ads;
    } catch (err) {
        console.error("[Ads] Failed to fetch advertisements:", err);
        return [];
    }
}

function buildUrl(
    _filters: Record<string, any>,
    placement: string,
    sectorSlug: string | undefined,
    _now: string
): string {
    // Don't filter by date in Strapi query — dates may be null (meaning always active)
    // We filter dates in code after fetching
    let url =
        `${STRAPI_BASE}/api/advertisements` +
        `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
        `&filters[is_active][$eq]=true` +
        `&populate=*` +
        `&sort=priority:desc`;

    if (sectorSlug) {
        url += `&filters[sectors][slug][$eq]=${encodeURIComponent(sectorSlug)}`;
    }

    return url;
}

/**
 * Helper to get the full image URL from a Strapi media object
 */
export function getAdImageUrl(media: StrapiMedia | null | undefined): string | null {
    if (!media) return null;
    const url =
        media.formats?.large?.url ||
        media.formats?.medium?.url ||
        media.formats?.small?.url ||
        media.url;
    if (!url) return null;
    return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
}
