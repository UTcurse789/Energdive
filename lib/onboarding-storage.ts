const ARTICLE_PATH_PREFIXES = ["/news/", "/articles/", "/analysis/"];

export const ONBOARDING_KEYS = {
  homeHintSeen: "energdive:onboarding:home-hint-seen",
  headerCtaHintSeen: "energdive:onboarding:header-cta-hint-seen",
  saveButtonHintSeenSession: "energdive:onboarding:save-button-hint-seen-session",
  newsletterDismissedAt: "energdive:onboarding:newsletter-dismissed-at",
  newsletterShownSession: "energdive:onboarding:newsletter-shown-session",
  articleVisits: "energdive:onboarding:article-visits",
  latestNewsRailSeenSession: "energdive:onboarding:latest-news-rail-seen-session",
  premiumDiscoveryDismissedSession: "energdive:onboarding:premium-discovery-dismissed-session",
} as const;

type ArticleVisitEntry = {
  path: string;
  visitedAt: number;
};

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseBrowserStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseBrowserStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so onboarding never blocks the core UI.
  }
}

export function isArticlePath(pathname: string) {
  return ARTICLE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function hasLocalFlag(key: string) {
  if (!canUseBrowserStorage()) return false;
  return window.localStorage.getItem(key) === "1";
}

export function setLocalFlag(key: string) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(key, "1");
}

export function isSessionFlagSet(key: string) {
  if (!canUseBrowserStorage()) return false;
  return window.sessionStorage.getItem(key) === "1";
}

export function setSessionFlag(key: string) {
  if (!canUseBrowserStorage()) return;
  window.sessionStorage.setItem(key, "1");
}

export function dismissWithCooldown(key: string) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(key, Date.now().toString());
}

export function isCooldownActive(key: string, ttlMs: number) {
  if (!canUseBrowserStorage()) return false;

  const raw = window.localStorage.getItem(key);
  if (!raw) return false;

  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;

  return Date.now() - dismissedAt < ttlMs;
}

export function recordArticleVisit(pathname: string) {
  if (!canUseBrowserStorage() || !isArticlePath(pathname)) return 0;

  const now = Date.now();
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  const visits = readJson<ArticleVisitEntry[]>(ONBOARDING_KEYS.articleVisits, []);
  const recentVisits = visits.filter(
    (entry) => entry?.path && now - entry.visitedAt < maxAgeMs,
  );
  const withoutCurrent = recentVisits.filter((entry) => entry.path !== pathname);
  const nextVisits = [{ path: pathname, visitedAt: now }, ...withoutCurrent].slice(0, 12);

  writeJson(ONBOARDING_KEYS.articleVisits, nextVisits);
  return nextVisits.length;
}
