import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import ArticleBody from "@/components/ArticleBody";
import { DateChip } from "@/components/ui/date-chip";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getCanonicalUrl } from "@/lib/seo";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

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
    image?: Array<{
        url?: string;
        formats?: {
            large?: { url?: string };
            medium?: { url?: string };
            small?: { url?: string };
            thumbnail?: { url?: string };
        };
    }> | { url?: string };
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
        source?.formats?.large?.url ||
        source?.formats?.medium?.url ||
        source?.formats?.small?.url ||
        source?.formats?.thumbnail?.url ||
        source?.url;

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
        `${STRAPI_BASE}/api/events?populate=*&pagination[pageSize]=3&sort=createdAt:desc`,
        { next: { revalidate: 3600 } }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const events = Array.isArray(json?.data) ? json.data : [];
    return events.filter((item: EventRecord) => item.slug && item.slug !== currentSlug).slice(0, 3);
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
    const cleanTitle = String(title).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/events/${slug}`);
    const description =
        getDescriptionText(event.description).slice(0, 160) ||
        "Explore ENERGDIVE events, conferences, and industry gatherings.";
    const imageUrl = readImageUrl(event.image);

    return {
        title: { absolute: shareTitle },
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: shareTitle,
            description,
            url: canonicalUrl,
            siteName: "ENERGDIVE",
            type: "website",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: shareTitle,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description,
            images: [imageUrl],
        },
    };
}

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const event = await getEvent(slug);

    if (!event) notFound();

    const relatedEvents = await getRelatedEvents(slug);
    const imageUrl = readImageUrl(event.image);
    const descriptionText = getDescriptionText(event.description);
    const registrationUrl = event.url && /^https?:\/\//.test(event.url) ? event.url : null;
    const mapUrl = event.mapUrl && /^https?:\/\//.test(event.mapUrl) ? event.mapUrl : null;

    return (
        <div className="min-h-screen bg-[#f5f7fa] text-zinc-900">
            <ScrollProgress />

            <section className="border-b border-zinc-200 bg-white">
                <div className="container mx-auto max-w-6xl px-6 py-6">
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-[#00A651]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to events
                    </Link>
                </div>
            </section>

            <main className="container mx-auto grid max-w-6xl gap-12 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="min-w-0">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full border border-[#00A651]/20 bg-[#00A651]/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00A651]">
                            {event.occurrence || "event"}
                        </span>
                        {event.date && <DateChip value={event.date} />}
                    </div>

                    <h1 className="max-w-4xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
                        {event.title}
                    </h1>

                    {descriptionText && (
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600">
                            {descriptionText}
                        </p>
                    )}

                    <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm">
                        <Image
                            src={imageUrl}
                            alt={event.title || "Event"}
                            fill
                            priority
                            className="object-contain p-8"
                        />
                    </div>

                    {Array.isArray(event.description) && event.description.length > 0 && (
                        <div className="prose prose-lg mt-10 max-w-none rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm">
                            <ArticleBody content={event.description} />
                        </div>
                    )}
                </article>

                <aside className="space-y-6">
                    <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">
                            Event Details
                        </h2>

                        <div className="mt-6 space-y-4 text-sm text-zinc-600">
                            {event.date && (
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#00A651]" />
                                    <span>{event.date}</span>
                                </div>
                            )}
                            {event.time && (
                                <div className="flex items-start gap-3">
                                    <Clock3 className="mt-0.5 h-4 w-4 text-[#00A651]" />
                                    <span>{event.time}</span>
                                </div>
                            )}
                            {(event.venue || event.location) && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-[#00A651]" />
                                    <span>{event.venue || event.location}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            {registrationUrl && (
                                <Link
                                    href={registrationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00A651]"
                                >
                                    Visit event site
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            )}
                            {mapUrl && (
                                <Link
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                                >
                                    Open map
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {relatedEvents.length > 0 && (
                        <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">
                                More Events
                            </h2>

                            <div className="mt-6 space-y-5">
                                {relatedEvents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/events/${item.slug}`}
                                        className="block rounded-2xl border border-zinc-200 p-4 transition-colors hover:border-[#00A651]"
                                    >
                                        <p className="text-base font-semibold leading-6 text-zinc-900">
                                            {item.title}
                                        </p>
                                        {item.date && (
                                            <p className="mt-2 text-sm text-zinc-500">
                                                {item.date}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}
