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
            <div className="w-full flex flex-col gap-3 pt-2">
                {/* Header: Upcoming Events > */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-1">
                    <Link href="/events" className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-emerald-600 transition-colors">
                        Upcoming Events
                        <ChevronRight size={14} className="text-slate-900 group-hover:text-emerald-600 transition-colors stroke-[2.5]" />
                    </Link>
                </div>

                {/* Stacked Compact Event Rows */}
                <div className="flex flex-col divide-y divide-slate-100">
                    {events.slice(0, 4).map((event, idx) => {
                        const href = event.url || `/events/${event.slug}`;
                        const isExternal = !!event.url && event.url.startsWith("http");

                        return (
                            <article key={event.id || idx} className="py-3 first:pt-0 last:pb-0">
                                <Link
                                    href={href}
                                    target={isExternal ? "_blank" : "_self"}
                                    rel={isExternal ? "noopener" : undefined}
                                    className="group flex items-start gap-3"
                                >
                                    {/* Compact Thumbnail */}
                                    <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-2xs p-1">
                                        <Image
                                            src={event.image || "/magazine-default.jpg"}
                                            alt={event.title}
                                            fill
                                            sizes="96px"
                                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Event Details */}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider block mb-0.5">
                                            Register ↗
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                                            {event.title}
                                        </h4>
                                        <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-medium text-slate-500">
                                            {event.date && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                                    <span className="truncate">{event.date}</span>
                                                </div>
                                            )}
                                            {event.location && (
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                        </div>
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

