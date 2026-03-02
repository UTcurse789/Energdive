const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
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
        // Use local date string to avoid UTC timezone mismatch
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`; // YYYY-MM-DD in local time

        // Build URL — don't filter dates in Strapi (they may be null = always active)
        const url = buildUrl({}, placement, sectorSlug, today);

        console.log(`[Ads] Fetching: placement=${placement}, sector=${sectorSlug || "none"}, today=${today}`);
        console.log(`[Ads] URL: ${url}`);

        const res = await fetch(url, {
            headers: {
                ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
            },
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            console.error(`[Ads] Strapi error: ${res.status} ${res.statusText}`);
            return [];
        }

        const json = await res.json();
        let ads: Advertisement[] = json.data || [];

        console.log(`[Ads] Raw ads from Strapi: ${ads.length} for placement "${placement}"`);

        // Filter by date in code (null/empty dates = always active)
        ads = ads.filter((ad) => {
            if (ad.start_date && ad.start_date > today) return false;
            if (ad.end_date && ad.end_date < today) return false;
            return true;
        });

        console.log(`[Ads] After date filter: ${ads.length} ads remaining`);

        // If sector-specific query returned nothing, fallback to placement-only
        if (ads.length === 0 && sectorSlug) {
            console.log(`[Ads] No sector-specific ads, falling back to placement-only`);
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
