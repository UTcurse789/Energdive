import { NextResponse } from "next/server";
import { filterAndSortEventsByOccurrence } from "@/lib/event-dates";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

type EventOccurrence = "upcoming" | "past";

type StrapiImage = {
    url?: string | null;
};

type StrapiRichTextBlock = {
    type?: string;
    children?: Array<{
        text?: string | null;
    }>;
};

type StrapiEvent = {
    id?: number | string;
    title?: string;
    slug?: string;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    venue?: string | null;
    url?: string | null;
    mapUrl?: string | null;
    description?: StrapiRichTextBlock[] | string;
    occurrence?: string | null;
    image?: StrapiImage[] | StrapiImage | null;
};

function isEventOccurrence(value: string | null): value is EventOccurrence {
    return value === "upcoming" || value === "past";
}

function getDescriptionText(value: StrapiEvent["description"]) {
    if (typeof value === "string") {
        return value;
    }

    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .filter((block) => block.type === "paragraph")
        .map((block) => (block.children || []).map((child) => child.text || "").join(""))
        .join(" ")
        .slice(0, 300);
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const occurrenceParam = searchParams.get("occurrence");
        const occurrence: EventOccurrence = isEventOccurrence(occurrenceParam) ? occurrenceParam : "upcoming";

        const res = await fetch(`${STRAPI_BASE}/api/events?populate=*`, {
            cache: "no-store",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch events" }, { status: 502 });
        }

        const json = await res.json();
        const items: StrapiEvent[] = Array.isArray(json?.data) ? json.data : [];

        const events = filterAndSortEventsByOccurrence(items, occurrence).map((item) => {
            const firstImage = Array.isArray(item.image) ? item.image[0] : item.image;
            const imageUrl = firstImage?.url ? strapiImageUrl(firstImage.url) : "/api/placeholder/400/150";

            return {
                id: String(item.id ?? ""),
                title: item.title || "Untitled Event",
                slug: item.slug || "",
                date: item.date || "",
                time: item.time || "",
                location: item.location || "",
                venue: item.venue || "",
                url: item.url || "",
                mapUrl: item.mapUrl || "",
                description: getDescriptionText(item.description),
                occurrence: item.occurrence || occurrence,
                imageUrl,
            };
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("[PUBLIC_EVENTS]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
