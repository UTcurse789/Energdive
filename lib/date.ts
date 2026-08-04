export function formatContentDate(value?: string | Date | null): string {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return typeof value === "string" ? value.trim().toUpperCase() : "";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
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
