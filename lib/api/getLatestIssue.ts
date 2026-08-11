import { buildContentUrl } from "@/lib/content-routes";
import { formatContentDate } from "@/lib/date";
import { strapiMediaUrl } from "@/lib/strapi-image";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const CMS_REQUEST_TIMEOUT_MS = 10_000;

type StrapiIssueItem = {
    id?: number | string;
    documentId?: string;
    slug?: string | null;
    Month?: string | null;
    Year?: number | string | null;
    Title?: string | null;
    Date?: string | null;
    publishedAt?: string | null;
    createdAt?: string | null;
    CoverImage?: unknown;
    contents?: unknown[];
};

type StrapiRecord = Record<string, unknown> & {
    attributes?: unknown;
    data?: unknown;
};

export type IssueArticleData = {
    id: string;
    title: string;
    excerpt: string;
    authorName: string;
    image: string;
    href: string;
    section: string;
    date?: string;
};

export type LatestIssueData = {
    slug: string;
    title: string;
    month: string;
    year: string;
    coverImage: string;
    articles?: IssueArticleData[];
};

export function toIssueSlug(month: string, year: string, fallbackId: unknown): string {
    if (!month || !year) return String(fallbackId ?? "").trim();

    const monthPart = month
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `${monthPart}-${year}`;
}

function isRecord(value: unknown): value is StrapiRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAttributes(item: unknown): StrapiRecord {
    if (!isRecord(item)) return {};

    return isRecord(item.attributes)
        ? { ...item, ...item.attributes }
        : item;
}

function fieldToString(record: StrapiRecord, keys: string[]): string {
    for (const key of keys) {
        const value = record[key];
        if ((typeof value === "string" || typeof value === "number") && String(value).trim()) {
            return String(value).trim();
        }
    }

    return "";
}

function relationTitle(relation: unknown, keys: string[]): string {
    if (!relation) return "";

    if (Array.isArray(relation)) {
        return relationTitle(relation[0], keys);
    }

    const relationRecord = getAttributes(relation);
    const data = relationRecord.data;
    const item = data ? (Array.isArray(data) ? data[0] : data) : relationRecord;

    return fieldToString(getAttributes(item), keys);
}

function textFromBlocks(value: unknown): string {
    if (typeof value === "string") return value;
    if (!Array.isArray(value)) return "";

    return value
        .map((block) => {
            const blockRecord = getAttributes(block);
            const children = Array.isArray(blockRecord.children) ? blockRecord.children : [];

            return children
                .map((child) => {
                    const childRecord = getAttributes(child);
                    return typeof childRecord.text === "string" ? childRecord.text : "";
                })
                .join("")
        })
        .filter(Boolean)
        .join(" ");
}

function excerptFromContent(content: StrapiRecord): string {
    const raw =
        textFromBlocks(content.Excerpt) ||
        textFromBlocks(content.ShortDescription) ||
        textFromBlocks(content.Description) ||
        textFromBlocks(content.excerpt) ||
        textFromBlocks(content.description);

    return raw.replace(/\s+/g, " ").trim().slice(0, 170);
}

function sectionFromContent(content: StrapiRecord): string {
    return (
        relationTitle(content.content_tag, ["title", "Title", "name", "Name"]) ||
        relationTitle(content.type_of_content, ["name", "Name", "title", "Title"]) ||
        "Feature"
    );
}

function normalizeArticle(item: unknown): IssueArticleData | null {
    const content = getAttributes(item || {});
    const title = fieldToString(content, ["Title", "title"]);
    if (!title) return null;

    const slug = fieldToString(content, ["slug", "documentId", "id"]);
    const href = slug
        ? buildContentUrl({
            slug,
            type_of_content: content.type_of_content,
            content_tag: content.content_tag,
        })
        : "/news";

    return {
        id: fieldToString(content, ["id", "documentId"]) || slug || title,
        title,
        excerpt: excerptFromContent(content),
        authorName: relationTitle(content.author || content.Author, ["name", "Name"]) || "Team ENERGDIVE",
        image: strapiMediaUrl(content.FeaturedImage || content.featuredImage, "/magazine-default.jpg"),
        href,
        section: sectionFromContent(content),
        date: formatContentDate(fieldToString(content, ["Date", "publishedAt", "createdAt"])),
    };
}

function normalizeIssue(item: StrapiIssueItem): LatestIssueData | null {
    const issue = getAttributes(item || {});
    const month = fieldToString(issue, ["Month"]);
    const year = fieldToString(issue, ["Year"]);
    const slugFromApi = fieldToString(issue, ["slug"]);
    const slug = slugFromApi || toIssueSlug(month, year, issue.id || issue.documentId);

    if (!slug) return null;

    const titleFromApi = fieldToString(issue, ["Title"]);
    const title = titleFromApi || [month, year].filter(Boolean).join(" ").trim() || "Latest Issue";
    const contents = Array.isArray(issue.contents) ? issue.contents : [];
    const articles = contents
        .map(normalizeArticle)
        .filter((article): article is IssueArticleData => Boolean(article))
        .slice(0, 6);

    return {
        slug,
        title,
        month,
        year,
        coverImage: strapiMediaUrl(
            issue.CoverImage || issue.coverImage || issue.cover_image,
            "/current-magazine.jpg"
        ),
        articles,
    };
}

function issuePopulateParams(withArticles: boolean): string {
    if (!withArticles) return "populate[0]=CoverImage&fields[0]=Month&fields[1]=Year&fields[2]=slug&fields[3]=Title";

    return [
        "populate[0]=CoverImage",
        "populate[1]=contents",
        "populate[2]=contents.type_of_content",
        "populate[3]=contents.author",
        "populate[4]=contents.FeaturedImage",
        "populate[5]=contents.content_tag",
        "fields[0]=Month",
        "fields[1]=Year",
        "fields[2]=slug",
        "fields[3]=Title",
        "pagination[pageSize]=1",
    ].join("&");
}

async function fetchLatestIssueResponse(withArticles: boolean, currentOnly: boolean): Promise<Response> {
    const currentFilter = currentOnly ? "&filters[is_current_issue][$eq]=true" : "";

    return fetch(
        `${STRAPI_BASE_URL}/api/issues?${issuePopulateParams(withArticles)}${currentFilter}&sort=createdAt:desc&pagination[limit]=1`,
        { next: { revalidate: 3600 } }
    );
}

async function getLatestIssueData(withArticles: boolean): Promise<LatestIssueData | null> {
    try {
        let res = await fetchLatestIssueResponse(withArticles, true);

        if (!res.ok) {
            res = await fetchLatestIssueResponse(withArticles, false);
        }

        if (!res.ok) return null;

        let json = (await res.json()) as { data?: StrapiIssueItem[] };
        let item = json.data?.[0];

        if (!item) {
            res = await fetchLatestIssueResponse(withArticles, false);
            if (!res.ok) return null;
            json = (await res.json()) as { data?: StrapiIssueItem[] };
            item = json.data?.[0];
        }

        return item ? normalizeIssue(item) : null;
    } catch (e) {
        if (!(e instanceof Error && e.name === "TimeoutError")) {
            console.error("Failed to fetch latest issue from Strapi:", e);
        }
        return null;
    }
}

export async function getLatestIssue(): Promise<LatestIssueData | null> {
    return getLatestIssueData(false);
}

export async function getLatestIssueWithArticles(): Promise<LatestIssueData | null> {
    return getLatestIssueData(true);
}
