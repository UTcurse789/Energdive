export const DEFAULT_POST_AUTH_REDIRECT = "/";
export const POST_AUTH_REDIRECT_STORAGE_KEY = "energdive_post_auth_redirect";
export const POST_AUTH_REDIRECT_COOKIE = "energdive_post_auth_redirect";

export function getSafeRedirectPath(value: string | null | undefined): string {
    if (!value) return DEFAULT_POST_AUTH_REDIRECT;

    const sanitizePath = (path: string) => {
        if (!path.startsWith("/") || path.startsWith("//")) {
            return DEFAULT_POST_AUTH_REDIRECT;
        }

        if (
            path === "/auth" ||
            path.startsWith("/auth/") ||
            path === "/onboarding" ||
            path.startsWith("/onboarding?")
        ) {
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

export function getSafeRedirectFromClient(): string {
    if (typeof window === "undefined") {
        return DEFAULT_POST_AUTH_REDIRECT;
    }

    const fromUrl = new URLSearchParams(window.location.search).get("redirect_url");
    if (fromUrl) {
        const resolved = getSafeRedirectFromStoredValue(fromUrl);
        if (resolved !== DEFAULT_POST_AUTH_REDIRECT) {
            return resolved;
        }
    }

    // Try sessionStorage first
    try {
        const fromStorage = sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY);
        if (fromStorage) {
            const resolved = getSafeRedirectFromStoredValue(fromStorage);
            if (resolved !== DEFAULT_POST_AUTH_REDIRECT) {
                return resolved;
            }
        }
    } catch (e) {
        console.warn("[getSafeRedirectFromClient] failed to read sessionStorage:", e);
    }

    // Fallback to cookie
    try {
        const cookieValue = document.cookie
            .split("; ")
            .find((row) => row.trim().startsWith(`${POST_AUTH_REDIRECT_COOKIE}=`))
            ?.split("=")[1];
        if (cookieValue) {
            return getSafeRedirectFromStoredValue(cookieValue);
        }
    } catch (e) {
        console.warn("[getSafeRedirectFromClient] failed to read cookie:", e);
    }

    return DEFAULT_POST_AUTH_REDIRECT;
}

export function persistPostAuthRedirect(value: string | null | undefined): string {
    const target = getSafeRedirectPath(value);

    if (typeof window === "undefined") {
        return target;
    }

    try {
        sessionStorage.setItem(POST_AUTH_REDIRECT_STORAGE_KEY, target);
    } catch (e) {
        console.warn("[persistPostAuthRedirect] failed to write sessionStorage:", e);
    }

    try {
        document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=${encodeURIComponent(target)}; path=/; max-age=86400; SameSite=Lax`;
    } catch (e) {
        console.warn("[persistPostAuthRedirect] failed to write cookie:", e);
    }

    return target;
}

export function getSsoCallbackUrl(value: string | null | undefined): string {
    const target = getSafeRedirectPath(value);
    const params = new URLSearchParams({ redirect_url: target });

    return `/auth/sso-callback?${params.toString()}`;
}

export function clearPostAuthRedirect(): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
    } catch (e) {
        console.warn("[clearPostAuthRedirect] failed to clear sessionStorage:", e);
    }

    try {
        document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    } catch (e) {
        console.warn("[clearPostAuthRedirect] failed to clear cookie:", e);
    }
}
