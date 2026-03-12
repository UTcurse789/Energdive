/**
 * Centralized content-type → route mapping.
 *
 * Every Strapi `type_of_content.name` maps to an app route slug.
 * Import this everywhere instead of maintaining local copies.
 */

const ROUTE_MAP: Record<string, string> = {
  news: "news",
  articles: "articles",
  opinion: "opinion",
  reports: "reports",
  report: "reports",
  "cover story": "cover-story",
  "case study": "case-study",
  interview: "interview",
  editorial: "editorial",
  feature: "feature",
  "featured stories": "featured-stories",
  "featured story": "featured-stories",
  analysis: "analysis",
  videos: "videos",
  events: "events",
};

/**
 * Returns the URL route prefix for a given content-type name.
 * e.g. "Cover Story" → "cover-story"
 */
export function getRoutePrefix(contentTypeName: string): string {
  return ROUTE_MAP[contentTypeName.toLowerCase().trim()] ?? "news";
}

/**
 * Extracts the content-type name from various Strapi data shapes.
 */
export function extractContentTypeName(typeOfContent: any): string {
  if (!typeOfContent) return "news";
  // Array shape (Strapi v5 populate)
  if (Array.isArray(typeOfContent)) {
    return typeOfContent[0]?.Name ?? typeOfContent[0]?.name ?? "news";
  }
  // Object shape
  return (
    typeOfContent.Name ??
    typeOfContent.name ??
    typeOfContent.data?.attributes?.name ??
    "news"
  );
}

/**
 * Builds a full content URL from an item's slug and type_of_content.
 *
 * Accepts various shapes:
 *   - { slug, type_of_content }     (raw Strapi item)
 *   - { slug, contentType: "News" } (already extracted)
 *   - { slug, category: "Opinion" } (mapped)
 */
export function buildContentUrl(item: {
  slug: string;
  type_of_content?: any;
  contentType?: string;
  category?: string;
}): string {
  const typeName =
    item.contentType ??
    extractContentTypeName(item.type_of_content) ??
    item.category ??
    "news";
  const prefix = getRoutePrefix(typeName);
  return `/${prefix}/${item.slug}`;
}
