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
        hour: Number(parts.hour),
        minute: Number(parts.minute),
        isWeekday: !["Sat", "Sun"].includes(parts.weekday),
        dayStart: new Date(`${dateKey}T00:00:00+05:30`),
    };
}

/** Never infer a subscriber's name from their email address. */
export function normalizeBriefingFirstName(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const name = value.trim();
    if (!name || /\b(?:null|undefined)\b/i.test(name)) return null;
    return name.split(/\s+/)[0];
}
