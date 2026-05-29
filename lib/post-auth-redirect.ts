export const DEFAULT_POST_AUTH_REDIRECT = "/dashboard";
export const POST_AUTH_REDIRECT_STORAGE_KEY = "energdive_post_auth_redirect";
export const POST_AUTH_REDIRECT_COOKIE = "energdive_post_auth_redirect";

export function getSafeRedirectPath(value: string | null | undefined): string {
    if (!value) return DEFAULT_POST_AUTH_REDIRECT;

    const sanitizePath = (path: string) => {
        if (!path.startsWith("/") || path.startsWith("//")) {
            return DEFAULT_POST_AUTH_REDIRECT;
        }

        if (path === "/auth" || path.startsWith("/auth/")) {
            return DEFAULT_POST_AUTH_REDIRECT;
        }

        return path;
    };

    if (value.startsWith("/")) {
        return sanitizePath(value);
    }

    if (typeof window === "undefined") {
        return DEFAULT_POST_AUTH_REDIRECT;
    }

    try {
        const parsed = new URL(value, window.location.origin);
        if (parsed.origin !== window.location.origin) {
            return DEFAULT_POST_AUTH_REDIRECT;
        }

        return sanitizePath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    } catch {
        return DEFAULT_POST_AUTH_REDIRECT;
    }
}

export function getSafeRedirectFromStoredValue(value: string | null | undefined): string {
    if (!value) {
        return DEFAULT_POST_AUTH_REDIRECT;
    }

    try {
        return getSafeRedirectPath(decodeURIComponent(value));
    } catch {
        return getSafeRedirectPath(value);
    }
}
