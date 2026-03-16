import { SectionHeading } from "@/components/ui/section-heading";
import { EventCard } from "../ui/event-card";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = "https://cms.energdive.com";

async function getEvents() {
    try {
        const res = await fetch(`${STRAPI_BASE}/api/events?populate=*`, {
            cache: 'no-store',
        });
        if (!res.ok) return [];
        const json = await res.json();
        const data = json.data || [];

        // Filter only upcoming events (same as events page default)
        const upcomingEvents = data.filter(
            (event: any) => event.occurrence?.toLowerCase() === "upcoming"
        );

        // Parse date strings like "01st - 03rd September 2026" or "26 February 2026"
        const parseEventDate = (dateString?: string) => {
            if (!dateString) return 0;
            const str = String(dateString).toLowerCase();
            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            let monthIndex = 0;
            for (let i = 0; i < months.length; i++) {
                if (str.includes(months[i])) {
                    monthIndex = i;
                    break;
                }
            }
            let year = new Date().getFullYear();
            const yearMatch = str.match(/\b(20\d\d)\b/);
            if (yearMatch) year = parseInt(yearMatch[1], 10);
            let day = 1;
            const dayMatch = str.match(/(\d{1,2})/);
            if (dayMatch) day = parseInt(dayMatch[1], 10);
            return new Date(year, monthIndex, day).getTime();
        };

        // Sort by date — soonest first
        const sortedEvents = upcomingEvents.sort((a: any, b: any) => {
            return parseEventDate(a.date) - parseEventDate(b.date);
        });

        return sortedEvents.map((event: any) => {
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
                    .map((block: any) =>
                        (block.children || []).map((c: any) => c.text || "").join("")
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
        <section className="py-16 border-b border-border overflow-hidden">
            <div className="container">
                <SectionHeading
                    title="Upcoming Events"
                    linkText="View Calendar"
                    linkHref="/events"
                />
                <div className="flex gap-5 overflow-x-auto pb-6 snap-x mt-8"
                    style={{ scrollbarWidth: "none" }}
                >
                    {events.map((event: any) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </section>
    );
}