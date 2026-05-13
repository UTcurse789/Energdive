import qs from "qs";
import { buildContentUrl } from "@/lib/content-routes";

export const SITEMAP_BASE_URL = "https://www.energdive.com";
export const SITEMAP_REVALIDATE = 600;
export const SITEMAP_CACHE_CONTROL =
  "public, max-age=600, stale-while-revalidate=300";

const STRAPI_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  "https://cms.energdive.com";

interface SitemapContentAttributes {
  slug?: string;
  Title?: string;
  title?: string;
  publishedAt?: string;
  updatedAt?: string;
  Date?: string;
  createdAt?: string;
  type_of_content?: unknown;
  content_tag?: unknown;
}

interface SitemapContentApiItem {
  attributes?: SitemapContentAttributes;
  slug?: string;
  Title?: string;
  title?: string;
  publishedAt?: string;
  updatedAt?: string;
  Date?: string;
  createdAt?: string;
  type_of_content?: unknown;
  content_tag?: unknown;
}

export interface SitemapContentEntry {
  slug: string;
  title: string;
  path: string;
  section: string;
  publishedAt: string;
  updatedAt: string;
}

interface SitemapContentResponse {
  data?: unknown[];
  meta?: {
    pagination?: {
      pageCount?: number;
    };
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getAttributes(item: SitemapContentApiItem): SitemapContentAttributes {
  return item.attributes ?? item;
}

function getSectionFromPath(path: string): string {
  return path.split("/").filter(Boolean)[0] || "";
}

function toSitemapEntry(item: SitemapContentApiItem): SitemapContentEntry | null {
  const attrs = getAttributes(item);
  const slug = attrs.slug?.trim();
  const publishedAt = attrs.Date || attrs.publishedAt || attrs.createdAt;
  const updatedAt = attrs.updatedAt || attrs.Date || attrs.publishedAt || attrs.createdAt;

  if (!slug || !publishedAt || !updatedAt) {
    return null;
  }

  const path = buildContentUrl({
    slug,
    type_of_content: attrs.type_of_content,
    content_tag: attrs.content_tag,
  });

  return {
    slug,
    title: attrs.Title || attrs.title || "Untitled",
    path,
    section: getSectionFromPath(path),
    publishedAt,
    updatedAt,
  };
}

export async function getAllSitemapContent(): Promise<SitemapContentEntry[]> {
  const allItems: SitemapContentApiItem[] = [];
  let page = 1;
  const pageSize = 100;

  try {
    while (true) {
      const baseParams = {
        populate: ["type_of_content", "content_tag"],
        sort: ["publishedAt:desc", "updatedAt:desc", "Date:desc"],
        pagination: { page, pageSize },
      };
      const primaryQuery = qs.stringify(baseParams, { encodeValuesOnly: true });

      let res = await fetch(`${STRAPI_BASE_URL}/api/contents?${primaryQuery}`, {
        next: { revalidate: SITEMAP_REVALIDATE },
      });

      // Fallback to populate=* in case the CMS/public role behaves differently
      // for explicit relation populate syntax on production.
      if (!res.ok) {
        const fallbackQuery = qs.stringify(
          {
            populate: "*",
            sort: ["publishedAt:desc", "updatedAt:desc", "Date:desc"],
            pagination: { page, pageSize },
          },
          { encodeValuesOnly: true }
        );
        res = await fetch(`${STRAPI_BASE_URL}/api/contents?${fallbackQuery}`, {
          next: { revalidate: SITEMAP_REVALIDATE },
        });
      }

      if (!res.ok) {
        throw new Error(`Strapi sitemap fetch failed (${res.status}): ${res.statusText}`);
      }

      const json = (await res.json()) as SitemapContentResponse;
      const items = (json.data || [])
        .map((item) => {
          const record = asRecord(item);
          if (!record) return null;

          const attrs = asRecord(record.attributes);
          return (attrs || record) as SitemapContentApiItem;
        })
        .filter((item): item is SitemapContentApiItem => item !== null);

      if (items.length === 0) break;

      allItems.push(...items);

      const totalPages = json.meta?.pagination?.pageCount ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }
  } catch (error) {
    console.error("Sitemap content fetch error:", error);
  }

  return allItems
    .map(toSitemapEntry)
    .filter((item): item is SitemapContentEntry => item !== null);
}

export function isArticleEntry(item: SitemapContentEntry): boolean {
  return item.section === "articles";
}

export function isNewsEntry(item: SitemapContentEntry): boolean {
  return item.section === "news";
}

export function isOtherContentEntry(item: SitemapContentEntry): boolean {
  return item.section !== "articles" && item.section !== "news";
}

export function toIsoDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
