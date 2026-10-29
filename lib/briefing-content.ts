import { buildContentUrl } from "./content-routes";
import { strapiImageUrl } from "./strapi-image";
import { getBriefingWindow, getDailyBriefingClock, type BriefingFrequency } from "./daily-briefing-rules";
import type { DigestItem, DigestSection } from "./briefing-types";

const CMS = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const APP = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
    if (Array.isArray(value)) return record(value[0]);
    if (!value || typeof value !== "object") return {};
    const source = value as RecordValue;
    if ("data" in source) return record(source.data);
    if ("attributes" in source) return { ...source, ...record(source.attributes) };
    return source;
}

function plain(value: unknown): string {
    if (!value || typeof value !== "object" && typeof value !== "string") return "";
    if (typeof value === "string") return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (Array.isArray(value)) return value.map(plain).filter(Boolean).join(" ");
    const node = record(value);
    return typeof node.text === "string" ? node.text : node.children ? plain(node.children) : "";
}

/** Use the original upload, before Strapi thumbnail renditions that may be cropped. */
export function briefingImage(media: unknown): { imageUrl: string | null; imageWidth?: number; imageHeight?: number } {
    const image = record(media);
    return {
        imageUrl: typeof image.url === "string" ? strapiImageUrl(image.url) : null,
        imageWidth: typeof image.width === "number" ? image.width : undefined,
        imageHeight: typeof image.height === "number" ? image.height : undefined,
    };
}

export function normalizeBriefingContent(raw: unknown, cutoff: Date): DigestItem | null {
    const item = record(raw);
    // No createdAt/updatedAt/Date fallback: only real, published CMS records qualify.
    if (!item.publishedAt || item.deletedAt || item.isDeleted === true || item.deleted === true ||
        item.status === "draft" || item.status === "unpublished" || item.locale && item.locale !== (process.env.BRIEFING_LOCALE || "en")) return null;
    const publishedAt = new Date(String(item.firstPublishedAt || item.publishedAt));
    const currentPublication = new Date(String(item.publishedAt));
    if (!Number.isFinite(publishedAt.getTime()) || !Number.isFinite(currentPublication.getTime()) || publishedAt > cutoff || currentPublication > cutoff) return null;
    const type = record(item.type_of_content);
    const typeName = String(type.name || type.Name || "").trim();
    const tag = record(item.content_tag);
    const contentTag = String(tag.title || tag.Title || "").trim().toLowerCase();
    const normalized = typeName.toLowerCase();
    const featuredType = ["article", "articles"].includes(normalized) ? "article"
        : ["interview", "interviews"].includes(normalized) || normalized === "opinion" && contentTag === "interview" ? "interview"
            : ["opinion", "opinions"].includes(normalized) ? "opinion" : undefined;
    if (normalized !== "news" && !featuredType) return null;
    if (!item.slug || !item.Title || (item.documentId === undefined && item.id === undefined)) return null;
    const author = record(item.author);
    return {
        key: `content:${item.documentId || item.id}`,
        title: String(item.Title),
        href: new URL(buildContentUrl({ slug: String(item.slug), contentType: normalized === "articles" || normalized === "article" ? "articles" : normalized === "interviews" ? "interview" : normalized === "opinions" ? "opinion" : typeName, content_tag: item.content_tag }), APP).toString(),
        crispLine: plain(item.Excerpt) || `Latest ${typeName.toLowerCase()} update from ENERGDIVE.`,
        ...briefingImage(item.FeaturedImage),
        publishedAt, sortAt: publishedAt, badge: typeName,
        formats: normalized === "news" ? ["News Briefing"] : featuredType === "article" ? ["Insights"] : ["Opinion"],
        featuredType, contentTag, publisher: String(author.name || "ENERGDIVE Editorial"),
        editorialPriority: typeof item.priority === "number" && Number.isFinite(item.priority) ? item.priority : undefined,
    };
}

/** Exhaust pagination, including servers that cap the requested page size. */
export async function fetchBriefingContents(cutoff: Date, newsSince?: Date, validation?: { keys: string[]; newsSince: Date }): Promise<DigestItem[]> {
    const url = new URL(`${CMS}/api/contents`);
    url.searchParams.set("status", "published");
    url.searchParams.set("filters[publishedAt][$notNull]", "true");
    url.searchParams.set("filters[publishedAt][$lte]", cutoff.toISOString());
    if (newsSince) {
        url.searchParams.set("filters[publishedAt][$gte]", newsSince.toISOString());
        url.searchParams.set("filters[type_of_content][name][$eqi]", "News");
    }
    // Most editions have a small validation set. Read their saved items plus
    // ALL today's News in one fresh query, rather than downloading the entire
    // historical catalogue for every recipient. Large sets fall back to the
    // paginated catalogue, avoiding URL length limits without dropping stories.
    if (validation && validation.keys.length <= 30) {
        const documents = validation.keys.filter(key => !/^content:\d+$/.test(key));
        const ids = validation.keys.filter(key => /^content:\d+$/.test(key));
        let group = 0;
        for (const [field, keys] of [["documentId", documents], ["id", ids]] as const) {
            if (!keys.length) continue;
            keys.forEach((key, index) => url.searchParams.set(`filters[$or][${group}][${field}][$in][${index}]`, key.slice(8)));
            group++;
        }
        url.searchParams.set(`filters[$or][${group}][$and][0][type_of_content][name][$eqi]`, "News");
        url.searchParams.set(`filters[$or][${group}][$and][1][publishedAt][$gte]`, validation.newsSince.toISOString());
    }
    url.searchParams.set("sort[0]", "publishedAt:desc");
    url.searchParams.set("sort[1]", "id:asc");
    ["FeaturedImage", "type_of_content", "content_tag", "author"].forEach((field, index) => url.searchParams.set(`populate[${index}]`, field));
    url.searchParams.set("pagination[pageSize]", "100");
    const items = new Map<string, DigestItem>();
    let priorSignature = "";
    for (let page = 1; ; page++) {
        url.searchParams.set("pagination[page]", String(page));
        const response = await fetch(url, { headers: process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}, cache: "no-store" });
        if (!response.ok) throw new Error(`Briefing CMS fetch failed (${response.status})`);
        const payload = await response.json();
        if (!Array.isArray(payload.data)) throw new Error("Invalid briefing CMS collection");
        const rows: unknown[] = payload.data;
        const signature = JSON.stringify(rows.map(raw => { const item = record(raw); return item.documentId || item.id; }));
        if (rows.length && signature === priorSignature) throw new Error("CMS pagination did not advance; refusing an incomplete edition");
        priorSignature = signature;
        for (const row of rows) {
            const item = normalizeBriefingContent(row, cutoff);
            if (item && (!newsSince || item.badge.toLowerCase() === "news" && item.publishedAt >= newsSince)) {
                const existing = items.get(item.key);
                if (!existing || item.publishedAt > existing.publishedAt) items.set(item.key, item);
            }
        }
        const pagination = payload.meta?.pagination;
        if (pagination?.pageCount !== undefined ? page >= pagination.pageCount : rows.length === 0) break;
    }
    return [...items.values()].sort(publicationOrder);
}

export function publicationOrder(a: DigestItem, b: DigestItem): number {
    return b.publishedAt.getTime() - a.publishedAt.getTime() || a.key.localeCompare(b.key);
}

export function buildBriefingSections(catalog: DigestItem[], frequency: BriefingFrequency, now: Date, events: DigestItem[] = []): DigestSection[] {
    const { start, cutoff } = getBriefingWindow(frequency, now);
    const news = [...new Map(catalog.filter(item => item.badge.trim().toLowerCase() === "news" && item.publishedAt >= start && item.publishedAt <= cutoff).map(item => [item.key, item])).values()].sort(publicationOrder);
    const byDay = new Map<string, DigestItem>();
    for (const item of news) {
        const day = getDailyBriefingClock(item.publishedAt).dateKey;
        const current = byDay.get(day);
        if (!current || (item.editorialPriority ?? -Infinity) > (current.editorialPriority ?? -Infinity)) byDay.set(day, item);
    }
    return [
        { format: "News Briefing", items: frequency === "weekly" ? [...byDay.values()] : news },
        { format: "Upcoming Events", items: events.filter(item => item.publishedAt <= cutoff).sort((a, b) => a.sortAt.getTime() - b.sortAt.getTime()).slice(0, 3) },
    ].filter(section => section.items.length) as DigestSection[];
}

function hash(value: string): number {
    let result = 2166136261;
    for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
    return result >>> 0;
}

export function selectFeatured(catalog: DigestItem[], dateKey: string, previous: string[] = [], count = 3): DigestItem[] {
    const pool = [...new Map(catalog.filter(item => item.featuredType).map(item => [item.key, item])).values()];
    const order = (a: DigestItem, b: DigestItem) => Number(previous.includes(a.key)) - Number(previous.includes(b.key)) || hash(`${dateKey}:${a.key}`) - hash(`${dateKey}:${b.key}`) || a.key.localeCompare(b.key);
    pool.sort(order);
    const selected: DigestItem[] = [];
    for (const kind of ["article", "interview", "opinion"]) {
        const item = pool.find(item => item.featuredType === kind);
        if (item && selected.length < count) selected.push(item);
    }
    for (const item of pool) if (selected.length < count && !selected.some(chosen => chosen.key === item.key)) selected.push(item);
    // When diversity constraints picked yesterday's exact set, swap in a new
    // eligible item while retaining every available type when possible.
    const spare = pool.find(item => !selected.some(chosen => chosen.key === item.key));
    if (spare && selected.length === previous.length && selected.every(item => previous.includes(item.key))) {
        const index = selected.findIndex(item => item.featuredType === spare.featuredType);
        if (index >= 0) selected[index] = spare;
    }
    selected.sort((a, b) => hash(`${dateKey}:order:${a.key}`) - hash(`${dateKey}:order:${b.key}`) || a.key.localeCompare(b.key));
    if (selected.length > 1 && selected.every((item, index) => item.key === previous[index])) selected.push(selected.shift()!);
    return selected;
}
