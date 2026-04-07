import qs from "qs";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

export interface StrapiImage {
    url: string;
    width: number;
    height: number;
    alternativeText: string;
}

export interface StrapiData<T> {
    id: number;
    attributes: T;
}

export interface StrapiCollection<T> {
    data: StrapiData<T>[];
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

// --- Content Types ---

export interface Author {
    name: string;
    designation: string;
    bio?: string;
    avatar?: { data: StrapiData<StrapiImage> };
}

export interface ContentItem {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    publishedAt: string;
    author?: { data: StrapiData<Author> };
    cover?: { data: StrapiData<StrapiImage> };
    tags?: { data: StrapiData<Tag>[] };
    industry?: { data: StrapiData<Industry> };
    sector?: { data: StrapiData<Sector> };
}

export interface Industry {
    name: string;
    slug: string;
}

export interface Sector {
    name: string;
    slug: string;
}

export interface Tag {
    name: string;
    slug: string;
}

/**
 * Helper to fetch from Strapi with caching and authentication
 */
export async function fetchStrapi<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: RequestInit = {}
): Promise<T> {
    if (!STRAPI_TOKEN) {
        console.warn("⚠️ STRAPI_API_TOKEN is not set. Requests may fail.");
    }

    const query = qs.stringify(params, { encodeValuesOnly: true });
    const url = `${STRAPI_URL}/api/${endpoint}${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        next: { revalidate: 600 }, // Default 10-minute ISR revalidation
        ...options,
    });

    if (!res.ok) {
        // Handle common errors
        if (res.status === 403 || res.status === 401) {
            throw new Error(`Strapi Authorization Failed: ${res.statusText}`);
        }
        if (res.status === 404) {
            return { data: [], meta: { pagination: { total: 0 } } } as unknown as T;
        }
        throw new Error(`Strapi Error (${res.status}): ${res.statusText}`);
    }

    return res.json();
}

/**
 * Fetch list of content with sorting, filtering, and pagination
 */
export async function fetchContent(
    page = 1,
    pageSize = 10,
    filters = {}
): Promise<StrapiCollection<ContentItem>> {
    const params = {
        populate: ["author.avatar", "cover", "tags", "industry", "sector"],
        sort: ["publishedAt:desc"],
        pagination: {
            page,
            pageSize,
        },
        filters,
    };

    return fetchStrapi<StrapiCollection<ContentItem>>("contents", params);
}

/**
 * Fetch a single content item by slug
 */
export async function fetchContentBySlug(slug: string): Promise<StrapiData<ContentItem> | null> {
    const params = {
        populate: ["author.avatar", "cover", "tags", "industry", "sector"],
        filters: {
            slug: {
                $eq: slug,
            },
        },
    };

    const res = await fetchStrapi<StrapiCollection<ContentItem>>("contents", params);
    return res.data[0] || null;
}

/**
 * Fetch all Industries
 */
export async function fetchIndustries(): Promise<StrapiCollection<Industry>> {
    return fetchStrapi<StrapiCollection<Industry>>("industries", {
        sort: ["name:asc"],
        pagination: { pageSize: 100 },
    });
}

/**
 * Fetch all Tags
 */
export async function fetchTags(): Promise<StrapiCollection<Tag>> {
    return fetchStrapi<StrapiCollection<Tag>>("tags", {
        sort: ["name:asc"],
        pagination: { pageSize: 100 },
    });
}

/**
 * Convert any HTTP URL to HTTPS to prevent Mixed Content errors
 * when the site is served over HTTPS.
 */
export function ensureHttps(url: string): string {
    if (url.startsWith("http://")) {
        return url.replace("http://", "https://");
    }
    return url;
}

/**
 * Helper to get absolute image URL (always HTTPS)
 */
export function getStrapiMedia(url: string | null) {
    if (url == null) {
        return null;
    }

    // Return URL as is if it's external (s3, cloudinary, etc) — but enforce HTTPS
    if (url.startsWith("http") || url.startsWith("//")) {
        return ensureHttps(url);
    }

    // Otherwise prepend Strapi URL
    return ensureHttps(`${STRAPI_URL}${url}`);
}
