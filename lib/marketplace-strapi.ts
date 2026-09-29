import qs from "qs";
import { strapiImageUrl, strapiMediaUrl } from "@/lib/strapi-image";
import type {
  MarketplaceCompany,
  MarketplaceProduct,
  CompanyResource,
  VideoResource,
  MarketplaceArticle,
  ProductSpecification,
  CompanyResourceType,
  ResourceFileType,
  CompanyType,
} from "@/data/marketplace/types";
import {
  getResourcesByCompanySlug as getFallbackResourcesByCompanySlug,
  getResourcesByProductSlug as getFallbackResourcesByProductSlug,
  getVideosByCompanySlug as getFallbackVideosByCompanySlug,
  getMarketplaceArticles as getFallbackArticles,
} from "@/data/marketplace";

// ---------------------------------------------------------------------------
// Strapi Configuration
// ---------------------------------------------------------------------------

const STRAPI_BASE =
  process.env.STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "https://cms.energdive.com";

const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

// ---------------------------------------------------------------------------
// Internal Strapi payload types
// ---------------------------------------------------------------------------

interface StrapiChildNode {
  text?: string;
}

interface StrapiBlockNode {
  children?: StrapiChildNode[];
  text?: string;
}

type StrapiRawRecord = Record<string, unknown>;

export interface StrapiListResponse<T = StrapiRawRecord> {
  data?: T[] | null;
  meta?: {
    pagination?: {
      page?: number;
      pageSize?: number;
      pageCount?: number;
      total?: number;
    };
  };
  error?: {
    status: number;
    name: string;
    message: string;
  };
}

/**
 * Describes a failed Strapi request so callers can surface the exact error.
 */
export interface StrapiRequestError {
  endpoint: string;
  status: number;
  message: string;
  isPermissionError: boolean;
  isNotFound: boolean;
  isServerError: boolean;
  isNetworkError: boolean;
}

// ---------------------------------------------------------------------------
// Text / block helpers
// ---------------------------------------------------------------------------

export function extractPlainTextFromBlocks(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val)) {
    return val
      .map((block: unknown) => {
        if (!block) return "";
        if (typeof block === "string") return block;
        if (typeof block === "object") {
          const b = block as StrapiBlockNode;
          if (Array.isArray(b.children)) {
            return b.children.map((child) => child?.text || "").join("");
          }
          if (b.text) return b.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  return "";
}

function parseStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item.trim();
        if (typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (
            typeof obj.name === "string" &&
            typeof obj.description === "string" &&
            obj.description.trim()
          ) {
            return `${obj.name.trim()}: ${obj.description.trim()}`;
          }
          const val =
            obj.name ||
            obj.title ||
            obj.area ||
            obj.feature ||
            obj.application ||
            obj.value ||
            obj.text ||
            obj.description;
          return typeof val === "string" ? val.trim() : "";
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseSpecifications(raw: unknown): ProductSpecification[] {
  if (!raw || !Array.isArray(raw)) return [];
  const list: ProductSpecification[] = [];
  for (const item of raw) {
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const label =
        typeof obj.name === "string"
          ? obj.name.trim()
          : typeof obj.label === "string"
          ? obj.label.trim()
          : typeof obj.key === "string"
          ? obj.key.trim()
          : typeof obj.title === "string"
          ? obj.title.trim()
          : typeof obj.parameter === "string"
          ? obj.parameter.trim()
          : "";
      const value =
        typeof obj.value === "string"
          ? obj.value.trim()
          : typeof obj.val === "string"
          ? obj.val.trim()
          : typeof obj.description === "string"
          ? obj.description.trim()
          : typeof obj.detail === "string"
          ? obj.detail.trim()
          : "";
      const group =
        typeof obj.group === "string"
          ? obj.group.trim()
          : typeof obj.category === "string"
          ? obj.category.trim()
          : "";
      if (label && value) {
        list.push({ label, value, group: group || undefined });
      }
    }
  }
  return list;
}

function mapResourceType(
  rawType: string | null | undefined
): CompanyResourceType {
  if (!rawType) return "Company Brochure";
  const lower = rawType.toLowerCase();
  if (
    lower.includes("presentation") ||
    lower.includes("deck") ||
    lower.includes("slide")
  )
    return "Presentation";
  if (lower.includes("catalogue") || lower.includes("catalog"))
    return "Product Catalogue";
  if (
    lower.includes("product brochure") ||
    lower.includes("datasheet") ||
    lower.includes("data sheet")
  )
    return "Product Brochure";
  if (
    lower.includes("spec") ||
    lower.includes("technical") ||
    lower.includes("manual") ||
    lower.includes("guide")
  )
    return "Technical Document";
  if (lower.includes("product") || lower.includes("solution"))
    return "Product Information";
  if (lower.includes("video")) return "Video";
  return "Company Brochure";
}

function mapFileFormat(extOrMime?: string | null): ResourceFileType {
  if (!extOrMime) return "PDF";
  const upper = extOrMime.toUpperCase().replace(".", "").trim();
  if (upper === "PPT" || upper === "PPTX") return upper as ResourceFileType;
  if (upper === "ZIP" || upper === "RAR") return "ZIP";
  if (upper === "PDF") return "PDF";
  if (upper.includes("POWERPOINT") || upper.includes("PRESENTATION"))
    return "PPT";
  if (upper.includes("PDF")) return "PDF";
  return "FILE";
}

function formatFileSize(sizeInKb?: number | string | null): string {
  const num = Number(sizeInKb);
  if (!Number.isFinite(num) || num <= 0) return "PDF Document";
  if (num >= 1024) {
    const mb = num / 1024;
    return `${mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
  }
  return `${Math.round(num)} KB`;
}

// ---------------------------------------------------------------------------
// Base Strapi fetch — returns null on 404, throws on other errors
// ---------------------------------------------------------------------------

/**
 * Fetch from Strapi.
 * - Returns null on 404 (not found / permission issue for company & product).
 * - Throws a StrapiRequestError for 401/403/500+ so the caller can surface
 *   the real failure rather than hiding it behind mock data.
 * - Throws a StrapiRequestError on network errors.
 */
async function fetchFromStrapi<T>(
  endpoint: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  const query = qs.stringify(params, { encodeValuesOnly: true });
  const url = `${STRAPI_BASE.replace(/\/$/, "")}/api/${endpoint}${
    query ? `?${query}` : ""
  }`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (STRAPI_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_TOKEN}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });
  } catch (err) {
    const error: StrapiRequestError = {
      endpoint,
      status: 0,
      message: err instanceof Error ? err.message : "Network error",
      isPermissionError: false,
      isNotFound: false,
      isServerError: false,
      isNetworkError: true,
    };
    console.error(`[Strapi] Network error for ${endpoint}:`, err);
    throw error;
  }

  if (res.ok) {
    return res.json() as Promise<T>;
  }

  // 404 — for company/product this means permissions are not set in Strapi Admin.
  // Return null so the caller decides what to do.
  if (res.status === 404) {
    return null;
  }

  // 401/403 — authentication or permission failure
  // 500+ — server error
  // Throw with full context so the page can surface the real error.
  const error: StrapiRequestError = {
    endpoint,
    status: res.status,
    message: `Strapi returned ${res.status} ${res.statusText} for ${endpoint}`,
    isPermissionError: res.status === 401 || res.status === 403,
    isNotFound: res.status === 404,
    isServerError: res.status >= 500,
    isNetworkError: false,
  };
  console.error(`[Strapi] ${endpoint} → ${res.status} ${res.statusText}`);
  throw error;
}

// ---------------------------------------------------------------------------
// Relation unwrappers
// ---------------------------------------------------------------------------

function unwrapList<T = StrapiRawRecord>(rel: unknown): T[] {
  if (!rel) return [];
  if (Array.isArray(rel)) {
    return rel.map((item) => {
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        return (
          obj.attributes
            ? {
                id: obj.id,
                documentId: obj.documentId,
                ...(obj.attributes as object),
              }
            : obj
        ) as T;
      }
      return item as T;
    });
  }
  if (typeof rel === "object" && rel !== null) {
    const obj = rel as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data.map((item: unknown) => {
        if (typeof item === "object" && item !== null) {
          const itemObj = item as Record<string, unknown>;
          return (
            itemObj.attributes
              ? {
                  id: itemObj.id,
                  documentId: itemObj.documentId,
                  ...(itemObj.attributes as object),
                }
              : itemObj
          ) as T;
        }
        return item as T;
      });
    }
    if (obj.data && typeof obj.data === "object") {
      const single = obj.data as Record<string, unknown>;
      return [
        (single.attributes
          ? {
              id: single.id,
              documentId: single.documentId,
              ...(single.attributes as object),
            }
          : single) as T,
      ];
    }
    return [
      (obj.attributes
        ? { id: obj.id, documentId: obj.documentId, ...(obj.attributes as object) }
        : obj) as T,
    ];
  }
  return [];
}

function unwrapSingle<T = StrapiRawRecord>(rel: unknown): T | null {
  const list = unwrapList<T>(rel);
  return list[0] || null;
}

// ---------------------------------------------------------------------------
// Approval status filter — filters[approval_status][$eq]=approved
// ---------------------------------------------------------------------------

/**
 * Public Marketplace only displays records where approval_status is "approved".
 */


// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

export function normalizeCompany(raw: unknown): MarketplaceCompany {
  const item = (
    typeof raw === "object" && raw !== null ? raw : {}
  ) as Record<string, unknown>;
  const entry = (
    item.attributes && typeof item.attributes === "object"
      ? item.attributes
      : item
  ) as Record<string, unknown>;

  const id = String(entry.documentId || entry.id || entry.slug || "");
  const name = typeof entry.name === "string" ? entry.name : "";
  const slug = (
    typeof entry.slug === "string"
      ? entry.slug
      : name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  ).trim();

  // Verified schema fields: logo (media), shortDescription (text),
  // description (blocks), industries (relation), sectors (relation),
  // companyType (enum), headquarters (string), country (string),
  // state (enum), city (string), founded (integer), listed (boolean),
  // exchange (enum), ticker (string), bseCode (string), website (string),
  // email (email), phone (string), businessAreas (component repeatable),
  // videos (relation), resoucre_centers (relation), products (relation),
  // approval_status (enum), submissionSource (enum).

  const logoUrl = strapiMediaUrl(entry.logo, "", STRAPI_BASE);
  const coverUrl = strapiMediaUrl(
    entry.coverImage || entry.cover_image,
    "",
    STRAPI_BASE
  );

  const shortDesc =
    extractPlainTextFromBlocks(entry.shortDescription) ||
    extractPlainTextFromBlocks(entry.description)?.slice(0, 200) ||
    "";
  const description =
    extractPlainTextFromBlocks(entry.description) || shortDesc;

  const industries = unwrapList(entry.industries);
  const sectors = unwrapList(entry.sectors);
  const industryName =
    typeof industries[0]?.name === "string" ? industries[0].name : "Energy";
  const sectorName =
    typeof sectors[0]?.name === "string"
      ? sectors[0].name
      : "Energy & Infrastructure";

  const city = typeof entry.city === "string" ? entry.city.trim() : "";
  const state = typeof entry.state === "string" ? entry.state.trim() : "";
  const country =
    typeof entry.country === "string" ? entry.country.trim() : "India";
  const locationParts = [city, state, country].filter(Boolean);
  const location = locationParts.length
    ? locationParts.join(", ")
    : typeof entry.headquarters === "string"
    ? entry.headquarters
    : "India";

  const rawType =
    typeof entry.companyType === "string" ? entry.companyType.trim() : "Private";
  const companyType: CompanyType = (
    ["PSU", "Private", "Multinational", "OEM", "Utility", "EPC Contractor"].includes(
      rawType
    )
      ? rawType
      : "Private"
  ) as CompanyType;

  // businessAreas is a repeatable component (schema: business-areas.business-areas)
  // The component has empty attributes in builder but stores a string value.
  // Parse whatever shape Strapi returns.
  const businessAreas = parseStringList(entry.businessAreas);

  const products = unwrapList(entry.products);
  const productIds = products.map((p) =>
    String(p.documentId || p.id || p.slug)
  );

  return {
    id,
    slug,
    name,
    logo: logoUrl,
    coverImage: coverUrl || undefined,
    shortDescription: shortDesc,
    description,
    industry: industryName,
    sector: sectorName,
    subSector: typeof entry.subSector === "string" ? entry.subSector : "",
    companyType,
    location,
    headquarters:
      typeof entry.headquarters === "string" ? entry.headquarters : location,
    founded:
      typeof entry.founded === "number" || typeof entry.founded === "string"
        ? entry.founded
        : "",
    listed: Boolean(entry.listed),
    exchange:
      typeof entry.exchange === "string" ? entry.exchange : undefined,
    ticker: typeof entry.ticker === "string" ? entry.ticker : undefined,
    bseCode: typeof entry.bseCode === "string" ? entry.bseCode : undefined,
    website: typeof entry.website === "string" ? entry.website : "",
    businessAreas,
    productIds,
    relatedCompanyIds: [],
  };
}

export function normalizeProduct(raw: unknown): MarketplaceProduct {
  const item = (
    typeof raw === "object" && raw !== null ? raw : {}
  ) as Record<string, unknown>;
  const entry = (
    item.attributes && typeof item.attributes === "object"
      ? item.attributes
      : item
  ) as Record<string, unknown>;

  const id = String(entry.documentId || entry.id || entry.slug || "");
  const name = typeof entry.name === "string" ? entry.name : "";
  const slug = (
    typeof entry.slug === "string"
      ? entry.slug
      : name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  ).trim();

  // Verified schema fields: name, slug, image (media), shortDescription (text),
  // description (blocks), category (string), subCategory (string),
  // sectors (relation), features (component repeatable), applications (component repeatable),
  // specifications (component repeatable), resoucre_centers (relation), company (relation).

  const imageUrl = strapiMediaUrl(entry.image, "", STRAPI_BASE);

  const shortDesc =
    extractPlainTextFromBlocks(entry.shortDescription) ||
    extractPlainTextFromBlocks(entry.description)?.slice(0, 200) ||
    "";
  const description =
    extractPlainTextFromBlocks(entry.description) || shortDesc;

  const company = unwrapSingle(entry.company);
  const companyId = company
    ? String(company.documentId || company.id || company.slug)
    : "";
  const companyName =
    typeof company?.name === "string" ? company.name : "";
  const companySlug =
    typeof company?.slug === "string" ? company.slug : "";
  const companyLogo = strapiMediaUrl(company?.logo, "", STRAPI_BASE);

  const sectors = unwrapList(entry.sectors);
  const sectorName =
    typeof sectors[0]?.name === "string" ? sectors[0].name : "Energy";

  const features = parseStringList(entry.features);
  const applications = parseStringList(entry.applications);
  const specifications = parseSpecifications(entry.specifications);

  return {
    id,
    slug,
    name,
    image: imageUrl,
    shortDescription: shortDesc,
    description,
    category:
      typeof entry.category === "string" ? entry.category : "Energy Systems",
    subCategory:
      typeof entry.subCategory === "string" ? entry.subCategory : undefined,
    sector: sectorName,
    companyId,
    companySlug,
    companyName,
    companyLogo: companyLogo || undefined,
    features,
    applications,
    specifications,
  };
}

export function normalizeResource(raw: unknown): CompanyResource {
  const item = (
    typeof raw === "object" && raw !== null ? raw : {}
  ) as Record<string, unknown>;
  const entry = (
    item.attributes && typeof item.attributes === "object"
      ? item.attributes
      : item
  ) as Record<string, unknown>;

  const id = String(entry.documentId || entry.id || entry.slug || "");
  const shortTitle =
    typeof entry.short_title === "string"
      ? entry.short_title
      : typeof entry.shortTitle === "string"
      ? entry.shortTitle
      : "";
  const title = (
    typeof entry.full_title === "string"
      ? entry.full_title
      : typeof entry.title === "string"
      ? entry.title
      : shortTitle || "Technical Resource"
  ).trim();
  const slug = (
    typeof entry.slug === "string"
      ? entry.slug
      : title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  ).trim();

  const fileMediaObj = entry.resource_file as Record<string, unknown> | undefined;
  const fileData = fileMediaObj?.data as Record<string, unknown> | undefined;
  const fileMedia = (
    fileData?.attributes ||
    fileMediaObj?.attributes ||
    fileMediaObj ||
    {}
  ) as Record<string, unknown>;

  const fileUrl =
    typeof fileMedia.url === "string"
      ? strapiImageUrl(fileMedia.url, "", STRAPI_BASE)
      : "";
  const fileName =
    typeof fileMedia.name === "string" ? fileMedia.name : `${slug}.pdf`;
  const fileType = mapFileFormat(
    typeof fileMedia.ext === "string"
      ? fileMedia.ext
      : typeof fileMedia.mime === "string"
      ? fileMedia.mime
      : null
  );
  const fileSize = formatFileSize(fileMedia.size as number | string | undefined);

  const coverUrl = strapiMediaUrl(
    entry.cover_image || entry.thumbnail_image,
    "",
    STRAPI_BASE
  );

  const description =
    extractPlainTextFromBlocks(entry.short_description) ||
    extractPlainTextFromBlocks(entry.shortDescription) ||
    extractPlainTextFromBlocks(entry.description) ||
    "";

  const company = unwrapSingle(entry.company);
  const companyId = company
    ? String(company.documentId || company.id || company.slug)
    : "";
  const companySlug =
    typeof company?.slug === "string" ? company.slug : "";

  const product = unwrapSingle(entry.product);
  const productId = product
    ? String(product.documentId || product.id || product.slug)
    : undefined;
  const productName =
    typeof product?.name === "string" ? product.name : undefined;
  const productSlug =
    typeof product?.slug === "string" ? product.slug : undefined;

  const rawPub = entry.publishedAt || entry.createdAt;
  const publishedYear =
    rawPub && typeof rawPub === "string"
      ? new Date(rawPub).getFullYear().toString()
      : entry.year
      ? String(entry.year)
      : undefined;

  return {
    id,
    slug,
    type: mapResourceType(
      typeof entry.resource_type === "string"
        ? entry.resource_type
        : typeof entry.resource_tag === "string"
        ? entry.resource_tag
        : null
    ),
    title,
    description,
    thumbnail: coverUrl || undefined,
    file: fileUrl,
    fileName,
    fileType,
    fileSize,
    date: publishedYear,
    companyId,
    companySlug,
    productId,
    productName,
    productSlug,
  };
}

export function normalizeVideo(raw: unknown): VideoResource {
  const item = (
    typeof raw === "object" && raw !== null ? raw : {}
  ) as Record<string, unknown>;
  const entry = (
    item.attributes && typeof item.attributes === "object"
      ? item.attributes
      : item
  ) as Record<string, unknown>;

  const id = String(entry.documentId || entry.id || entry.slug || "");
  const title = (
    typeof entry.title === "string" ? entry.title : "Video Briefing"
  ).trim();
  const youtubeId =
    typeof entry.youtubeId === "string" ? entry.youtubeId : "";

  const thumbnail =
    strapiMediaUrl(entry.thumbnail, "", STRAPI_BASE) ||
    (youtubeId
      ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
      : "");

  const videoUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : typeof entry.videoUrl === "string"
    ? entry.videoUrl
    : "";

  const description =
    extractPlainTextFromBlocks(entry.Excerpt) ||
    extractPlainTextFromBlocks(entry.description) ||
    "";

  const company = unwrapSingle(entry.company);
  const companyId = company
    ? String(company.documentId || company.id || company.slug)
    : "";
  const companySlug =
    typeof company?.slug === "string" ? company.slug : "";

  return {
    id,
    title,
    description,
    thumbnail,
    videoUrl,
    duration:
      typeof entry.duration === "string" ? entry.duration : "Full HD",
    videoType: "Briefing",
    date:
      typeof entry.date === "string"
        ? new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : undefined,
    companyId,
    companySlug,
  };
}

export function normalizeArticle(raw: unknown): MarketplaceArticle {
  const item = (
    typeof raw === "object" && raw !== null ? raw : {}
  ) as Record<string, unknown>;
  const entry = (
    item.attributes && typeof item.attributes === "object"
      ? item.attributes
      : item
  ) as Record<string, unknown>;

  const id = String(entry.documentId || entry.id || entry.slug || "");
  const title = (
    typeof entry.Title === "string"
      ? entry.Title
      : typeof entry.title === "string"
      ? entry.title
      : "Energy Intelligence"
  ).trim();
  const slug = (
    typeof entry.slug === "string"
      ? entry.slug
      : title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  ).trim();

  const excerpt =
    extractPlainTextFromBlocks(entry.Excerpt) ||
    extractPlainTextFromBlocks(entry.content)?.slice(0, 160) ||
    "";

  const sectors = unwrapList(entry.sectors);
  const category =
    typeof sectors[0]?.name === "string"
      ? sectors[0].name
      : "Energy Intelligence";

  const imageUrl = strapiMediaUrl(
    entry.FeaturedImage || entry.cover,
    "/placeholder.jpg",
    STRAPI_BASE
  );

  const rawDate = entry.Date || entry.publishedAt || entry.createdAt;
  const dateFormatted =
    typeof rawDate === "string"
      ? new Date(rawDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent";

  return {
    id,
    slug,
    title,
    excerpt,
    category,
    date: dateFormatted,
    image: imageUrl,
    readTime: "4 min read",
  };
}

// ---------------------------------------------------------------------------
// Company API — NO fallback to mock data
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Company API — NO fallback to mock data
// ---------------------------------------------------------------------------

/**
 * Fetch all published + approved companies from Strapi.
 *
 * Uses:
 * GET /api/companies?filters[approval_status][$eq]=approved&populate=*
 *
 * NEVER falls back to mock/fixture company data.
 */
export async function getMarketplaceCompanies(): Promise<MarketplaceCompany[]> {
  const params = {
    filters: {
      approval_status: {
        $eq: "approved",
      },
    },
    populate: "*",
    sort: ["name:asc"],
    pagination: { pageSize: 100 },
  };

  let res: StrapiListResponse | null;
  try {
    res = await fetchFromStrapi<StrapiListResponse>("companies", params);
  } catch (err) {
    const e = err as StrapiRequestError;
    console.error(
      `[Marketplace] /api/companies failed — status ${e.status}: ${e.message}`
    );
    return [];
  }

  if (!res || !Array.isArray(res.data) || res.data.length === 0) {
    return [];
  }

  return res.data.map(normalizeCompany).filter((c) => c.name && c.slug);
}

/**
 * Fetch a single company by slug from Strapi.
 *
 * Uses:
 * GET /api/companies?filters[slug][$eq]=<slug>&filters[approval_status][$eq]=approved&populate=*
 *
 * Returns null when the company is not found or not approved.
 * NEVER falls back to mock company data.
 */
export async function getMarketplaceCompanyBySlug(
  slug: string
): Promise<MarketplaceCompany | null> {
  const cleanSlug = (slug || "").trim().toLowerCase();
  if (!cleanSlug) return null;

  const params = {
    filters: {
      slug: { $eq: cleanSlug },
      approval_status: { $eq: "approved" },
    },
    populate: "*",
    pagination: { pageSize: 1 },
  };

  let res: StrapiListResponse | null;
  try {
    res = await fetchFromStrapi<StrapiListResponse>("companies", params);
  } catch (err) {
    const e = err as StrapiRequestError;
    console.error(
      `[Marketplace] /api/companies/${cleanSlug} failed — status ${e.status}: ${e.message}`
    );
    return null;
  }

  if (!res || !Array.isArray(res.data) || res.data.length === 0) {
    return null;
  }

  return normalizeCompany(res.data[0]);
}

// ---------------------------------------------------------------------------
// Product API — NO fallback to mock data
// ---------------------------------------------------------------------------

/**
 * Fetch all published products from Strapi.
 *
 * Product does not have the companies-only `approval_status` field. The
 * public Strapi REST API returns its published products by default, so do not
 * send an unsupported filter merely to probe the schema.
 *
 * Currently returns [] gracefully as production has 0 products.
 * NEVER falls back to mock/fixture product data.
 */
export async function getMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const params = {
    populate: "*",
    sort: ["name:asc"],
    pagination: { pageSize: 100 },
  };

  let res: StrapiListResponse | null = null;
  try {
    res = await fetchFromStrapi<StrapiListResponse>("products", params);
  } catch (err) {
    const e = err as StrapiRequestError;
    console.error(
      `[Marketplace] /api/products failed — status ${e.status}: ${e.message}`
    );
    return [];
  }

  if (!res || !Array.isArray(res.data) || res.data.length === 0) {
    return [];
  }

  return res.data.map(normalizeProduct).filter((p) => p.name && p.slug);
}

/**
 * Fetch a single published product by slug from Strapi.
 * Product does not use the companies-only approval_status field.
 * Returns null when no matching product is found.
 * NEVER falls back to mock product data.
 */
export async function getMarketplaceProductBySlug(
  slug: string
): Promise<MarketplaceProduct | null> {
  const cleanSlug = (slug || "").trim().toLowerCase();
  if (!cleanSlug) return null;

  const params = {
    filters: {
      slug: { $eq: cleanSlug },
    },
    populate: "*",
    pagination: { pageSize: 1 },
  };

  let res: StrapiListResponse | null = null;
  try {
    res = await fetchFromStrapi<StrapiListResponse>("products", params);
  } catch (err) {
    const e = err as StrapiRequestError;
    console.error(
      `[Marketplace] /api/products/${cleanSlug} failed — status ${e.status}: ${e.message}`
    );
    return null;
  }

  if (!res || !Array.isArray(res.data) || res.data.length === 0) {
    return null;
  }

  return normalizeProduct(res.data[0]);
}

/**
 * Fetch products by company slug from Strapi.
 * NEVER falls back to mock product data.
 */
export async function getMarketplaceProductsByCompanySlug(
  companySlug: string,
  attachedProductIds: string[] = []
): Promise<MarketplaceProduct[]> {
  const cleanSlug = (companySlug || "").trim().toLowerCase();
  if (!cleanSlug) return [];

  const params = {
    filters: { company: { slug: { $eq: cleanSlug } } },
    populate: "*",
    pagination: { pageSize: 50 },
  };

  let res: StrapiListResponse | null = null;
  try {
    res = await fetchFromStrapi<StrapiListResponse>("products", params);
  } catch (err) {
    const e = err as StrapiRequestError;
    console.error(
      `[Marketplace] /api/products?company.slug=${cleanSlug} failed — status ${e.status}: ${e.message}`
    );
  }

  const directProducts = Array.isArray(res?.data)
    ? res.data.map(normalizeProduct).filter((p) => p.name && p.slug)
    : [];

  // The public directory supports both sides of the Strapi relation. Some
  // vendor records have products attached from the Company entry, while the
  // corresponding Product's company relation may not be populated yet.
  const relationIds = new Set(
    attachedProductIds.map((id) => String(id).trim().toLowerCase()).filter(Boolean)
  );

  if (relationIds.size === 0) return directProducts;

  const attachedProducts = (await getMarketplaceProducts()).filter(
    (product) =>
      relationIds.has(product.id.toLowerCase()) ||
      relationIds.has(product.slug.toLowerCase())
  );

  return Array.from(
    new Map(
      [...directProducts, ...attachedProducts].map((product) => [product.id, product])
    ).values()
  );
}

// ---------------------------------------------------------------------------
// Resource Centers — /api/resoucre-centers is live (200 OK)
// Fallback to fixture data only for resources/videos (not company/product).
// ---------------------------------------------------------------------------

export async function getMarketplaceCompanyResources(
  companySlug: string
): Promise<CompanyResource[]> {
  const cleanSlug = (companySlug || "").trim().toLowerCase();
  if (!cleanSlug) return [];

  const params = {
    filters: { company: { slug: { $eq: cleanSlug } } },
    populate: [
      "resource_file",
      "cover_image",
      "thumbnail_image",
      "company",
      "product",
      "sectors",
    ],
    sort: ["publishedAt:desc"],
    pagination: { pageSize: 100 },
  };

  try {
    const res = await fetchFromStrapi<StrapiListResponse>(
      "resoucre-centers",
      params
    );
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      const list = res.data.map(normalizeResource).filter((r) => r.title);
      if (list.length > 0) return list;
    }
  } catch {
    // Resource centers endpoint is live; log silently and fallback
  }
  return getFallbackResourcesByCompanySlug(cleanSlug);
}

export async function getMarketplaceProductResources(
  productSlug: string
): Promise<CompanyResource[]> {
  const cleanSlug = (productSlug || "").trim().toLowerCase();
  if (!cleanSlug) return [];

  const params = {
    filters: { product: { slug: { $eq: cleanSlug } } },
    populate: [
      "resource_file",
      "cover_image",
      "thumbnail_image",
      "company",
      "product",
      "sectors",
    ],
    sort: ["publishedAt:desc"],
    pagination: { pageSize: 50 },
  };

  try {
    const res = await fetchFromStrapi<StrapiListResponse>(
      "resoucre-centers",
      params
    );
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      const list = res.data.map(normalizeResource).filter((r) => r.title);
      if (list.length > 0) return list;
    }
  } catch {
    // silent
  }
  return getFallbackResourcesByProductSlug(cleanSlug);
}

export async function getMarketplaceCompanyVideos(
  companySlug: string,
  companyName?: string
): Promise<VideoResource[]> {
  const cleanSlug = (companySlug || "").trim().toLowerCase();
  if (!cleanSlug) return [];

  try {
    const res = await fetchFromStrapi<StrapiListResponse>("videos", {
      filters: { company: { slug: { $eq: cleanSlug } } },
      populate: ["thumbnail", "company", "sectors"],
      sort: ["publishedAt:desc"],
      pagination: { pageSize: 20 },
    });
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      const list = res.data
        .map(normalizeVideo)
        .filter((v) => v.title && v.videoUrl);
      if (list.length > 0) return list;
    }
  } catch {
    // silent
  }

  // Attempt 2: match by company name in video title
  if (companyName && companyName.length > 2) {
    try {
      const res = await fetchFromStrapi<StrapiListResponse>("videos", {
        filters: { title: { $containsi: companyName } },
        populate: ["thumbnail", "company", "sectors"],
        sort: ["publishedAt:desc"],
        pagination: { pageSize: 10 },
      });
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data
          .map(normalizeVideo)
          .filter((v) => v.title && v.videoUrl);
        if (list.length > 0) return list;
      }
    } catch {
      // silent
    }
  }

  return getFallbackVideosByCompanySlug(cleanSlug);
}

// ---------------------------------------------------------------------------
// Articles — /api/contents is live (200 OK)
// ---------------------------------------------------------------------------

export async function getMarketplaceArticlesFromStrapi(
  limit = 4
): Promise<MarketplaceArticle[]> {
  try {
    const res = await fetchFromStrapi<StrapiListResponse>("contents", {
      sort: ["publishedAt:desc", "Date:desc"],
      pagination: { pageSize: limit },
      populate: ["FeaturedImage", "sectors", "author"],
    });
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      const list = res.data
        .map(normalizeArticle)
        .filter((a) => a.title && a.slug);
      if (list.length > 0) return list;
    }
  } catch {
    // silent
  }
  return getFallbackArticles(limit);
}

// ---------------------------------------------------------------------------
// Convenience helpers used by pages
// ---------------------------------------------------------------------------

export async function getMarketplaceFeaturedCompanies(
  limit = 5
): Promise<MarketplaceCompany[]> {
  const all = await getMarketplaceCompanies();
  return all.slice(0, limit);
}

export async function getMarketplaceFeaturedProducts(
  limit = 5
): Promise<MarketplaceProduct[]> {
  const all = await getMarketplaceProducts();
  return all.slice(0, limit);
}

export async function getMarketplaceRelatedCompanies(
  company: MarketplaceCompany,
  limit = 4
): Promise<MarketplaceCompany[]> {
  const all = await getMarketplaceCompanies();
  const sameSector = all
    .filter(
      (c) =>
        (c.sector === company.sector || c.industry === company.industry) &&
        c.id !== company.id
    )
    .slice(0, limit);
  return sameSector;
}

export async function getMarketplaceRelatedProducts(
  product: MarketplaceProduct,
  limit = 4
): Promise<MarketplaceProduct[]> {
  const all = await getMarketplaceProducts();
  return all
    .filter(
      (p) =>
        (p.category === product.category || p.sector === product.sector) &&
        p.id !== product.id
    )
    .slice(0, limit);
}
