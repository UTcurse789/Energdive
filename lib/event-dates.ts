const MONTH_TO_INDEX: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sept: 8,
    sep: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
};

const MONTH_REGEX =
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b/gi;

function normalizeEventDateInput(value: string) {
    return value
        .toLowerCase()
        .replace(/[–—]/g, "-")
        .replace(/(\d{1,2})(st|nd|rd|th)\b/gi, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

function extractDayNumbers(value: string) {
    return Array.from(value.matchAll(/\b(\d{1,2})\b/g), (match) => Number.parseInt(match[1], 10))
        .filter((day) => Number.isFinite(day) && day >= 1 && day <= 31);
}

function extractYears(value: string) {
    return Array.from(value.matchAll(/\b(20\d{2})\b/g), (match) => Number.parseInt(match[1], 10))
        .filter((year) => Number.isFinite(year));
}

function createTimestamp(year: number, monthIndex: number, day: number) {
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
        return 0;
    }

    return new Date(year, monthIndex, day).getTime();
}

function getMonthIndex(monthName: string) {
    return MONTH_TO_INDEX[monthName.toLowerCase()] ?? -1;
}

function getLastItem<T>(items: T[]) {
    return items.length > 0 ? items[items.length - 1] : null;
}

export function getEventDateRange(dateString?: string | null) {
    if (!dateString) {
        return { startAt: 0, endAt: 0 };
    }

    const normalized = normalizeEventDateInput(String(dateString));
    const monthMatches = Array.from(normalized.matchAll(MONTH_REGEX));
    const years = extractYears(normalized);
    const currentYear = new Date().getFullYear();
    const fallbackStartYear = years[0] ?? currentYear;
    const fallbackEndYear = getLastItem(years) ?? fallbackStartYear;

    if (monthMatches.length === 0) {
        return { startAt: 0, endAt: 0 };
    }

    if (monthMatches.length === 1) {
        const [monthMatch] = monthMatches;
        const monthIndex = getMonthIndex(monthMatch[0]);
        const monthStart = monthMatch.index ?? 0;
        const monthEnd = monthStart + monthMatch[0].length;
        const before = normalized.slice(0, monthStart);
        const after = normalized.slice(monthEnd);
        const dayNumbers = [...extractDayNumbers(before), ...extractDayNumbers(after)];

        if (monthIndex < 0) {
            return { startAt: 0, endAt: 0 };
        }

        if (dayNumbers.length === 0) {
            const monthOnlyStart = createTimestamp(fallbackStartYear, monthIndex, 1);
            const monthOnlyEnd = new Date(fallbackEndYear, monthIndex + 1, 0).getTime();

            return {
                startAt: monthOnlyStart,
                endAt: monthOnlyEnd,
            };
        }

        const startDay = dayNumbers[0];
        const endDay = getLastItem(dayNumbers) ?? startDay;

        return {
            startAt: createTimestamp(fallbackStartYear, monthIndex, startDay),
            endAt: createTimestamp(fallbackEndYear, monthIndex, endDay),
        };
    }

    const firstMonth = monthMatches[0];
    const secondMonth = monthMatches[1];
    const lastMonth = getLastItem(monthMatches);
    const penultimateMonth = monthMatches[monthMatches.length - 2];

    if (!lastMonth) {
        return { startAt: 0, endAt: 0 };
    }

    const firstMonthIndex = getMonthIndex(firstMonth[0]);
    const lastMonthIndex = getMonthIndex(lastMonth[0]);

    const beforeFirstMonth = normalized.slice(0, firstMonth.index ?? 0);
    const afterFirstMonth = normalized.slice(
        (firstMonth.index ?? 0) + firstMonth[0].length,
        secondMonth?.index ?? normalized.length
    );
    const beforeLastMonth = normalized.slice(
        ((penultimateMonth?.index ?? 0) + (penultimateMonth?.[0]?.length ?? 0)),
        lastMonth.index ?? normalized.length
    );
    const afterLastMonth = normalized.slice((lastMonth.index ?? 0) + lastMonth[0].length);

    const startDay =
        getLastItem(extractDayNumbers(beforeFirstMonth)) ??
        extractDayNumbers(afterFirstMonth)[0] ??
        0;
    const endDay =
        getLastItem(extractDayNumbers(beforeLastMonth)) ??
        extractDayNumbers(afterLastMonth)[0] ??
        startDay;

    if (firstMonthIndex < 0 || lastMonthIndex < 0 || !startDay || !endDay) {
        return { startAt: 0, endAt: 0 };
    }

    return {
        startAt: createTimestamp(fallbackStartYear, firstMonthIndex, startDay),
        endAt: createTimestamp(fallbackEndYear, lastMonthIndex, endDay),
    };
}

export function getEventStartTimestamp(dateString?: string | null) {
    return getEventDateRange(dateString).startAt;
}

export function getEventEndTimestamp(dateString?: string | null) {
    return getEventDateRange(dateString).endAt;
}

export function isEventDatePast(dateString?: string | null, referenceDate = new Date()) {
    const endAt = getEventEndTimestamp(dateString);
    if (!endAt) {
        return false;
    }

    const startOfToday = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        referenceDate.getDate()
    ).getTime();

    return endAt < startOfToday;
}

type EventOccurrence = "upcoming" | "past";

type EventListItem = {
    occurrence?: string | null;
    date?: string | null;
};

export function filterAndSortEventsByOccurrence<T extends EventListItem>(
    events: T[],
    occurrence: EventOccurrence,
    referenceDate = new Date()
) {
    return [...events]
        .filter((event) => {
            if (event?.occurrence?.toLowerCase() !== occurrence) {
                return false;
            }

            if (occurrence === "upcoming") {
                return !isEventDatePast(event.date, referenceDate);
            }

            return true;
        })
        .sort((a, b) => {
            const timeA = getEventStartTimestamp(a.date);
            const timeB = getEventStartTimestamp(b.date);

            if (occurrence === "upcoming") {
                return timeA - timeB;
            }

            return timeB - timeA;
        });
}
