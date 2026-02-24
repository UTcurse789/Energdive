/**
 * In-memory TTL cache for Strapi API calls.
 *
 * Prevents thundering herd:  if 10 000 requests arrive for the same URL
 * within the TTL window, only ONE fetch goes out to Strapi — everybody
 * else gets the cached (or in-flight) promise.
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const inflight = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 60_000; // 60 seconds

/**
 * Fetch from Strapi with caching + dedup.
 *
 * @param url      Full Strapi URL (including query string)
 * @param options  Standard fetch options (headers, etc.)
 * @param ttl      Cache lifetime in milliseconds (default 60 000)
 */
export async function cachedFetch<T = any>(
    url: string,
    options?: RequestInit,
    ttl: number = DEFAULT_TTL_MS
): Promise<T> {
    const key = url;

    // 1. Return from cache if still valid
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiry) {
        return cached.data as T;
    }

    // 2. If another caller is already fetching this URL, piggy-back on it
    const existing = inflight.get(key);
    if (existing) {
        return existing as Promise<T>;
    }

    // 3. Fetch with an AbortController timeout (10 s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const promise = (async () => {
        try {
            const res = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) {
                throw new Error(`Strapi responded ${res.status} ${res.statusText}`);
            }

            const json = await res.json();

            // Store in cache
            cache.set(key, { data: json, expiry: Date.now() + ttl });

            return json as T;
        } finally {
            clearTimeout(timeout);
            inflight.delete(key);
        }
    })();

    inflight.set(key, promise);
    return promise;
}

/**
 * Invalidate a specific cache key (useful after webhooks / mutations).
 */
export function invalidateCache(url?: string) {
    if (url) {
        cache.delete(url);
    } else {
        cache.clear();
    }
}

/**
 * Get cache stats for monitoring.
 */
export function cacheStats() {
    let valid = 0;
    let expired = 0;
    const now = Date.now();
    for (const [, entry] of cache) {
        if (now < entry.expiry) valid++;
        else expired++;
    }
    return { total: cache.size, valid, expired, inflight: inflight.size };
}
