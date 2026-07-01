import { strapiImageUrl, strapiMediaUrl } from "@/lib/strapi-image";
import type { EnergyEvent, EventResource } from "@/components/resource-center/types";

const STRAPI_BASE =
  process.env.STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "https://cms-staging.energdive.com";

const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";
const RESOURCE_CENTER_ENDPOINT = "resoucre-centers";

type StrapiMedia = {
  name?: string | null;
  ext?: string | null;
  mime?: string | null;
  size?: number | string | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  formats?: Record<string, { url?: string | null } | undefined> | null;
  data?: { attributes?: StrapiMedia } | null;
  attributes?: StrapiMedia;
};

type StrapiSector = {
  name?: string | null;
  attributes?: {
    name?: string | null;
  };
};

type StrapiRichTextNode = {
  text?: string;
  children?: StrapiRichTextNode[];
};

type StrapiResourceCenterEntry = {
  id?: number;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  short_title?: string | null;
  full_title?: string | null;
  slug?: string | null;
  resource_tag?: string | null;
  description?: StrapiRichTextNode[] | string | null;
  resource_type?: string | null;
  year?: string | number | null;
  featured?: boolean | null;
  promotional?: boolean | null;
  show?: string | null;
  third_party_notification_emails?: string | string[] | null;
  third_party_notification_email?: string | null;
  notification_emails?: string | string[] | null;
  notification_email?: string | null;
  cover_image?: StrapiMedia | null;
  thumbnail_image?: StrapiMedia | null;
  resource_file?: StrapiMedia | null;
  sectors?: StrapiSector[] | { data?: StrapiSector[] } | null;
  attributes?: StrapiResourceCenterEntry;
};

type StrapiListResponse = {
  data?: StrapiResourceCenterEntry[];
  meta?: {
    pagination?: {
      page?: number;
      pageCount?: number;
    };
  };
};

const EVENT_COLORS = [
  "#0F766E",
  "#166534",
  "#1D4ED8",
  "#B45309",
  "#334155",
  "#7C3AED",
  "#BE123C",
];

function hashIndex(value: string, length: number) {
  return Math.abs(
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
  ) % length;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initials(value: string) {
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) return "RC";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

function plainTextFromRichText(value: StrapiResourceCenterEntry["description"]) {
  if (!value) return "";
  if (typeof value === "string") return value;

  function walk(nodes: StrapiRichTextNode[]): string {
    return nodes
      .map((node) => {
        if (node.text) return node.text;
        if (node.children) return walk(node.children);
        return "";
      })
      .join(" ");
  }

  return walk(value).replace(/\s+/g, " ").trim();
}

function mediaAttributes(media?: StrapiMedia | null): StrapiMedia | null {
  if (!media) return null;
  return media.data?.attributes || media.attributes || media;
}

function mediaFileUrl(media?: StrapiMedia | null) {
  const attrs = mediaAttributes(media);
  return attrs?.url ? strapiImageUrl(attrs.url, "", STRAPI_BASE) : "";
}

function mediaFileType(media?: StrapiMedia | null) {
  const attrs = mediaAttributes(media);
  const ext = attrs?.ext?.replace(".", "").trim();
  if (ext) return ext.toUpperCase();

  const mime = attrs?.mime || "";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPT";
  if (mime.includes("zip")) return "ZIP";
  return "FILE";
}

function mediaFileSize(media?: StrapiMedia | null) {
  const attrs = mediaAttributes(media);
  const sizeInKb = Number(attrs?.size || 0);
  if (!Number.isFinite(sizeInKb) || sizeInKb <= 0) return "File size unavailable";

  if (sizeInKb >= 1024) {
    const mb = sizeInKb / 1024;
    return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
  }

  return `${Math.round(sizeInKb)} KB`;
}

function sectorNames(sectors: StrapiResourceCenterEntry["sectors"]) {
  const list = Array.isArray(sectors) ? sectors : sectors?.data || [];
  return list
    .map((sector) => sector.attributes?.name || sector.name || "")
    .map((sector) => sector.trim())
    .filter(Boolean);
}

function emailList(value: unknown) {
  const values = Array.isArray(value) ? value : [value];
  const emails = values
    .flatMap((item) => (typeof item === "string" ? item.split(/[,\n;]+/) : []))
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

  return Array.from(new Set(emails));
}

function normalizeResource(item: StrapiResourceCenterEntry): EventResource | null {
  const entry = item.attributes || item;
  const title = (entry.full_title || entry.short_title || "").trim();
  if (!title) return null;

  const showCode = (entry.show || "").trim();
  const eventName = (entry.short_title || showCode || "Resource Center").trim();
  const eventId = slugify(showCode || eventName || "resource-center");
  const slug = (entry.slug || slugify(title)).trim();
  const publishedAt = entry.publishedAt || entry.updatedAt || entry.createdAt || "";
  const parsedYear = Number(entry.year) || new Date(publishedAt).getFullYear();
  const resourceFile = mediaAttributes(entry.resource_file);
  const coverImage = mediaAttributes(entry.cover_image);
  const fileType = mediaFileType(entry.resource_file);
  const fileName = resourceFile?.name || `${slug}.${fileType.toLowerCase()}`;

  return {
    id: entry.documentId || String(entry.id || slug),
    slug,
    event_id: eventId,
    resource_type: (entry.resource_type || "Resource").trim(),
    resourceTag: (entry.resource_tag || "Resource").trim(),
    file_url: mediaFileUrl(entry.resource_file),
    fileName,
    thirdPartyNotificationEmails: emailList(
      entry.third_party_notification_emails ||
        entry.third_party_notification_email ||
        entry.notification_emails ||
        entry.notification_email
    ),
    coverImageUrl: strapiMediaUrl(entry.cover_image, "", STRAPI_BASE) || null,
    coverImageWidth: coverImage?.width || null,
    coverImageHeight: coverImage?.height || null,
    thumbnailImageUrl: strapiMediaUrl(entry.thumbnail_image, "", STRAPI_BASE) || null,
    title,
    eventName,
    eventLogo: showCode || initials(eventName),
    showCode: showCode || initials(eventName),
    year: Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear(),
    sector: sectorNames(entry.sectors),
    description: plainTextFromRichText(entry.description),
    fileType,
    fileSize: mediaFileSize(entry.resource_file),
    publishedAt,
    featured: Boolean(entry.featured),
    promotional: Boolean(entry.promotional),
  };
}

function buildEvents(resources: EventResource[]): EnergyEvent[] {
  const events = new Map<string, EnergyEvent>();

  resources.forEach((resource) => {
    const existing = events.get(resource.event_id);
    if (existing) {
      existing.totalResources += 1;
      return;
    }

    events.set(resource.event_id, {
      id: resource.event_id,
      name: resource.eventName,
      logoLabel: resource.eventLogo,
      brandColor: EVENT_COLORS[hashIndex(resource.event_id, EVENT_COLORS.length)],
      totalResources: 1,
    });
  });

  return Array.from(events.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchResourceCenterPage(page: number) {
  const url = new URL(
    `/api/${RESOURCE_CENTER_ENDPOINT}`,
    STRAPI_BASE.replace(/\/$/, "")
  );
  url.searchParams.set("populate", "*");
  url.searchParams.set("sort", "publishedAt:desc");
  url.searchParams.set("pagination[page]", String(page));
  url.searchParams.set("pagination[pageSize]", "100");

  const response = await fetch(url.toString(), {
    headers: STRAPI_TOKEN
      ? {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        }
      : undefined,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(
      `Resource Center CMS request failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as StrapiListResponse;
}

export async function getResourceCenterData() {
  const resources: EventResource[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const payload = await fetchResourceCenterPage(page);
    pageCount = payload.meta?.pagination?.pageCount || 1;
    resources.push(
      ...(payload.data || [])
        .map((item) => normalizeResource(item))
        .filter((item): item is EventResource => Boolean(item))
    );
    page += 1;
  } while (page <= pageCount);

  return {
    resources,
    events: buildEvents(resources),
  };
}

export async function getResourceCenterResource(slug: string) {
  const url = new URL(
    `/api/${RESOURCE_CENTER_ENDPOINT}`,
    STRAPI_BASE.replace(/\/$/, "")
  );
  url.searchParams.set("populate", "*");
  url.searchParams.set("filters[slug][$eq]", slug);
  url.searchParams.set("pagination[pageSize]", "1");

  const response = await fetch(url.toString(), {
    headers: STRAPI_TOKEN
      ? {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        }
      : undefined,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(
      `Resource Center CMS request failed: ${response.status} ${response.statusText}`
    );
  }

  const payload = (await response.json()) as StrapiListResponse;
  const resource = payload.data?.[0] ? normalizeResource(payload.data[0]) : null;

  return resource;
}
