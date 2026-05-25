import "server-only";

import { normalizePaperSubmission } from "@/lib/paper-submissions";

const DEFAULT_STRAPI_BASE = "https://cms-staging.energdive.com";
const STRAPI_URL =
    process.env.STRAPI_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    DEFAULT_STRAPI_BASE;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function fetchPaperSubmissions(queryString, options = {}) {
    if (!STRAPI_URL) {
        return [];
    }

    const url = `${STRAPI_URL}/api/paper-submissions?${queryString}`;
    let response = null;

    if (STRAPI_API_TOKEN) {
        response = await fetch(url, {
            cache: options.cache ?? "no-store",
            headers: {
                authorization: `Bearer ${STRAPI_API_TOKEN}`,
            },
        });

        // Staging currently returns 403 for this token on paper-submissions,
        // while the public collection can still be readable. Fall back cleanly.
        if (response.status === 401 || response.status === 403) {
            response = null;
        }
    }

    if (!response) {
        response = await fetch(url, {
            cache: options.cache ?? "no-store",
        });
    }

    if (!response.ok) {
        throw new Error(`Unable to load paper submissions (${response.status}).`);
    }

    const payload = await response.json();
    const rawEntries = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [];

    return rawEntries.map(normalizePaperSubmission);
}
