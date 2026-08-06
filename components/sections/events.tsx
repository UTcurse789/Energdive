import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight, ChevronRight } from "lucide-react";
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
            };
        });
    } catch (err) {
        console.error("Events fetch error:", err);
        return [];
    }
}

export async function EventsSection({ variant = "default" }: { variant?: "default" | "sidebar" }) {
    const events = await getEvents();
    if (events.length === 0) return null;

    if (variant === "sidebar") {
        return (
            <div className="w-full flex flex-col gap-4 pt-2">
                {/* Header: Upcoming Events > */}
                <div className="flex items-center justify-between pb-1">
                    <Link href="/events" className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-emerald-600 transition-colors">
                        Upcoming Events
                        <ChevronRight size={14} className="text-slate-900 group-hover:text-emerald-600 transition-colors stroke-[2.5]" />
                    </Link>
                </div>

                {/* Stacked Full-Width Event Cards */}
                <div className="flex flex-col divide-y divide-slate-100">
                    {events.slice(0, 4).map((event, idx) => {
                        const href = event.url || `/events/${event.slug}`;
                        const isExternal = !!event.url && event.url.startsWith("http");

                        return (
                            <article key={event.id || idx} className="py-4 first:pt-0 last:pb-0">
                                <Link
                                    href={href}
                                    target={isExternal ? "_blank" : "_self"}
                                    rel={isExternal ? "noopener" : undefined}
                                    className="group flex flex-col"
                                >
                                    {/* Thumbnail Container matching Featured Videos style */}
                                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-white mb-2.5 border border-slate-200 shadow-xs">
                                        <Image
                                            src={event.image || "/magazine-default.jpg"}
                                            alt={event.title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                        />

                                        {/* Register Badge on Top Right */}
                                        <div className="absolute top-2.5 right-2.5 bg-[#09B697] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
                                            Register ↗
                                        </div>
                                    </div>

                                    {/* Event Title */}
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                                        {event.title}
                                    </h4>

                                    {/* Date & Location (Separate lines, full text) */}
                                    <div className="mt-2 flex flex-col gap-1 text-[11px] font-medium tracking-wide">
                                        {event.date && (
                                            <div className="flex items-center gap-1.5 text-slate-600 font-semibold uppercase">
                                                <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                                <span>{event.date}</span>
                                            </div>
                                        )}
                                        {event.location && (
                                            <div className="flex items-start gap-1.5 text-slate-500 uppercase leading-snug">
                                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                                <span className="break-words">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </article>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <section className="py-12 lg:py-8 border-b border-border overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
                <SectionHeading
                    title="Upcoming Events"
                    linkText="View more"
                    linkHref="/events"
                    variant="hero"
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

