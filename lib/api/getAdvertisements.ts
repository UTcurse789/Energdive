
import { strapiImageUrl } from "@/lib/strapi-image";
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

import { isAdMatchingSector } from "@/lib/sector-content";

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

        // Build URL for placement
        const url =
            `${STRAPI_BASE}/api/advertisements` +
            `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
            `&filters[is_active][$eq]=true` +
            `&populate=*` +
            `&sort=priority:desc`;

        console.log(`[Ads] Fetching: placement=${placement}, sector=${sectorSlug || "none"}, today=${today}`);

        const res = await fetch(url, {
            headers: {
                ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
            },
            next: { revalidate: 3600 }, // 1 hour ISR
        });

        if (!res.ok) {
            console.error(`[Ads] Strapi error: ${res.status} ${res.statusText}`);
            return [];
        }

        const json = await res.json();
        let allAds: Advertisement[] = json.data || [];

        // Filter by date in code (null/empty dates = always active)
        allAds = allAds.filter((ad) => {
            if (ad.start_date && ad.start_date > today) return false;
            if (ad.end_date && ad.end_date < today) return false;
            return true;
        });

        let ads: Advertisement[] = [];
        if (sectorSlug) {
            const matchingAds = allAds.filter((ad) => isAdMatchingSector(ad, sectorSlug));
            if (matchingAds.length > 0) {
                ads = matchingAds;
            } else {
                // Fallback to global (no-sector) ads if no sector-specific match
                ads = allAds.filter((a) => !a.sectors || a.sectors.length === 0);
            }
        } else {
            ads = allAds;
        }

        // Sort by priority DESC (higher priority first), nulls last
        ads.sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));

        return ads;
    } catch (err) {
        console.error("[Ads] Failed to fetch advertisements:", err);
        return [];
    }
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
    return strapiImageUrl(url);
}
