import { getLatestIssue } from "./api/getLatestIssue";
import { loadPublicEnergJobs } from "./energjob-public";
import { briefingImage } from "./briefing-content";
import { getDailyBriefingClock } from "./daily-briefing-rules";
import type { DigestItem } from "./briefing-types";
import type { BriefingEdition } from "./briefing-store";
import type { DailyBriefingExtras } from "./email";

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";

function eventDateInIst(value: unknown, now: Date): Date | null {
    if (typeof value !== "string" || !value.trim()) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00+05:30`);
    if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return new Date(value);
    const normalized = value.trim().replace(/(\d{1,2})(st|nd|rd|th)/gi, "$1").toLowerCase();
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].findIndex(name => normalized.includes(name));
    const day = normalized.match(/\b(\d{1,2})\b/)?.[1];
    const year = normalized.match(/\b(20\d{2})\b/)?.[1] || getDailyBriefingClock(now).dateKey.slice(0, 4);
    if (month < 0 || !day) return null;
    return new Date(`${year}-${String(month + 1).padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+05:30`);
}

export async function fetchBriefingEvents(now: Date): Promise<DigestItem[]> {
    const url = new URL(`${process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com"}/api/events`);
    url.searchParams.set("populate", "*");
    url.searchParams.set("filters[occurrence][$eq]", "upcoming");
    url.searchParams.set("pagination[pageSize]", "100");
    url.searchParams.set("sort[0]", "createdAt:desc");
    url.searchParams.set("sort[1]", "publishedAt:desc");
    const response = await fetch(url, { headers: process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}, cache: "no-store" });
    if (!response.ok) throw new Error(`Briefing events fetch failed (${response.status})`);
    const payload = await response.json();
    const events: DigestItem[] = [];
    for (const raw of payload.data || []) {
        const item = raw.attributes ? { ...raw, ...raw.attributes } : raw;
        const publishedAt = new Date(item.publishedAt);
        // Date-only event dates are IST dates, independent of the worker host.
        const date = eventDateInIst(item.date, now);
        if (!item.publishedAt || !Number.isFinite(publishedAt.getTime()) || publishedAt > now || !date || !Number.isFinite(date.getTime()) || date < getDailyBriefingClock(now).dayStart) continue;
        events.push({ key: `event:${item.documentId || item.id}`, title: item.title || "Upcoming Event",
            href: item.url || new URL(`/events/${item.slug || item.id}`, APP).toString(), crispLine: item.date || "Upcoming event from ENERGDIVE.",
            ...briefingImage(item.image), publishedAt, sortAt: date, badge: "Upcoming Event", formats: ["Upcoming Events"],
            eventDate: item.date, eventVenue: item.location || item.venue || null });
    }
    return events.sort((a, b) => a.sortAt.getTime() - b.sortAt.getTime()).slice(0, 3);
}

export async function loadBriefingExtras(edition: BriefingEdition): Promise<DailyBriefingExtras> {
    const [latestIssue, jobs] = await Promise.all([
        getLatestIssue().catch(error => { console.error("[Briefing] Latest issue unavailable", error); return null; }),
        loadPublicEnergJobs(60).catch(error => { console.error("[Briefing] Jobs unavailable", error); return []; }),
    ]);
    const dayNumber = Math.floor(edition.cutoff.getTime() / 86_400_000);
    const sortedJobs = [...jobs].sort((a, b) => a.routeSlug.localeCompare(b.routeSlug));
    const dailyJobs = sortedJobs.length ? [...sortedJobs.slice(dayNumber % sortedJobs.length), ...sortedJobs.slice(0, dayNumber % sortedJobs.length)].slice(0, 3) : [];
    return {
        trending: [], articles: edition.featured, latestIssue,
        editionDate: edition.cutoff,
        coveredDates: edition.frequency === "weekly" ? { start: new Date(`${edition.periodKey}T00:00:00+05:30`), end: edition.cutoff } : undefined,
        jobs: dailyJobs.map(job => ({ companyName: job.companyName || "ENERGDIVE Jobs", title: job.title,
            location: job.location || "India", href: job.externalApplyUrl || new URL(`/energyjobs/${job.routeSlug}`, APP).toString(), logoUrl: job.companyLogoUrl })),
    };
}
