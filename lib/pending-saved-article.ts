export const PENDING_SAVED_ARTICLE_KEY = "energdive_pending_saved_article";
export const SAVED_ARTICLES_DASHBOARD_PATH = "/dashboard/saved";
export const SAVED_ARTICLE_REDIRECT_PATH = `${SAVED_ARTICLES_DASHBOARD_PATH}?pending_save=1`;
export const SAVED_ARTICLE_TOAST_MESSAGE = "Your article is saved inside your dashboard.";
export const SAVED_JOB_TOAST_MESSAGE = "Your job is saved inside your dashboard.";

export type PendingSavedItemKind = "article" | "job";

export interface PendingSavedArticle {
    title: string;
    url: string;
    createdAt: string;
    kind: PendingSavedItemKind;
}

function normalizePendingSavedArticle(value: unknown): PendingSavedArticle | null {
    if (!value || typeof value !== "object") return null;

    const candidate = value as Partial<PendingSavedArticle>;
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
    const url = typeof candidate.url === "string" ? candidate.url.trim() : "";

    if (!title || !url) return null;

    return {
        title,
        url,
        createdAt:
            typeof candidate.createdAt === "string" && candidate.createdAt.trim()
                ? candidate.createdAt
                : new Date().toISOString(),
        kind: candidate.kind === "job" ? "job" : "article",
    };
}

export function getSavedItemToastMessage(kind: PendingSavedItemKind = "article") {
    return kind === "job" ? SAVED_JOB_TOAST_MESSAGE : SAVED_ARTICLE_TOAST_MESSAGE;
}

export function persistPendingSavedArticle(
    input: Pick<PendingSavedArticle, "title" | "url"> & { kind?: PendingSavedItemKind }
): boolean {
    if (typeof window === "undefined") return false;

    const pending = normalizePendingSavedArticle({
        ...input,
        kind: input.kind || "article",
        createdAt: new Date().toISOString(),
    });
    if (!pending) return false;

    try {
        window.sessionStorage.setItem(PENDING_SAVED_ARTICLE_KEY, JSON.stringify(pending));
        return true;
    } catch (error) {
        console.warn("[persistPendingSavedArticle] failed to write sessionStorage:", error);
        return false;
    }
}

export function readPendingSavedArticle(): PendingSavedArticle | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.sessionStorage.getItem(PENDING_SAVED_ARTICLE_KEY);
        if (!raw) return null;
        return normalizePendingSavedArticle(JSON.parse(raw));
    } catch (error) {
        console.warn("[readPendingSavedArticle] failed to read sessionStorage:", error);
        return null;
    }
}

export function clearPendingSavedArticle(): void {
    if (typeof window === "undefined") return;

    try {
        window.sessionStorage.removeItem(PENDING_SAVED_ARTICLE_KEY);
    } catch (error) {
        console.warn("[clearPendingSavedArticle] failed to clear sessionStorage:", error);
    }
}

export function clearPendingSaveQueryParam(): void {
    if (typeof window === "undefined") return;

    const current = new URL(window.location.href);
    if (!current.searchParams.has("pending_save")) return;

    current.searchParams.delete("pending_save");
    const nextUrl = `${current.pathname}${current.search}${current.hash}`;
    window.history.replaceState({}, "", nextUrl);
}
