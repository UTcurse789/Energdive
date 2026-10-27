/**
 * Shared no-cache headers to prevent Cloudflare / CDN from caching
 * user-specific API responses. Without these headers, one user's
 * profile/feed data can be served to another user from Cloudflare's cache.
 *
 * Usage: return NextResponse.json(data, { headers: NO_CACHE_HEADERS })
 */
export const NO_CACHE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "Surrogate-Control": "no-store",
    "Pragma": "no-cache",
} as const;
