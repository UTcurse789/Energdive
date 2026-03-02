const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

type StrapiMedia = {
    url?: string | null;
    formats?: {
        medium?: { url?: string | null };
        small?: { url?: string | null };
    };
};

type StrapiIssueItem = {
    id?: number | string;
    slug?: string;
    Month?: string;
    Year?: number | string;
    Title?: string;
    Date?: string;
    publishedAt?: string;
    createdAt?: string;
    CoverImage?: StrapiMedia[] | StrapiMedia | null;
};

export type LatestIssueData = {
    slug: string;
    title: string;
    month: string;
    year: string;
    coverImage: string;
};

function toIssueSlug(month: string, year: string, fallbackId: unknown): string {
    if (!month || !year) return String(fallbackId ?? "").trim();
    const monthPart = month
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${monthPart}-${year}`;
}

function normalizeIssue(item: StrapiIssueItem): LatestIssueData | null {
    const month = String(item?.Month ?? "").trim();
    const year = String(item?.Year ?? "").trim();

    const slugFromApi = typeof item?.slug === "string" ? item.slug.trim() : "";
    const slug = slugFromApi || toIssueSlug(month, year, item?.id);
    if (!slug) return null;

    const coverImageField = Array.isArray(item?.CoverImage)
        ? item.CoverImage[0]
        : item?.CoverImage;
    const rawCover =
        coverImageField?.formats?.medium?.url ||
        coverImageField?.formats?.small?.url ||
        coverImageField?.url ||
        null;

    const coverImage = rawCover
        ? rawCover.startsWith("http") ? rawCover : `${STRAPI_BASE_URL}${rawCover}`
        : "/magazine-default.jpg";

    const titleFromApi = typeof item?.Title === "string" ? item.Title.trim() : "";
    const title = titleFromApi || [month, year].filter(Boolean).join(" ").trim() || "Latest Issue";

    return { slug, title, month, year, coverImage };
}

/**
 * Fetch the latest (most recently published) issue from Strapi.
 * Server-side only — cached with 60s revalidation.
 */
export async function getLatestIssue(): Promise<LatestIssueData | null> {
    try {
        const res = await fetch(
            `${STRAPI_BASE_URL}/api/issues?populate=CoverImage&sort=createdAt:desc&pagination[limit]=1`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return null;

        const json = (await res.json()) as { data?: StrapiIssueItem[] };
        const item = json.data?.[0];
        if (!item) return null;

        return normalizeIssue(item);
    } catch (e) {
        console.error("Failed to fetch latest issue from Strapi:", e);
        return null;
    }
}
