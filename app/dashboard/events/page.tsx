"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    Calendar, MapPin, Clock, ExternalLink, Loader2, AlertCircle,
    CalendarDays, ArrowRight,
} from "lucide-react";

interface EventItem {
    id: string;
    title: string;
    slug: string;
    date: string;
    time: string;
    location: string;
    venue: string;
    url: string;
    mapUrl: string;
    description: string;
    occurrence: string;
    image: string | null;
}

export default function EventsPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`/api/dashboard/events?occurrence=${tab}&pageSize=20`);
                if (!res.ok) throw new Error(`Failed (${res.status})`);
                const data = await res.json();
                setEvents(data.events || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [tab]);

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <CalendarDays size={22} style={{ color: "var(--dash-accent)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--dash-text)" }}>Events</h1>
                        <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                            Industry conferences, webinars, and networking opportunities
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div
                className="flex items-center gap-1 p-1.5 rounded-xl mb-7 w-fit"
                style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
            >
                <button
                    onClick={() => setTab("upcoming")}
                    className="py-2.5 px-6 rounded-lg text-sm font-semibold transition-all"
                    style={tab === "upcoming"
                        ? { background: "var(--dash-accent)", color: "#0A0A0B", boxShadow: "0 2px 8px rgba(201,168,76,0.3)" }
                        : { color: "var(--dash-text-muted)" }}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setTab("past")}
                    className="py-2.5 px-6 rounded-lg text-sm font-semibold transition-all"
                    style={tab === "past"
                        ? { background: "var(--dash-accent)", color: "#0A0A0B", boxShadow: "0 2px 8px rgba(201,168,76,0.3)" }
                        : { color: "var(--dash-text-muted)" }}
                >
                    Past Events
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "var(--dash-accent)" }} />
                    <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>Loading events...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center py-20">
                    <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            ) : events.length === 0 ? (
                <div
                    className="rounded-xl p-12 text-center"
                    style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
                >
                    <CalendarDays size={36} className="mx-auto mb-3" style={{ color: "var(--dash-border)" }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--dash-text-muted)" }}>
                        No {tab} events
                    </p>
                    <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                        {tab === "upcoming" ? "Check back soon for upcoming events." : "No past events recorded."}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md group"
                            style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div
                                    className="w-full md:w-56 h-40 md:h-auto relative flex-shrink-0 flex items-center justify-center"
                                    style={{ background: "var(--dash-surface-2)" }}
                                >
                                    {event.image ? (
                                        <Image
                                            src={event.image}
                                            alt={event.title}
                                            fill
                                            className="object-contain p-4"
                                        />
                                    ) : (
                                        <CalendarDays size={40} style={{ color: "var(--dash-border)" }} />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-6">
                                    {/* Occurrence badge */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                            style={
                                                event.occurrence === "upcoming"
                                                    ? { background: "rgba(76,175,80,0.15)", color: "#4CAF50" }
                                                    : { background: "rgba(161,161,170,0.15)", color: "var(--dash-text-dim)" }
                                            }
                                        >
                                            {event.occurrence === "upcoming" ? "🟢 Upcoming" : "Past Event"}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold leading-tight mb-3" style={{ color: "var(--dash-text)" }}>
                                        {event.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--dash-text-muted)" }}>
                                        {event.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex flex-wrap items-center gap-5 mb-5 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                        {event.date && (
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Calendar size={14} style={{ color: "var(--dash-accent)" }} />
                                                {event.date}
                                            </span>
                                        )}
                                        {event.time && (
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} /> {event.time}
                                            </span>
                                        )}
                                        {event.location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin size={14} /> {event.location}
                                                {event.venue ? ` — ${event.venue}` : ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        {event.url && (
                                            <a
                                                href={event.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                                                style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                            >
                                                {event.occurrence === "upcoming" ? "Register Now" : "View Details"}
                                                <ArrowRight size={13} />
                                            </a>
                                        )}
                                        {event.mapUrl && (
                                            <a
                                                href={event.mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                                                style={{ background: "var(--dash-surface-2)", color: "var(--dash-text)", border: "1px solid var(--dash-border)" }}
                                            >
                                                <MapPin size={13} /> View Map
                                                <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
