export const DAILY_BRIEFING_TIME_ZONE = "Asia/Kolkata";

const briefingClock = new Intl.DateTimeFormat("en-GB", {
    timeZone: DAILY_BRIEFING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

export function getDailyBriefingClock(now: Date) {
    const parts = Object.fromEntries(briefingClock.formatToParts(now).map((part) => [part.type, part.value]));
    const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
    return {
        dateKey,
        weekday: new Date(`${dateKey}T00:00:00Z`).getUTCDay(),
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        isWeekday: !["Sat", "Sun"].includes(parts.weekday),
        dayStart: new Date(`${dateKey}T00:00:00+05:30`),
    };
}

export type BriefingFrequency = "daily" | "weekly";
const DAY_MS = 86_400_000;

function weekdaySetting(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const parsed = /^\d$/.test(value) ? Number(value) : names.indexOf(value.toLowerCase());
    if (parsed < 1 || parsed > 5) throw new Error("BRIEFING_WEEKLY_WEEKDAY must be Monday-Friday (1-5)");
    return parsed;
}

export function getBriefingSchedule() {
    const sendTime = process.env.BRIEFING_SEND_TIME || "17:00";
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(sendTime)) throw new Error("BRIEFING_SEND_TIME must be HH:mm IST");
    const weeklyWeekday = weekdaySetting(process.env.BRIEFING_WEEKLY_WEEKDAY, 5);
    const startSetting = process.env.BRIEFING_WEEK_START_WEEKDAY;
    const weekStartWeekday = startSetting === undefined ? (weeklyWeekday + 1) % 7 : Number(startSetting);
    if (!Number.isInteger(weekStartWeekday) || weekStartWeekday < 0 || weekStartWeekday > 6) {
        throw new Error("BRIEFING_WEEK_START_WEEKDAY must be 0-6 (Sunday-Saturday)");
    }
    return { sendTime, weeklyWeekday, weekStartWeekday };
}

export function getBriefingWindow(frequency: BriefingFrequency, now = new Date()) {
    const clock = getDailyBriefingClock(now);
    const schedule = getBriefingSchedule();
    const cutoff = new Date(`${clock.dateKey}T${schedule.sendTime}:00+05:30`);
    const offset = frequency === "weekly" ? (clock.weekday - schedule.weekStartWeekday + 7) % 7 : 0;
    const start = new Date(clock.dayStart.getTime() - offset * DAY_MS);
    return { ...clock, cutoff, start, end: cutoff, periodKey: getDailyBriefingClock(start).dateKey };
}

export function briefingScheduleReason(frequency: string, now = new Date()): string | null {
    const clock = getDailyBriefingClock(now);
    if (!clock.isWeekday) return "weekend_Asia_Kolkata";
    if (frequency !== "daily" && frequency !== "weekly") return "unsupported_frequency";
    const { cutoff } = getBriefingWindow(frequency, now);
    if (now < cutoff) return "before_send_cutoff";
    if (frequency === "weekly" && clock.weekday !== getBriefingSchedule().weeklyWeekday) return "weekly_schedule_not_due";
    return null;
}

export interface PublishedNews {
    key: string;
    publishedAt: Date;
    badge: string;
}

/** A fresh CMS read must supply this count; saved editions never authorize a send. */
export function briefingGateReason(items: PublishedNews[], now = new Date()): string | null {
    const { isWeekday, dayStart } = getDailyBriefingClock(now);
    if (!isWeekday) return "weekend_Asia_Kolkata";
    const cutoff = getBriefingWindow("daily", now).cutoff;
    const until = new Date(Math.min(now.getTime(), cutoff.getTime()));
    const keys = new Set(items.filter(item => item.badge.trim().toLowerCase() === "news" &&
        item.publishedAt >= dayStart && item.publishedAt <= until).map(item => item.key));
    return keys.size < 3 ? `insufficient_today_news:${keys.size}/3` : null;
}

/** Never infer a subscriber's name from their email address. */
export function normalizeBriefingFirstName(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const name = value.trim();
    if (!name || /\b(?:null|undefined)\b/i.test(name)) return null;
    return name.split(/\s+/)[0];
}
