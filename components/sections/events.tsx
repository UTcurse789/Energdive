import { SectionHeading } from "@/components/ui/section-heading";
import { EventCard } from "../ui/event-card";
import { filterAndSortEventsByOccurrence } from "@/lib/event-dates";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = "https://cms.energdive.com";

type EventImage = {
    url?: string | null;
    formats?: {
        thumbnail?: {
            url?: string | null;
        };
    };
};

type EventDescriptionBlock = {
    children?: Array<{
        text?: string | null;
    }>;
};

type StrapiEvent = {
    id?: number | string;
    title?: string;
    slug?: string;
    date?: string;
    venue?: string;
    location?: string;
    image?: EventImage[] | EventImage | null;
    description?: EventDescriptionBlock[] | string;
    url?: string;
    occurrence?: string;
};

type SectionEvent = {
    id: string;
    title: string;
    slug: string;
    date: string;
    location: string;
    image: string;
    description: string;
    url: string;
};

async function getEvents(): Promise<SectionEvent[]> {
    try {
        const res = await fetch(`${STRAPI_BASE}/api/events?populate=image`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        const data: StrapiEvent[] = Array.isArray(json.data) ? json.data : [];

        const sortedEvents = filterAndSortEventsByOccurrence(data, "upcoming");

        return sortedEvents.map((event) => {
            // image is an ARRAY in this Strapi schema
            const imgArray = Array.isArray(event.image) ? event.image : [];
            const img = imgArray[0];

            let imageUrl = "/magazine-default.jpg";
            if (img) {
                const rawUrl = img.url || img.formats?.thumbnail?.url || null;
                if (rawUrl) {
                    imageUrl = strapiImageUrl(rawUrl);
                }
            }

            // description is rich text array
            const description = Array.isArray(event.description)
                ? event.description
                    .map((block) =>
                        (block.children || []).map((child) => child.text || "").join("")
                    )
                    .join(" ")
                : event.description || "";

            return {
                id: String(event.id),
                title: event.title || "",
                slug: event.slug || String(event.id),
                date: event.date || "",
                location: event.venue || event.location || "TBA",
                image: imageUrl,
                description,
                url: event.url || "",
                // time: event.time || "",
            };
        });
    } catch (err) {
        console.error("Events fetch error:", err);
        return [];
    }
}

export async function EventsSection() {
    const events = await getEvents();
    if (events.length === 0) return null;

    return (
        <section className="py-12 lg:py-8 border-b border-border overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                <SectionHeading
                    title="Upcoming Events"
                    linkText="View more"
                    linkHref="/events"
                />
                <div className="flex gap-5 overflow-x-auto pb-6 snap-x mt-8"
                    style={{ scrollbarWidth: "none" }}
                >
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </section>
    );
}
