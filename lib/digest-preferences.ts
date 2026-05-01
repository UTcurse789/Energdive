export const DIGEST_FREQUENCY_OPTIONS = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
] as const;

export const DIGEST_FORMAT_OPTIONS = [
    "Insights",
    "Opinion",
    "News Briefing",
    "Upcoming Events",
    "Case Study & Technical Papers",
] as const;

export type DigestFrequency = (typeof DIGEST_FREQUENCY_OPTIONS)[number]["value"];
export type DigestFormat = (typeof DIGEST_FORMAT_OPTIONS)[number];

export function isDigestFrequency(value: string): value is DigestFrequency {
    return DIGEST_FREQUENCY_OPTIONS.some((option) => option.value === value);
}

export function isDigestFormat(value: string): value is DigestFormat {
    return DIGEST_FORMAT_OPTIONS.some((option) => option === value);
}
