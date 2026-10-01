const SHORT_TO_FULL_MONTH: Record<string, string> = {
    JAN: "JANUARY",
    FEB: "FEBRUARY",
    MAR: "MARCH",
    APR: "APRIL",
    MAY: "MAY",
    JUN: "JUNE",
    JUL: "JULY",
    AUG: "AUGUST",
    SEP: "SEPTEMBER",
    SEPT: "SEPTEMBER",
    OCT: "OCTOBER",
    NOV: "NOVEMBER",
    DEC: "DECEMBER",
};

export function formatContentDate(
    value?: string | Date | null,
    options?: { month?: "short" | "long" }
): string {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        if (typeof value !== "string") return "";
        let str = value.trim().toUpperCase();
        if (options?.month === "long") {
            str = str.replace(
                /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)\b/g,
                (m) => SHORT_TO_FULL_MONTH[m] || m
            );
        }
        return str;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: options?.month ?? "short",
        year: "numeric",
    }).format(date).toUpperCase();
}

export function formatFullISTDateTime(value?: string | Date | null): string {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
    }).format(date).replace(",", "") + " IST";
}

export function toIsoDate(value: string | Date | null | undefined): string | undefined {
    if (!value) return undefined;
    try {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
    } catch {
        return String(value);
    }
}
