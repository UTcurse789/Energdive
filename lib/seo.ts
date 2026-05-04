const SITE_URL = "https://www.energdive.com";

function normalizePath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function getCanonicalUrl(path: string): string {
  return new URL(normalizePath(path), SITE_URL).toString();
}
