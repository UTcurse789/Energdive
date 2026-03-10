import { SectionHeading } from "@/components/ui/section-heading";
import { EventCard } from "../ui/event-card";

const STRAPI_BASE = "https://cms.energdive.com";

async function getEvents() {
    try {
        const res = await fetch(`${STRAPI_BASE}/api/events?populate=*`, {
            next: { revalidate: 3600 }, // 1 hour ISR
        });
        if (!res.ok) return [];
        const json = await res.json();
        const data = json.data || [];

        return data.map((event: any) => {
            // image is an ARRAY in this Strapi schema
            const imgArray = Array.isArray(event.image) ? event.image : [];
            const img = imgArray[0];

            let imageUrl = "/magazine-default.jpg";
            if (img) {
                const rawUrl = img.url || img.formats?.thumbnail?.url || null;
                if (rawUrl) {
                    imageUrl = rawUrl.startsWith("http") ? rawUrl : `${STRAPI_BASE}${rawUrl}`;
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