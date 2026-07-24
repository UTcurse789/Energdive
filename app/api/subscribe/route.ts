import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { query } from "@/lib/db";
import { sendNewsletterSubscriptionThanksEmail } from "@/lib/email";
import { getPostHogClient } from "@/lib/posthog-server";

const BREVO_LIST_ID = 7;
const BREVO_API = "https://api.brevo.com/v3/contacts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_FREQUENCIES = ["Daily", "Weekly", "Monthly"];

const VALID_PREFERENCES = [
    "Insights",
    "Opinion",
    "News Briefing",
    "Upcoming Events",
    "Case Study & Technical Papers",
];

const VALID_SECTORS: Record<string, string[]> = {
    "Oil & Gas": [
        "Upstream",
        "Pipelines",
        "Refining",
        "Petrochemicals",
        "CGD",
        "LPG",
        "Retail",
        "Oil Markets",
    ],
    "Power Generation": ["Thermal", "Nuclear"],
    Renewables: [
        "Solar",
        "Wind",
        "Hydro",
        "Biopower",
        "Cogeneration",
        "Waste-to-Energy",
    ],
    Transmission: ["Smart Grid"],
    Distribution: [
        "Smart Meters & AMI",
        "EV Charging",
        "Data Centres",
        "Smart Cities",
        "Railways & Metros",
    ],
    "Electricity Markets": ["Power Markets", "Carbon Markets", "RCO"],
    "New Energies": ["Green Hydrogen", "E-Fuels"],
    "Energy Storage": ["BESS", "Pumped Hydro", "CAES", "Thermal", "Flywheel"],
    "Sustainability & Safety": [
        "Energy Efficiency",
        "Occupational Health",
        "Industrial & Process Safety",
        "Environment",
    ],
};

type BrevoRequestError = {
    response?: {
        status?: number;
        data?: {
            message?: string;
        } | string;
    };
    message?: string;
};

type IpLocationResponse = {
    ip?: string;
    city?: string;
    region?: string;
    regionName?: string;
    status?: string;
    error?: boolean;
};

function getBrevoMessage(error: BrevoRequestError): string | undefined {
    return typeof error.response?.data === "object"
        ? error.response.data?.message
        : undefined;
}

function isExistingBrevoContactError(err: unknown): boolean {
    const error = err as BrevoRequestError;
    return (
        error.response?.status === 400 &&
        Boolean(getBrevoMessage(error)?.includes("Contact already exist"))
    );
}

async function ensureSubscribeLetterboxTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS subscribe_letterbox (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            location TEXT,
            ip_address TEXT,
            source TEXT NOT NULL DEFAULT 'subscribe_form',
            subscribed_from_url TEXT,
            subscribed_from_title TEXT,
            subscribed_from_page TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS subscribed_from_url TEXT`);
    await query(`ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS subscribed_from_title TEXT`);
    await query(`ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS subscribed_from_page TEXT`);
    await query(`ALTER TABLE subscribe_letterbox ADD COLUMN IF NOT EXISTS last_content_digest_sent_at TIMESTAMPTZ`);
    await query(`CREATE INDEX IF NOT EXISTS idx_subscribe_letterbox_email ON subscribe_letterbox (LOWER(email))`);
    await query(`CREATE INDEX IF NOT EXISTS idx_subscribe_letterbox_timestamp ON subscribe_letterbox ("timestamp" DESC)`);
}

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-client-ip")?.trim() ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip")?.trim() ||
        req.headers.get("cf-connecting-ip")?.trim() ||
        "unknown"
    );
}

function cleanText(value: unknown, maxLength = 160): string | null {
    if (typeof value !== "string") return null;

    const cleaned = value.trim().replace(/\s+/g, " ");
    return cleaned ? cleaned.slice(0, maxLength) : null;
}

function normalizeIp(value: unknown): string | null {
    const ip = cleanText(value, 80);
    if (!ip || ip === "unknown") return null;
    return ip;
}

function isPublicIp(ip: string): boolean {
    if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return false;
    if (/^(10\.|192\.168\.|169\.254\.)/.test(ip)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return false;
    if (/^(fc|fd|fe80):/i.test(ip)) return false;
    return true;
}

function formatCityState(city?: string | null, state?: string | null): string | null {
    const parts = [city, state]
        .map((part) => (part || "").trim())
        .filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
}

async function resolveLocationByIp(ip: string): Promise<string | null> {
    if (!isPublicIp(ip)) return null;

    const readJson = async (url: string) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2_000);

        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { Accept: "application/json" },
            });

            if (!res.ok) return null;
            return (await res.json()) as IpLocationResponse;
        } finally {
            clearTimeout(timeout);
        }
    };

    try {
        const ipapi = await readJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
        if (ipapi && !ipapi.error) {
            const location = formatCityState(ipapi.city, ipapi.region);
            if (location) return location;
        }

        const ipApi = await readJson(
            `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,regionName,city`
        );
        if (ipApi && (!ipApi.status || ipApi.status === "success")) {
            return formatCityState(ipApi.city, ipApi.regionName);
        }

        return null;
    } catch {
        return null;
    }
}

async function insertSubscribeLetterbox(params: {
    email: string;
    location: string | null;
    ip: string;
    source: string;
    subscribedFromUrl: string | null;
    subscribedFromTitle: string | null;
    subscribedFromPage: string | null;
}) {
    await ensureSubscribeLetterboxTable();

    try {
        await query(
            `INSERT INTO subscribe_letterbox (
                email,
                "timestamp",
                location,
                ip_address,
                source,
                subscribed_from_url,
                subscribed_from_title,
                subscribed_from_page
             )
             VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)`,
            [
                params.email,
                params.location,
                params.ip,
                params.source,
                params.subscribedFromUrl,
                params.subscribedFromTitle,
                params.subscribedFromPage,
            ]
        );
        console.log("[subscribe] DB insert success for:", params.email);
    } catch (dbErr) {
        console.error("[subscribe] DB insert FAILED for:", params.email, dbErr);
        throw dbErr;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Record<string, unknown>;

        const email = (body.email ?? "").toString().trim().toLowerCase();
        const frequency =
            (body.frequency ?? "Daily x1").toString().trim() || "Daily x1";
        const preferences: string[] =
            Array.isArray(body.preferences) && body.preferences.length > 0
                ? body.preferences.map((p: unknown) => String(p).trim())
                : ["News Briefing"];
        const communities: string[] = Array.isArray(body.communities)
            ? body.communities.map((c: unknown) => String(c).trim())
            : [];
        const subCommunities: string[] = Array.isArray(body.subCommunities)
            ? body.subCommunities.map((s: unknown) => String(s).trim())
            : [];
        const source =
            (body.source ?? "Energdive Website CTA").toString().trim() ||
            "Energdive Website CTA";
        const subscribedFromUrl = cleanText(body.subscribedFromUrl, 500);
        const subscribedFromTitle = cleanText(body.subscribedFromTitle, 300);
        const subscribedFromPage = cleanText(body.subscribedFromPage, 300);

        if (!email || !EMAIL_RE.test(email)) {
            return NextResponse.json(
                { error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        // Check if the user is already subscribed
        await ensureSubscribeLetterboxTable();
        const existing = await query(
            `SELECT id FROM subscribe_letterbox WHERE LOWER(email) = $1 LIMIT 1`,
            [email]
        );
        if (existing.rows.length > 0) {
            return NextResponse.json(
                { error: "You are already subscribed." },
                { status: 400 }
            );
        }

        if (!VALID_FREQUENCIES.some((vf) => frequency.startsWith(vf))) {
            return NextResponse.json(
                { error: "Please select a frequency (Daily, Weekly, or Monthly)." },
                { status: 400 }
            );
        }

        if (
            preferences.length === 0 ||
            !preferences.every((p) => VALID_PREFERENCES.includes(p))
        ) {
            return NextResponse.json(
                { error: "Please select at least one valid content preference." },
                { status: 400 }
            );
        }

        const allValidSectors = Object.keys(VALID_SECTORS);
        const allValidSubs = Object.values(VALID_SECTORS).flat();

        if (communities.length > 0) {
            const invalid = communities.filter((c) => !allValidSectors.includes(c));
            if (invalid.length > 0) {
                return NextResponse.json(
                    { error: `Invalid community: ${invalid.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        if (subCommunities.length > 0) {
            const invalid = subCommunities.filter((s) => !allValidSubs.includes(s));
            if (invalid.length > 0) {
                return NextResponse.json(
                    { error: `Invalid sub-community: ${invalid.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        const requestIp = getClientIp(req);
        const browserIp = normalizeIp(body.clientIp);
        const browserLocation = cleanText(body.clientLocation);
        const hasPublicRequestIp = isPublicIp(requestIp);
        const ip = hasPublicRequestIp ? requestIp : browserIp || requestIp;
        const resolvedLocation = await resolveLocationByIp(ip);
        const location = hasPublicRequestIp
            ? resolvedLocation || browserLocation
            : browserLocation || resolvedLocation;

        await insertSubscribeLetterbox({
            email,
            location,
            ip,
            source,
            subscribedFromUrl,
            subscribedFromTitle,
            subscribedFromPage,
        });

        // --- Non-blocking: Brevo, email, PostHog ---
        // DB insert is the source of truth. If any of these fail,
        // the user still gets a success response.

        try {
            await axios.post(
                BREVO_API,
                {
                    email,
                    attributes: {
                        FREQUENCY: frequency,
                        PREFERENCE: preferences.join(", "),
                        COMMUNITY: communities.join(", "),
                        SUB_COMMUNITY: subCommunities.join(", "),
                        SOURCE: source,
                    },
                    listIds: [BREVO_LIST_ID],
                    updateEnabled: true,
                },
                {
                    headers: {
                        "api-key": process.env.BREVO_API_KEY!,
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (brevoErr: unknown) {
            if (!isExistingBrevoContactError(brevoErr)) {
                console.warn("[subscribe] Brevo sync failed (non-blocking):", (brevoErr as BrevoRequestError).response?.data || (brevoErr as BrevoRequestError).message);
            }
        }

        try {
            await sendNewsletterSubscriptionThanksEmail(email);
        } catch (emailErr) {
            console.warn("[subscribe] Thank-you email failed (non-blocking):", emailErr);
        }

        try {
            getPostHogClient().capture({
                distinctId: email,
                event: "newsletter_subscribed",
                properties: {
                    email,
                    frequency,
                    preferences,
                    source,
                    location,
                    subscribed_from_url: subscribedFromUrl,
                    subscribed_from_title: subscribedFromTitle,
                    subscribed_from_page: subscribedFromPage,
                    community_count: communities.length,
                    sub_community_count: subCommunities.length,
                    communities,
                },
            });
        } catch (phErr) {
            console.warn("[subscribe] PostHog capture failed (non-blocking):", phErr);
        }

        return NextResponse.json({
            success: true,
            message: "You're subscribed successfully. Please check your inbox.",
        });
    } catch (err: unknown) {
        const error = err as BrevoRequestError;

        console.error("[subscribe] API error:", error.response?.data || error.message || err);

        return NextResponse.json(
            { error: "Something went wrong. Please try again later." },
            { status: 500 }
        );
    }
}
