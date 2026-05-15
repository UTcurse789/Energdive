import { NextResponse } from "next/server";
import axios from "axios";
import { getPostHogClient } from "@/lib/posthog-server";

/* ─── Constants ──────────────────────────────────────── */
const BREVO_LIST_ID = 7;
const BREVO_API = "https://api.brevo.com/v3/contacts";

/* ─── Validation helpers ─────────────────────────────── */
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
        "Upstream", "Pipelines", "Refining", "Petrochemicals",
        "CGD", "LPG", "Retail", "Oil Markets",
    ],
    "Power Generation": ["Thermal", "Nuclear"],
    "Renewables": [
        "Solar", "Wind", "Hydro", "Biopower",
        "Cogeneration", "Waste-to-Energy",
    ],
    "Transmission": ["Smart Grid"],
    "Distribution": [
        "Smart Meters & AMI", "EV Charging", "Data Centres",
        "Smart Cities", "Railways & Metros",
    ],
    "Electricity Markets": ["Power Markets", "Carbon Markets", "RCO"],
    "New Energies": ["Green Hydrogen", "E-Fuels"],
    "Energy Storage": ["BESS", "Pumped Hydro", "CAES", "Thermal", "Flywheel"],
    "Sustainability & Safety": [
        "Energy Efficiency", "Occupational Health",
        "Industrial & Process Safety", "Environment",
    ],
};

/* ─── POST /api/subscribe ────────────────────────────── */
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const email = (body.email ?? "").toString().trim().toLowerCase();
        const frequency = (body.frequency ?? "").toString().trim();
        const preferences: string[] = Array.isArray(body.preferences)
            ? body.preferences.map((p: unknown) => String(p).trim())
            : [];
        const communities: string[] = Array.isArray(body.communities)
            ? body.communities.map((c: unknown) => String(c).trim())
            : [];
        const subCommunities: string[] = Array.isArray(body.subCommunities)
            ? body.subCommunities.map((s: unknown) => String(s).trim())
            : [];

        /* ── Validate ────────────────────────────── */
        if (!email || !EMAIL_RE.test(email)) {
            return NextResponse.json(
                { error: "Please provide a valid email address." },
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

        // Validate communities
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

        /* ── Create/update contact in Brevo ──────── */
        await axios.post(
            BREVO_API,
            {
                email,
                attributes: {
                    FREQUENCY: frequency,
                    PREFERENCE: preferences.join(", "),
                    COMMUNITY: communities.join(", "),
                    SUB_COMMUNITY: subCommunities.join(", "),
                    SOURCE: "Energdive Website CTA",
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

        console.log("✅ Subscriber added to Brevo:", email);

        getPostHogClient().capture({
            distinctId: email,
            event: "newsletter_subscribed",
            properties: {
                email,
                frequency,
                preferences,
                community_count: communities.length,
                sub_community_count: subCommunities.length,
                communities,
            },
        });

        return NextResponse.json({
            success: true,
            message: "You're subscribed successfully! 🚀",
        });
    } catch (err: any) {
        console.error(
            "❌ Subscribe API error:",
            err.response?.data || err.message
        );

        // Brevo returns 'duplicate parameter' if contact already in list
        // but with updateEnabled it should work — handle edge cases
        if (err.response?.status === 400 && err.response?.data?.message?.includes("Contact already exist")) {
            return NextResponse.json({
                success: true,
                message: "You're already subscribed! We've updated your preferences. 🚀",
            });
        }

        return NextResponse.json(
            { error: "Something went wrong. Please try again later." },
            { status: 500 }
        );
    }
}
