"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ArrowUpRight, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { DateChip } from "@/components/ui/date-chip";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const BASE_URL = "http://206.189.132.187:1337";
    const [activeTab, setActiveTab] = useState("upcoming");

    useEffect(() => {
        // Use an internal function so we don't need external dependencies
        async function fetchEvents() {
            try {
                const res = await fetch(`${BASE_URL}/api/events?populate=image`);
                const json = await res.json();
                setEvents(json.data || []);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    const tabs = [
        { id: "ongoing", label: "Ongoing" },
        { id: "upcoming", label: "Upcoming" },
        { id: "past", label: "Past Events" },
    ];

    const filteredEvents = useMemo(() => {
        return events.filter(event => event.occurrence?.toLowerCase() === activeTab);
    }, [activeTab, events]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-[#00A651]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30">
            <Header />

            <main className="relative pt-10 pb-32">
                <section className="container mx-auto px-6 lg:px-12 mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-none uppercase italic"
                    >
                        Events <span className="text-[#00A651] not-italic">.</span>
                    </motion.h1>
                    <p className="text-gray-600 max-w-3xl text-lg leading-relaxed mt-6 mb-8">
                        Watch conversations that matter with ENERGDIVE Videos, where domain experts and sector leaders share quick insights and viewpoints on India’s evolving energy landscape.
                    </p>
                </section>

                {/* TAB NAVIGATION */}
                <section className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-y border-zinc-100 py-4 mb-12">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-full w-fit">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab.id ? "bg-black text-white shadow-lg" : "text-zinc-500 hover:text-black"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* GRID SECTION */}
                <section className="container mx-auto px-6 lg:px-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                        >
                            {filteredEvents.map((event, idx) => {
                                // FIXED: Accessing the image from the array in your JSON
                                const imageUrl = event.image?.[0]?.url
                                    ? `${BASE_URL}${event.image[0].url}`
                                    : "/api/placeholder/400/150";

                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group flex flex-col h-full bg-white relative rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="relative aspect-video bg-zinc-50 border-b border-zinc-100 overflow-hidden">
                                            <Image
                                                src={imageUrl}
                                                alt={event.title}
                                                fill
                                                className="object-contain p-10 transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-zinc-100">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    event.occurrence === "ongoing" ? "bg-[#00A651] animate-pulse" :
                                                        event.occurrence === "upcoming" ? "bg-yellow-400" : "bg-red-500"
                                                )} />
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-900">
                                                    {event.occurrence}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col grow p-8">
                                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 leading-[1.1] mb-4 group-hover:text-[#00A651] transition-colors line-clamp-2">
                                                {event.title}
                                            </h3>

                                            <div className="text-sm text-zinc-500 font-serif italic leading-relaxed mb-8 line-clamp-3">
                                                <BlocksRenderer content={event.description} />
                                            </div>

                                            <div className="mt-auto space-y-4">
                                                <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                                    <DateChip value={event.date} />
                                                    <div className="w-1 h-1 bg-zinc-200 rounded-full hidden sm:block" />
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-[#00A651]" />
                                                        <span>{event.time}</span>
                                                    </div>
                                                </div>

                                                <a
                                                    href={event.mapUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start gap-3 group/map p-3 -mx-3 rounded-xl hover:bg-zinc-50 transition-colors"
                                                >
                                                    <div className="mt-0.5 p-1.5 bg-[#00A651]/10 rounded-full text-[#00A651]">
                                                        <MapPin size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-xs font-bold text-zinc-900 leading-tight mb-0.5 group-hover/map:text-[#00A651]">
                                                            {event.venue}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">
                                                            {event.location}
                                                        </div>
                                                    </div>
                                                    <Navigation size={14} className="text-zinc-300 group-hover/map:text-[#00A651]" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="px-8 pb-8 pt-0">
                                            <a
                                                href={event.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black transition-all"
                                            >
                                                View Website <ArrowUpRight size={14} />
                                            </a>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-20 text-zinc-400 font-serif italic">
                            No summits currently listed in this category.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
