import { buildContentUrl } from "@/lib/content-routes";
import { fetchStrapi, StrapiCollection } from "@/lib/strapi";
import { strapiMediaUrl } from "@/lib/strapi-image";

export const RSS_REVALIDATE = 3600;

const DEFAULT_SITE_URL = "https://www.energdive.com";

type JsonRecord = Record<string, unknown>;

interface FeedEntry {
  title: string;
  path: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  author: string | null;
  categories: string[];
  imageUrl: string;
}

interface CreateRssResponseOptions {
  title: string;
  description: string;
  feedPath: string;
  contentType?: string;
}

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const trimmed = value.slice(0, maxLength).trimEnd();
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${(lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed).trimEnd()}...`;
}

function extractText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).filter(Boolean).join(" ");

  if (typeof node === "object") {
    const record = node as JsonRecord;
    const ownText = typeof record.text === "string" ? record.text : "";
    const childText = Array.isArray(record.children) ? extractText(record.children) : "";
    return [ownText, childText].filter(Boolean).join(" ");
  }

  return "";
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function normalizeRelationItems(input: unknown): unknown[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  const record = asRecord(input);
  if (!record) return [];

  if (Array.isArray(record.data)) return record.data;
  if (record.data) return [record.data];
  return [input];
}

function extractName(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    for (const entry of value) {
      const name = extractName(entry);
      if (name) return name;
    }
    return "";
  }

  const record = asRecord(value);
  if (!record) return "";

  const direct = getFirstString(record.name, record.Name);
  if (direct) return direct;

  return extractName(record.attributes) || extractName(record.data);
}

function extractNames(value: unknown): string[] {
  return normalizeRelationItems(value)
    .map(extractName)
    .filter(Boolean);
}

function extractExcerpt(item: JsonRecord): string {
  const excerpt = collapseWhitespace(stripHtml(extractText(item.Excerpt)));
  if (excerpt) return truncate(excerpt, 320);

  const content = collapseWhitespace(stripHtml(extractText(item.Content)));
  if (content) return truncate(content, 320);

  return "Read more on ENERGDIVE.";
}

function resolveDate(item: JsonRecord): string {
  return getFirstString(item.Date, item.publishedAt, item.updatedAt, item.createdAt);
}

function toRssDate(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toUTCString();
}

function guessMimeType(url: string): string | null {
  const normalized = url.split("?")[0].toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".svg")) return "image/svg+xml";
  return null;
}

async function getLatestContent(contentType?: string): Promise<FeedEntry[]> {
  try {
    const params: Record<string, unknown> = {
      populate: "*",
      sort: ["Date:desc", "publishedAt:desc", "updatedAt:desc"],
      pagination: { pageSize: 100 },
    };

    if (contentType) {
      params.filters = {
        type_of_content: {
          name: { $eq: contentType },
        },
      };
    }

    const res = await fetchStrapi<StrapiCollection<unknown>>("contents", params);

    return (res.data || [])
      .map((entry) => {
        const baseRecord = asRecord(entry) || {};
        return asRecord(baseRecord.attributes) || baseRecord;
      })
      .filter((item) => getString(item.slug).trim().length > 0)
      .map((item) => {
        const slug = getString(item.slug).trim();
        const path = buildContentUrl({
          slug,
          type_of_content: item.type_of_content,
          content_tag: item.content_tag,
        });

        const sectors = extractNames(item.sectors);
        const tags = extractNames(item.tags);
        const typeName = extractName(item.type_of_content) || "News";
        const authorName = extractName(item.author) || extractName(item.Author) || null;

        return {
          title: getFirstString(item.Title, item.title) || "Untitled",
          path,
          description: extractExcerpt(item),
          publishedAt: resolveDate(item),
          updatedAt: getFirstString(item.updatedAt, resolveDate(item)),
          author: authorName,
          categories: [typeName, ...sectors, ...tags],
          imageUrl: strapiMediaUrl(item.FeaturedImage, ""),
        };
      });
  } catch (error) {
    console.error("RSS feed fetch error:", error);
    return [];
  }
}

export async function createRssResponse({
  title,
  description,
  feedPath,
  contentType,
}: CreateRssResponseOptions): Promise<Response> {
  const siteUrl = getSiteUrl();
  const feedUrl = `${siteUrl}${feedPath}`;
  const siteLink = `${siteUrl}/`;
  const items = await getLatestContent(contentType);

  const lastBuildDate =
    items
      .map((item) => item.updatedAt || item.publishedAt)
      .map(toRssDate)
      .find(Boolean) || new Date().toUTCString();

  const rssItems = items
    .map((item) => {
      const itemUrl = `${siteUrl}${item.path}`;
      const pubDate = toRssDate(item.publishedAt);
      const categories = Array.from(new Set(item.categories.filter(Boolean)))
        .map((category) => `<category>${escapeXml(category)}</category>`)
        .join("");
      const author = item.author ? `<dc:creator>${escapeXml(item.author)}</dc:creator>` : "";
      const enclosureType = item.imageUrl ? guessMimeType(item.imageUrl) : null;
      const enclosure = item.imageUrl && enclosureType
        ? `<enclosure url="${escapeXml(item.imageUrl)}" type="${enclosureType}" />`
        : "";

      return `
  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${escapeXml(itemUrl)}</link>
    <guid isPermaLink="true">${escapeXml(itemUrl)}</guid>
    <description>${escapeXml(item.description)}</description>
    ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    ${author}
    ${categories}
    ${enclosure}
  </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteLink)}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(`${siteUrl}/fav.jpg`)}</url>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(siteLink)}</link>
    </image>${rssItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
