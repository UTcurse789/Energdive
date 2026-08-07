import { query } from "@/lib/db";
import { DigestFormat, DigestFrequency, DIGEST_FORMAT_OPTIONS, isDigestFormat, isDigestFrequency } from "@/lib/digest-preferences";
import { buildContentUrl, extractContentTypeName } from "@/lib/content-routes";
import { appendEmailAdUtm, isDailyBriefingAdImageAllowed, sendPreferenceDigestEmail } from "@/lib/email";
import { strapiMediaUrl } from "@/lib/strapi-image";
import { getAdvertisements, getAdImageUrl } from "@/lib/api/getAdvertisements";
import { loadPublicEnergJobs } from "@/lib/energjob-public";
import { getLatestIssue } from "@/lib/api/getLatestIssue";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const INSIGHT_CONTENT_TYPES = new Set([
    "analysis",
    "article",
    "articles",
    "featured stories",
    "featured story",
    "feature",
    "editorial",
    "cover story",
]);

const CASE_STUDY_CONTENT_TYPES = new Set([
    "case study",
    "reports",
    "report",
]);

const DEFAULT_TEST_FORMATS: DigestFormat[] = [
    "News Briefing",
    "Opinion",
    "Insights",
];

type DigestLogStatus = "sent" | "failed" | "preview";

interface DigestCandidateRow {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    preferred_frequency: string | null;
    preferred_formats: string[] | null;
    last_content_digest_sent_at: string | null;
}

export interface DigestItem {
    key: string;
    title: string;
    href: string;
    crispLine: string;
    imageUrl: string | null;
    publishedAt: Date;
    sortAt: Date;
    badge: string;
    formats: DigestFormat[];
    publisher?: string;
    eventDate?: string | null;
    eventVenue?: string | null;
    eventDescription?: string | null;
    contentTag?: string;
}

export interface DigestSection {
    format: DigestFormat;
    items: DigestItem[];
}

interface ProcessDigestsOptions {
    email?: string;
    limit?: number;
}

export interface ProcessDigestsResult {
    success: boolean;
    processed: number;
    due: number;
    sent: number;
    skipped: number;
    errors: number;
    results: Array<{
        email: string;
        status: "sent" | "skipped" | "failed";
        reason?: string;
        items?: number;
    }>;
}

export interface PreviewDigestOptions {
    email: string;
    firstName?: string;
    frequency?: DigestFrequency;
    formats?: DigestFormat[];
    /** Test-only escape hatch. Scheduled subscriber sends always require two Top News items. */
    allowInsufficientTopNews?: boolean;
}

export interface PreviewDigestResult {
    success: boolean;
    email: string;
    items: number;
    formats: DigestFormat[];
    frequency: DigestFrequency;
}

interface RichTextChild {
    text?: string;
}

interface RichTextBlock {
    children?: RichTextChild[];
}

interface ContentTagRecord {
    title?: string;
    Title?: string;
}

interface ContentTagShape {
    data?: {
        attributes?: ContentTagRecord;
    };
}

interface StrapiDigestContent {
    id: number | string;
    Title?: string;
    slug?: string;
    Excerpt?: unknown;
    FeaturedImage?: unknown;
    type_of_content?: unknown;
    content_tag?: unknown;
    publishedAt?: string;
    Date?: string;
    createdAt?: string;
    author?: { name?: string } | { data?: { attributes?: { name?: string } } } | null;
}

interface StrapiDigestEvent {
    id: number | string;
    title?: string;
    slug?: string;
    url?: string;
    description?: unknown;
    image?: unknown;
    occurrence?: string;
    date?: string;
    location?: string;
    venue?: string;
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface DigestEmailCandidate {
    id: number;
    userIds: number[];
    email: string;
    first_name: string | null;
    preferred_frequency: string | null;
    preferred_formats: string[] | null;
    last_content_digest_sent_at: string | null;
}

function getStrapiHeaders(): HeadersInit {
    return STRAPI_TOKEN
        ? { Authorization: `Bearer ${STRAPI_TOKEN}` }
        : {};
}

function toAbsoluteUrl(path: string): string {
    return new URL(path, APP_URL).toString();
}

function shiftToIst(date: Date): Date {
    return new Date(date.getTime() + IST_OFFSET_MS);
}

function shiftFromIst(date: Date): Date {
    return new Date(date.getTime() - IST_OFFSET_MS);
}

function getStartOfIstDay(date: Date): Date {
    const ist = shiftToIst(date);
    const start = new Date(Date.UTC(
        ist.getUTCFullYear(),
        ist.getUTCMonth(),
        ist.getUTCDate(),
        0,
        0,
        0,
        0
    ));
    return shiftFromIst(start);
}

function getStartOfIstWeek(date: Date): Date {
    const ist = shiftToIst(date);
    const day = ist.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(Date.UTC(
        ist.getUTCFullYear(),
        ist.getUTCMonth(),
        ist.getUTCDate() - diffToMonday,
        0,
        0,
        0,
        0
    ));
    return shiftFromIst(start);
}

function getStartOfIstMonth(date: Date): Date {
    const ist = shiftToIst(date);
    const start = new Date(Date.UTC(
        ist.getUTCFullYear(),
        ist.getUTCMonth(),
        1,
        0,
        0,
        0,
        0
    ));
    return shiftFromIst(start);
}

function isDigestDue(frequency: DigestFrequency, lastSentAt: Date | null, now: Date): boolean {
    if (!lastSentAt) {
        return true;
    }

    if (frequency === "daily") {
        return lastSentAt < getStartOfIstDay(now);
    }
    if (frequency === "weekly") {
        return lastSentAt < getStartOfIstWeek(now);
    }
    return lastSentAt < getStartOfIstMonth(now);
}

function getInitialLookbackStart(frequency: DigestFrequency, now: Date): Date {
    if (frequency === "daily") {
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    if (frequency === "weekly") {
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
}

function normalizeFrequency(value: string | null | undefined): DigestFrequency {
    const lowered = (value || "").trim().toLowerCase();
    return isDigestFrequency(lowered) ? lowered : "daily";
}

function normalizeFormats(values: string[] | null | undefined): DigestFormat[] {
    if (!Array.isArray(values)) {
        return [];
    }

    const unique = new Set<DigestFormat>();
    for (const value of values) {
        if (isDigestFormat(value)) {
            unique.add(value);
        }
    }

    return Array.from(unique);
}

function extractPlainText(value: unknown): string {
    if (typeof value === "string") {
        return value.trim();
    }

    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .map((block) => {
            const richBlock = block as RichTextBlock;
            return Array.isArray(richBlock?.children)
                ? richBlock.children.map((child) => child?.text || "").join("")
                : "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function truncate(value: string, max = 150): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= max) {
        return normalized;
    }
    return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function getContentTagTitle(contentTag: unknown): string {
    if (Array.isArray(contentTag)) {
        const first = contentTag[0] as ContentTagRecord | undefined;
        return first?.title || first?.Title || "";
    }
    const tag = contentTag as (ContentTagRecord & ContentTagShape) | null;
    return tag?.title || tag?.Title || tag?.data?.attributes?.title || "";
}

function getAuthorName(author: StrapiDigestContent["author"]): string {
    if (!author) return "ENERGDIVE Editorial";
    if ("name" in author && author.name?.trim()) return author.name.trim();
    if ("data" in author && author.data?.attributes?.name?.trim()) {
        return author.data.attributes.name.trim();
    }
    return "ENERGDIVE Editorial";
}

function parseEventSortDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    // Replace various dashes with standard hyphen
    const normalized = value
        .trim()
        .replace(/[\u2013\u2014\u2015]/g, "-")
        .replace(/(\d{1,2})(st|nd|rd|th)/gi, "$1")
        .replace(/\s+/g, " ");

    if (!normalized) {
        return null;
    }

    const nativeDate = new Date(normalized);
    if (!Number.isNaN(nativeDate.getTime())) {
        return nativeDate;
    }

    const lowered = normalized.toLowerCase();
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIndex = months.findIndex((month) => lowered.includes(month));
    if (monthIndex === -1) {
        return null;
    }

    const reference = new Date(); // Use local year as fallback
    const yearMatch = lowered.match(/\b(20\d{2})\b/);
    const dayMatch = lowered.match(/\b(\d{1,2})\b/);
    const year = yearMatch ? Number(yearMatch[1]) : reference.getFullYear();
    const day = dayMatch ? Number(dayMatch[1]) : 1;
    
    // Create date in local time for parsing, then convert to start of day
    const candidate = new Date(year, monthIndex, day, 0, 0, 0, 0);

    return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function mapFormatsForContent(item: StrapiDigestContent): DigestFormat[] {
    const typeName = extractContentTypeName(item.type_of_content).toLowerCase();
    const formats: DigestFormat[] = [];

    if (typeName === "news") {
        formats.push("News Briefing");
    }

    // Interviews are stored as Opinion content with an Interview tag. Keep
    // both in the catalogue so the briefing can rotate one editorial pick.
    if (typeName === "opinion") {
        formats.push("Opinion");
    }

    if (INSIGHT_CONTENT_TYPES.has(typeName)) {
        formats.push("Insights");
    }

    if (CASE_STUDY_CONTENT_TYPES.has(typeName)) {
        formats.push("Case Study & Technical Papers");
    }

    return formats;
}

function normalizeContentItem(item: StrapiDigestContent): DigestItem | null {
    const formats = mapFormatsForContent(item);
    if (formats.length === 0) {
        return null;
    }

    const publishedAtRaw = item.publishedAt || item.Date || item.createdAt;
    const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    if (Number.isNaN(publishedAt.getTime())) {
        return null;
    }

    const typeName = extractContentTypeName(item.type_of_content) || "News";
    const href = toAbsoluteUrl(buildContentUrl({
        slug: item.slug || "",
        type_of_content: item.type_of_content,
        contentType: typeName,
    }));

    return {
        key: `content:${item.id}`,
        title: item.Title || "Untitled",
        href,
        crispLine: truncate(
            extractPlainText(item.Excerpt) ||
            `Latest ${typeName.toLowerCase()} update from ENERGDIVE.`
        ),
        // Digest cards are rendered at a small fixed size. Using Strapi's small
        // rendition prevents each email from downloading the full article image.
        imageUrl: strapiMediaUrl(item.FeaturedImage, toAbsoluteUrl("/magazine-default.jpg"), undefined, "small"),
        publishedAt,
        sortAt: publishedAt,
        badge: typeName,
        formats,
        publisher: getAuthorName(item.author),
        contentTag: getContentTagTitle(item.content_tag).toLowerCase(),
    };
}

function normalizeEventItem(item: StrapiDigestEvent): DigestItem | null {
    if ((item.occurrence || "").toLowerCase() !== "upcoming") {
        return null;
    }

    const publishedAtRaw = item.publishedAt || item.createdAt || item.updatedAt;
    const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
    if (Number.isNaN(publishedAt.getTime())) {
        return null;
    }

    const eventDate = parseEventSortDate(item.date);
    const todayStart = getStartOfIstDay(new Date());

    // Digest events must have a valid date and must still be upcoming. This
    // prevents date-less CMS entries from displacing the nearest real events.
    if (!eventDate || eventDate < todayStart) {
        return null;
    }

    const image = Array.isArray(item.image) ? item.image[0] : item.image;
    const detail = [item.date, item.location || item.venue].filter(Boolean).join(" • ");

    return {
        key: `event:${item.id}`,
        title: item.title || "Upcoming Event",
        href: item.url || toAbsoluteUrl(`/events/${item.slug || item.id}`),
        crispLine: truncate(
            detail ||
            extractPlainText(item.description) ||
            "Upcoming event from ENERGDIVE."
        ),
        imageUrl: image ? strapiMediaUrl(image, toAbsoluteUrl("/magazine-default.jpg"), undefined, "small") : null,
        publishedAt,
        sortAt: eventDate,
        badge: "Upcoming Event",
        formats: ["Upcoming Events"],
        eventDate: item.date || null,
        eventVenue: item.location || item.venue || null,
        eventDescription: truncate(extractPlainText(item.description), 110) || null,
    };
}

async function fetchRecentContents(earliestPublishedAt?: Date): Promise<DigestItem[]> {
    const url = new URL(`${STRAPI_BASE}/api/contents`);
    url.searchParams.set("pagination[pageSize]", "200");
    url.searchParams.set("sort[0]", "publishedAt:desc");
    url.searchParams.set("sort[1]", "createdAt:desc");
    url.searchParams.set("populate[0]", "FeaturedImage");
    url.searchParams.set("populate[1]", "type_of_content");
    url.searchParams.set("populate[2]", "content_tag");
    url.searchParams.set("populate[3]", "author");

    if (earliestPublishedAt) {
        url.searchParams.set("filters[publishedAt][$gte]", earliestPublishedAt.toISOString());
    }

    const res = await fetch(url.toString(), {
        headers: getStrapiHeaders(),
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch contents from Strapi (${res.status})`);
    }

    const json = await res.json();
    return (json?.data || [])
        .map(normalizeContentItem)
        .filter((item: DigestItem | null): item is DigestItem => Boolean(item))
        .sort((a: DigestItem, b: DigestItem) => b.sortAt.getTime() - a.sortAt.getTime());
}

async function fetchUpcomingEvents(): Promise<DigestItem[]> {
    const url = new URL(`${STRAPI_BASE}/api/events`);
    url.searchParams.set("pagination[pageSize]", "100");
    url.searchParams.set("sort[0]", "createdAt:desc");
    url.searchParams.set("sort[1]", "publishedAt:desc");
    url.searchParams.set("populate", "*");
    url.searchParams.set("filters[occurrence][$eq]", "upcoming");

    // Do not filter Upcoming Events by earliestPublishedAt because an upcoming event
    // is relevant regardless of when it was created in the CMS.

    const res = await fetch(url.toString(), {
        headers: getStrapiHeaders(),
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch events from Strapi (${res.status})`);
    }

    const json = await res.json();
    return (json?.data || [])
        .map(normalizeEventItem)
        .filter((item: DigestItem | null): item is DigestItem => Boolean(item))
        .sort((a: DigestItem, b: DigestItem) => a.sortAt.getTime() - b.sortAt.getTime());
}

async function loadDigestCatalog(): Promise<DigestItem[]> {
    const [contents, events] = await Promise.all([
        // The fresh-news gate is applied when sections are built. Keeping a
        // wider catalog here lets Trending Articles rotate independently.
        fetchRecentContents(),
        fetchUpcomingEvents(),
    ]);

    return [...contents, ...events].sort(
        (a: DigestItem, b: DigestItem) => b.sortAt.getTime() - a.sortAt.getTime()
    );
}

function buildSections(
    formats: DigestFormat[],
    since: Date | null,
    catalog: DigestItem[],
    frequency: string = "daily",
    perFormatLimit = 4
): DigestSection[] {
    const sections: DigestSection[] = [];
    const usedKeys = new Set<string>();

    for (const format of formats) {
        if (format !== "News Briefing" && format !== "Upcoming Events") {
            continue; // Only process News Briefing and Upcoming Events
        }

        if (frequency === "monthly") {
            continue; // Disable monthly processing
        }

        const isEvent = format === "Upcoming Events";
        let limit = perFormatLimit;
        
        if (isEvent) {
            limit = 3; // Strictly top 3 events
        } else if (format === "News Briefing") {
            limit = 4;
        }

        const items = catalog
            .filter((item) => item.formats.includes(format))
            .filter((item) => isEvent || !since || item.publishedAt >= since)
            .filter((item) => !usedKeys.has(item.key))
            .sort((a, b) => {
                if (isEvent) {
                    // Ascending order for upcoming events (soonest first)
                    return a.sortAt.getTime() - b.sortAt.getTime();
                }
                // Descending order for news (latest first)
                return b.sortAt.getTime() - a.sortAt.getTime();
            })
            .slice(0, limit);

        if (items.length === 0) {
            continue;
        }

        items.forEach((item) => usedKeys.add(item.key));
        sections.push({ format, items });
    }

    return sections;
}

function hasEnoughTopNews(sections: DigestSection[]): boolean {
    // A Daily Briefing is only useful when it has at least two fresh news stories.
    return (sections.find((section) => section.format === "News Briefing")?.items.length || 0) >= 2;
}

interface DailyBriefingExtras {
    trending: DigestItem[];
    articles: DigestItem[];
    latestIssue: Awaited<ReturnType<typeof getLatestIssue>>;
    jobs: Array<{
        companyName: string;
        title: string;
        location: string;
        href: string;
    }>;
}

function getIstDateKey(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}

function hashForDay(value: string, dayKey: string): number {
    let hash = 2166136261;
    const source = `${dayKey}:${value}`;
    for (let index = 0; index < source.length; index += 1) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function getDailyTrendingArticles(catalog: DigestItem[], sections: DigestSection[]): DigestItem[] {
    const topNewsKeys = new Set(
        sections
            .find((section) => section.format === "News Briefing")
            ?.items.map((item) => item.key) || []
    );
    const dayKey = getIstDateKey();

    return catalog
        .filter((item) => item.key.startsWith("content:") && !topNewsKeys.has(item.key))
        .sort((left, right) => hashForDay(left.key, dayKey) - hashForDay(right.key, dayKey))
        .slice(0, 3);
}

async function loadDailyBriefingExtras(
    catalog: DigestItem[],
    sections: DigestSection[]
): Promise<DailyBriefingExtras> {
    const trending = getDailyTrendingArticles(catalog, sections);
    const dayKey = getIstDateKey();
    const selectedKeys = new Set(sections.flatMap((section) => section.items.map((item) => item.key)));

    const articles = catalog
        .filter((item) =>
            item.key.startsWith("content:") &&
            !selectedKeys.has(item.key) &&
            /article/i.test(item.badge)
        )
        .sort((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime())
        .slice(0, 3);
    const latestIssue = await getLatestIssue();

    try {
        // Fetch a wider pool, then use the IST date as a stable shuffle seed.
        // Everyone sees the same three jobs on a given day, and a fresh mix on
        // the next day without changing the source job data.
        const jobs = await loadPublicEnergJobs(60);
        const dailyJobs = [...jobs]
            .sort((left, right) => hashForDay(left.routeSlug, dayKey) - hashForDay(right.routeSlug, dayKey))
            .slice(0, 3);
        return {
            trending,
            articles,
            latestIssue,
            jobs: dailyJobs.map((job) => ({
                companyName: job.companyName || "ENERGDIVE Jobs",
                title: job.title,
                location: job.location || "India",
                href: job.externalApplyUrl || toAbsoluteUrl(`/energyjobs/${job.routeSlug}`),
                logoUrl: job.companyLogoUrl,
                experience: job.experienceMin !== null || job.experienceMax !== null
                    ? `${job.experienceMin ?? job.experienceMax}${job.experienceMin !== job.experienceMax && job.experienceMax !== null ? `–${job.experienceMax}` : ""} years`
                    : null,
            })),
        };
    } catch (error) {
        console.error("[Digests] Failed to load latest jobs:", error);
        return { trending, articles, latestIssue, jobs: [] };
    }
}

function getDueWindowStart(
    row: Pick<DigestCandidateRow, "preferred_frequency">,
    now: Date
): Date {
    const frequency = normalizeFrequency(row.preferred_frequency);
    if (frequency === "daily") {
        return getStartOfIstDay(now);
    }
    if (frequency === "weekly") {
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function deriveDisplayName(email: string, firstName?: string | null): string {
    if (firstName && firstName.trim()) {
        return firstName.trim();
    }
    const localPart = email.split("@")[0] || "Reader";
    const normalized = localPart.replace(/[._-]+/g, " ").trim();
    return normalized
        ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
        : "Reader";
}

async function logDigestSend(payload: {
    userId?: number | null;
    email: string;
    frequency: DigestFrequency;
    formats: DigestFormat[];
    itemKeys: string[];
    itemCount: number;
    status: DigestLogStatus;
    error?: string | null;
}) {
    await query(
        `INSERT INTO content_digest_logs
            (user_id, email, frequency, formats, item_keys, item_count, status, error, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
            payload.userId || null,
            payload.email,
            payload.frequency,
            payload.formats,
            payload.itemKeys,
            payload.itemCount,
            payload.status,
            payload.error || null,
        ]
    );
}

async function markDigestSent(userIds: number[]) {
    if (userIds.length === 0) {
        return;
    }

    const regularUserIds = userIds.filter((id) => id > 0);
    const letterboxIds = userIds.filter((id) => id < 0).map((id) => -id);

    if (regularUserIds.length > 0) {
        await query(
            `UPDATE users
             SET last_content_digest_sent_at = NOW(),
                 updated_at = NOW()
             WHERE id = ANY($1::int[])`,
            [regularUserIds]
        );
    }

    if (letterboxIds.length > 0) {
        await query(
            `UPDATE subscribe_letterbox
             SET last_content_digest_sent_at = NOW(),
                 updated_at = NOW()
             WHERE id = ANY($1::int[])`,
            [letterboxIds]
        );
    }
}

function dedupeCandidatesByEmail(rows: DigestCandidateRow[]): DigestEmailCandidate[] {
    const grouped = new Map<string, DigestEmailCandidate>();

    for (const row of rows) {
        const email = row.email.trim().toLowerCase();
        const existing = grouped.get(email);

        if (!existing) {
            grouped.set(email, {
                id: row.id,
                userIds: [row.id],
                email,
                first_name: row.first_name,
                preferred_frequency: row.preferred_frequency,
                preferred_formats: row.preferred_formats,
                last_content_digest_sent_at: row.last_content_digest_sent_at,
            });
            continue;
        }

        existing.userIds.push(row.id);

        const existingLast = existing.last_content_digest_sent_at
            ? new Date(existing.last_content_digest_sent_at).getTime()
            : Number.NEGATIVE_INFINITY;
        const incomingLast = row.last_content_digest_sent_at
            ? new Date(row.last_content_digest_sent_at).getTime()
            : Number.NEGATIVE_INFINITY;

        if (incomingLast > existingLast) {
            existing.last_content_digest_sent_at = row.last_content_digest_sent_at;
        }

        if (row.id > existing.id || (!existing.first_name && row.first_name)) {
            existing.id = row.id;
            existing.first_name = row.first_name;
            existing.preferred_frequency = row.preferred_frequency;
            existing.preferred_formats = row.preferred_formats;
        }
    }

    return Array.from(grouped.values()).sort((a, b) => {
        const aTime = a.last_content_digest_sent_at
            ? new Date(a.last_content_digest_sent_at).getTime()
            : Number.NEGATIVE_INFINITY;
        const bTime = b.last_content_digest_sent_at
            ? new Date(b.last_content_digest_sent_at).getTime()
            : Number.NEGATIVE_INFINITY;
        return aTime - bTime;
    });
}

async function getDigestCandidates(options: ProcessDigestsOptions): Promise<DigestEmailCandidate[]> {
    const params: unknown[] = [];
    let emailFilter = "";

    if (options.email) {
        params.push(options.email.trim().toLowerCase());
        emailFilter = `AND LOWER(email) = $${params.length}`;
    }

    params.push(options.limit || 100);
    const limitPlaceholder = `$${params.length}`;

    // Ensure last_content_digest_sent_at column exists in subscribe_letterbox
    await query(`ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS last_content_digest_sent_at TIMESTAMPTZ`);

    const result = await query<DigestCandidateRow>(
        `SELECT * FROM (
            SELECT
                id,
                email,
                first_name,
                last_name,
                preferred_frequency,
                preferred_formats,
                last_content_digest_sent_at
            FROM users
            WHERE onboarding_completed = true
              AND verification_status = 'verified'
              AND email NOT LIKE '%@phone.energdive.com'
              AND COALESCE(content_digest_opted_out, false) = false
              AND preferred_frequency IS NOT NULL
              AND preferred_formats IS NOT NULL
              AND COALESCE(array_length(preferred_formats, 1), 0) > 0
              ${emailFilter}

            UNION ALL

            SELECT
                -id as id,
                email,
                NULL as first_name,
                NULL as last_name,
                'Daily' as preferred_frequency,
                ARRAY['News Briefing'] as preferred_formats,
                last_content_digest_sent_at
            FROM subscribe_letterbox
            WHERE email NOT LIKE '%@phone.energdive.com'
              ${emailFilter}
        ) AS combined
        ORDER BY COALESCE(last_content_digest_sent_at, TO_TIMESTAMP(0)) ASC
        LIMIT ${limitPlaceholder}`,
        params
    );

    return dedupeCandidatesByEmail(result.rows);
}

export async function processPreferenceDigests(
    options: ProcessDigestsOptions = {}
): Promise<ProcessDigestsResult> {
    const now = new Date();

    // Do not send any emails on Saturday (6) or Sunday (0)
    const istNow = shiftToIst(now);
    const dayOfWeek = istNow.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return {
            success: true,
            processed: 0,
            due: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            results: [],
        };
    }

    const candidates = await getDigestCandidates(options);
    const dueCandidates = candidates.filter((row) =>
        isDigestDue(
            normalizeFrequency(row.preferred_frequency),
            row.last_content_digest_sent_at ? new Date(row.last_content_digest_sent_at) : null,
            now
        )
    );

    if (dueCandidates.length === 0) {
        return {
            success: true,
            processed: candidates.length,
            due: 0,
            sent: 0,
            skipped: 0,
            errors: 0,
            results: [],
        };
    }

    const catalog = await loadDigestCatalog();
    
    let sponsor: { imageUrl: string; targetUrl: string } | null = null;
    try {
        const ads = await getAdvertisements({ placement: "email_top" });
        if (ads && ads.length > 0) {
            const ad = ads.find((candidate) => {
                const candidateImageUrl = getAdImageUrl(candidate.creative?.[0] || candidate.logo?.[0]);
                return Boolean(candidateImageUrl && isDailyBriefingAdImageAllowed(candidateImageUrl));
            });
            const imageUrl = ad ? getAdImageUrl(ad.creative?.[0] || ad.logo?.[0]) : null;
            if (ad && imageUrl) {
                sponsor = {
                    imageUrl,
                    targetUrl: appendEmailAdUtm(ad.target_url || APP_URL, ad.partner_name || ad.title)
                };
            }
        }
    } catch (err) {
        console.error("[Digests] Failed to fetch sponsor banner:", err);
    }

    const results: ProcessDigestsResult["results"] = [];
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of dueCandidates) {
        const frequency = normalizeFrequency(row.preferred_frequency);
        if (frequency === "monthly") {
            skipped++;
            results.push({ email: row.email, status: "skipped", reason: "monthly_disabled" });
            continue;
        }

        // Hardcode formats to ONLY include News Briefing and Upcoming Events
        const formats = ["News Briefing", "Upcoming Events"] as DigestFormat[];
        const since = getDueWindowStart(row, now);
        const sections = buildSections(formats, since, catalog, frequency);
        const itemKeys = sections.flatMap((section) => section.items.map((item) => item.key));

        if (!hasEnoughTopNews(sections)) {
            skipped++;
            results.push({
                email: row.email,
                status: "skipped",
                reason: "insufficient_top_news",
            });
            continue;
        }

        if (sections.length === 0 || itemKeys.length === 0) {
            skipped++;
            results.push({
                email: row.email,
                status: "skipped",
                reason: "no_new_matching_content",
            });
            continue;
        }

        const extras = await loadDailyBriefingExtras(catalog, sections);

        try {
            await sendPreferenceDigestEmail(
                row.email,
                deriveDisplayName(row.email, row.first_name),
                frequency,
                sections,
                sponsor,
                extras
            );

            await markDigestSent(row.userIds);
            await logDigestSend({
                userId: row.id,
                email: row.email,
                frequency,
                formats,
                itemKeys,
                itemCount: itemKeys.length,
                status: "sent",
            });

            sent++;
            results.push({
                email: row.email,
                status: "sent",
                items: itemKeys.length,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors++;

            await logDigestSend({
                userId: row.id,
                email: row.email,
                frequency,
                formats,
                itemKeys,
                itemCount: itemKeys.length,
                status: "failed",
                error: message,
            });

            results.push({
                email: row.email,
                status: "failed",
                reason: message,
            });
        }
    }

    return {
        success: errors === 0,
        processed: candidates.length,
        due: dueCandidates.length,
        sent,
        skipped,
        errors,
        results,
    };
}

export async function sendPreferenceDigestPreview(
    options: PreviewDigestOptions
): Promise<PreviewDigestResult> {
    const email = options.email.trim().toLowerCase();
    const frequency = options.frequency || "daily";

    // Disable monthly entirely
    if (frequency === "monthly") {
        return { success: false, items: 0, email, frequency: "monthly", formats: [] };
    }

    // Force formats to ONLY be News Briefing and Upcoming Events
    const formats = ["News Briefing", "Upcoming Events"] as DigestFormat[];
    const mockRow = { preferred_frequency: frequency } as any;
    const since = getDueWindowStart(mockRow, new Date());
    const catalog = await loadDigestCatalog();
    const sections = buildSections(formats, since, catalog, frequency);
    const itemKeys = sections.flatMap((section) => section.items.map((item) => item.key));

    let sponsor: { imageUrl: string; targetUrl: string } | null = null;
    try {
        const ads = await getAdvertisements({ placement: "email_top" });
        if (ads && ads.length > 0) {
            const ad = ads.find((candidate) => {
                const candidateImageUrl = getAdImageUrl(candidate.creative?.[0] || candidate.logo?.[0]);
                return Boolean(candidateImageUrl && isDailyBriefingAdImageAllowed(candidateImageUrl));
            });
            const imageUrl = ad ? getAdImageUrl(ad.creative?.[0] || ad.logo?.[0]) : null;
            if (ad && imageUrl) {
                sponsor = {
                    imageUrl,
                    targetUrl: appendEmailAdUtm(ad.target_url || APP_URL, ad.partner_name || ad.title)
                };
            }
        }
    } catch (err) {
        console.error("[Digests] Failed to fetch sponsor banner:", err);
    }

    if (sections.length === 0 || itemKeys.length === 0) {
        throw new Error("No matching content or events are available for the requested preview.");
    }

    if (!options.allowInsufficientTopNews && !hasEnoughTopNews(sections)) {
        throw new Error("At least two Top News articles are required to send a Daily Briefing preview.");
    }

    const extras = await loadDailyBriefingExtras(catalog, sections);

    await sendPreferenceDigestEmail(
        email,
        deriveDisplayName(email, options.firstName),
        frequency,
        sections,
        sponsor,
        extras
    );

    await logDigestSend({
        email,
        frequency,
        formats,
        itemKeys,
        itemCount: itemKeys.length,
        status: "preview",
    });

    return {
        success: true,
        email,
        items: itemKeys.length,
        formats,
        frequency,
    };
}

export function getSupportedDigestFormats(): DigestFormat[] {
    return [...DIGEST_FORMAT_OPTIONS];
}
