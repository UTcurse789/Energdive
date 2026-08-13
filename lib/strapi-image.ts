/**
 * Shared utility for resolving Strapi media URLs.
 *
 * When a CDN (e.g. cdn.energdive.com) is configured in front of Strapi,
 * the CMS returns fully-qualified URLs like https://cdn.energdive.com/image.jpg.
 * This helper prevents double-prefixing with the Strapi base URL.
 */

const STRAPI_BASE =
    process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

/**
 * Resolve a Strapi media URL to an absolute URL.
 *
 * - If the URL is already absolute (starts with http:// or https://), return as-is.
 * - If the URL is a relative path (e.g. /uploads/image.jpg), prepend the Strapi base.
 * - If the URL is null/undefined/empty, return the fallback.
 *
 * @param url - The raw URL from Strapi (may be relative or absolute)
 * @param fallback - Fallback URL if the input is null/undefined/empty
 * @returns Absolute URL string
 */
export function strapiImageUrl(
    url: string | null | undefined,
    fallback: string = "/placeholder.jpg",
    customBase?: string
): string {
    if (!url || !url.trim()) return fallback;

    let trimmed = url.trim();
    const effectiveBase = customBase || STRAPI_BASE;

    // Aggressive cleanup: if for some reason STRAPI_BASE was prepended
    // to an ALREADY absolute CDN url, strip the STRAPI_BASE prefix off.
    // Example: https://cms.energdive.comhttps://cdn.energdive.com -> https://cdn.energdive.com
    const baseNoTrailing = effectiveBase.endsWith('/') ? effectiveBase.slice(0, -1) : effectiveBase;
    if (trimmed.startsWith(baseNoTrailing + "http")) {
        trimmed = trimmed.replace(baseNoTrailing, "");
    } else if (trimmed.startsWith(baseNoTrailing + "//")) {
        trimmed = trimmed.replace(baseNoTrailing, "");
    }

    // Already absolute — CDN or external URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
        return trimmed;
    }

    // Relative path — prepend Strapi base
    return `${baseNoTrailing}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

/**
 * Extract image URL from a Strapi media object (handles nested formats).
 *
 * Tries: formats.large → formats.medium → formats.small → formats.thumbnail → url
 *
 * @param media - Strapi media object (may have .data.attributes or direct .url)
 * @param fallback - Fallback URL if no image found
 * @returns Absolute URL string
 */
export function strapiMediaUrl(
    media: any,
    fallback: string = "/placeholder.jpg",
    customBase?: string,
    preferredSize: "thumbnail" | "small" | "medium" | "large" = "large"
): string {
    if (!media) return fallback;

    const source = Array.isArray(media) ? media[0] : media;
    const data = source?.data || source;
    const attrs = data?.attributes || data;

    const formats = attrs?.formats;
    const formatOrder = {
        thumbnail: ["thumbnail", "small", "medium", "large"],
        small: ["small", "medium", "thumbnail", "large"],
        medium: ["medium", "small", "large", "thumbnail"],
        large: ["large", "medium", "small", "thumbnail"],
    }[preferredSize];
    const path = formatOrder.map((size) => formats?.[size]?.url).find(Boolean) || attrs?.url || null;

    return strapiImageUrl(path, fallback, customBase);
}
