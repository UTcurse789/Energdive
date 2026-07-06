import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Calendar, Clock, MapPin } from "lucide-react";
import ArticleBody from "@/components/ArticleBody";
import { DateChip } from "@/components/ui/date-chip";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getCanonicalUrl } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { getEventStartTimestamp, isEventDatePast } from "@/lib/event-dates";
import { getEventBrochureResourcesForEvent } from "@/lib/resource-center";
import { EventBrochureDownloads } from "@/components/events/event-brochure-downloads";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

type EventImage = {
    url?: string;
    formats?: {
        large?: { url?: string };
        medium?: { url?: string };
        small?: { url?: string };
        thumbnail?: { url?: string };
    };
};

type EventRecord = {
    id: number | string;
    title?: string;
    slug?: string;
    date?: string;
    time?: string;
    location?: string;
    venue?: string;
    url?: string;
    mapUrl?: string;
    occurrence?: string;
    description?: RichTextBlock[];
    image?: EventImage[] | EventImage;
};

type RichTextChild = {
    text?: string;
};

type RichTextBlock = {
    children?: RichTextChild[];
};

function readImageUrl(image: EventRecord["image"]): string {
    const source = Array.isArray(image) ? image[0] : image;
    const rawUrl =
        source?.url || 
        source?.formats?.large?.url ||
        source?.formats?.medium?.url ||
        source?.formats?.small?.url ||
        source?.formats?.thumbnail?.url;

    return rawUrl ? strapiImageUrl(rawUrl) : getCanonicalUrl("/og-image.jpg");
}

function getDescriptionText(description?: RichTextBlock[]): string {
    if (!Array.isArray(description)) return "";

    return description
        .map((block) =>
            Array.isArray(block?.children)
                ? block.children.map((child) => child?.text || "").join("")
                : ""
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

async function getEvent(slug: string): Promise<EventRecord | null> {
    const res = await fetch(
        `${STRAPI_BASE}/api/events?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
        { next: { revalidate: 3600 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json?.data?.[0] ?? null;
}

async function getRelatedEvents(currentSlug: string): Promise<EventRecord[]> {
    const res = await fetch(
        `${STRAPI_BASE}/api/events?populate=*&pagination[pageSize]=50`,
        { next: { revalidate: 3600 } }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const events: EventRecord[] = Array.isArray(json?.data) ? json.data : [];
    
    const filtered = events.filter((item) => item.slug && item.slug !== currentSlug);
    const upcoming = filtered.filter((item) => !isEventDatePast(item.date));
    const past = filtered.filter((item) => isEventDatePast(item.date));

    upcoming.sort((a, b) => getEventStartTimestamp(a.date) - getEventStartTimestamp(b.date));
    past.sort((a, b) => getEventStartTimestamp(b.date) - getEventStartTimestamp(a.date));

    return [...upcoming, ...past].slice(0, 3);
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const event = await getEvent(slug);

    if (!event) {
        return {
            title: { absolute: "Event - ENERGDIVE" },
            description: "Explore ENERGDIVE events, conferences, and industry gatherings.",
        };
    }

    const title = event.title || "Event";
    const cleanTitle = String(title).replace(/^['"\%$@#^*]+|['"\%$@#^*]+$/g, "").trim();
    const shareTitle = `${cleanTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/events/${slug}`);
    const description =
        getDescriptionText(event.description).slice(0, 160) ||
        "Explore ENERGDIVE events, conferences, and industry gatherings.";
    const imageUrl = readImageUrl(event.image);

    return {
        title: { absolute: shareTitle },
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: shareTitle,
            description,
            url: canonicalUrl,
            siteName: "ENERGDIVE",
            type: "website",
            images: [{ url: imageUrl, width: 1200, height: 630, alt: shareTitle }],
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description,
            images: [imageUrl],
        },
    };
}

// CHANGED: image max-width downscaled for a perfect, well-proportioned view
function EventHeroCard({ imageUrl, title }: { imageUrl: string; title: string }) {
    return (
        <div className="relative w-full overflow-hidden rounded-xl bg-white flex items-center justify-center p-6 sm:p-8 shadow-sm border border-slate-100">
            <img
                src={imageUrl}
                alt={title || "Event Banner"}
                className="w-full h-auto max-w-[280px] sm:max-w-[360px] md:max-w-[420px] object-contain transition-transform duration-300 transform hover:scale-[1.01]"
                loading="eager"
            />
        </div>
    );
}

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const event = await getEvent(slug);

    if (!event) notFound();

    const [relatedEvents, eventBrochures] = await Promise.all([
        getRelatedEvents(slug),
        getEventBrochureResourcesForEvent({
            id: event.id,
            slug: event.slug || slug,
        }),
    ]);
    const imageUrl = readImageUrl(event.image);
    const registrationUrl = event.url && /^https?:\/\//.test(event.url) ? event.url : null;
    const mapUrl = event.mapUrl && /^https?:\/\//.test(event.mapUrl) ? event.mapUrl : null;
    const isUpcoming = event.occurrence === "upcoming";

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-[#00A651]/20">
            <ScrollProgress />
            <Header />

            <nav className="border-b border-slate-200/80 bg-white">
                <div className="container mx-auto max-w-6xl px-6 py-4">
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors duration-200 hover:text-emerald-600 mb-5"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to events
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto max-w-6xl px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
                    
                    {/* Main Content Area */}
                    <article className="min-w-0 space-y-6">
                        <header className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3 mt-8">
                                <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                    isUpcoming 
                                        ? "bg-emerald-50 text-emerald-700" 
                                        : "bg-slate-100 text-slate-700"
                                }`}>
                                    {event.occurrence || "event"}
                                </span>
                                {event.date && (
                                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                                        <DateChip value={event.date} />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl leading-tight font-sans uppercase">
                                {event.title}
                            </h1>
                        </header>

                        {/* Perfectly Proportioned Hero Block */}
                        <EventHeroCard imageUrl={imageUrl} title={event.title || ""} />

                        {/* Event Description Card */}
                        {Array.isArray(event.description) && event.description.length > 0 && (
                            <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-100">
                                <ArticleBody content={event.description} />
                            </section>
                        )}
                    </article>

                    {/* Sidebar Area */}
                    <aside className="space-y-6 mt-10 mb-10">
                        
                        {/* Event Details Card */}
                        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5 mb-3.5">
                                Event Details
                            </h2>

                            <div className="space-y-3 text-sm text-slate-600">
                                {event.date && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>{event.date}</span>
                                    </div>
                                )}
                                {event.time && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span>{event.time}</span>
                                    </div>
                                )}
                                {(event.venue || event.location) && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        <span className="line-clamp-2">{event.venue || event.location}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 space-y-2.5">
                                {registrationUrl && (
                                    <Link
                                        href={registrationUrl}
                                        target="_blank"
                                        rel="noopener"
                                        className="inline-flex w-full items-center justify-center gap-2 bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] rounded-xl shadow-sm"
                                    >
                                        Visit event site
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                                {mapUrl && (
                                    <Link
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener"
                                        className="inline-flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl"
                                    >
                                        Open map
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                            </div>
                        </section>

                        <EventBrochureDownloads
                            resources={eventBrochures}
                            returnTo={`/events/${slug}`}
                        />

                        {/* More Events Widget */}
                        {relatedEvents.length > 0 && (
                            <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5 mb-3.5">
                                    More Events
                                </h2>

                                <div className="space-y-3">
                                    {relatedEvents.map((item) => {
                                        const itemImageUrl = readImageUrl(item.image);
                                        return (
                                            <Link
                                                key={item.id}
                                                href={`/events/${item.slug}`}
                                                className="flex flex-row items-center gap-3.5 p-2 bg-white rounded-lg border border-slate-100 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                            >
                                                {/* Left Side (Compact Thumbnail) */}
                                                <div className="w-14 h-11 shrink-0 relative overflow-hidden rounded-md bg-white border border-slate-100 p-1 flex items-center justify-center">
                                                    <img
                                                        src={itemImageUrl}
                                                        alt={item.title || "Event logo"}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>

                                                {/* Right Side (Content Column) */}
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <h3 className="font-bold text-xs text-slate-800 line-clamp-1 uppercase leading-snug hover:text-emerald-600 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    {item.date && (
                                                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                            {item.date}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}
