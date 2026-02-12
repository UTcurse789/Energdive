"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EVENTS } from "@/data/dummy";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, ArrowUpRight, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventsPage() {
    const [activeTab, setActiveTab] = useState("upcoming");

    const tabs = [
        { id: "ongoing", label: "Ongoing" },
        { id: "upcoming", label: "Upcoming" },
        { id: "past", label: "Past Summits" },
    ];

    const filteredEvents = useMemo(() => {
        return EVENTS.filter(event => event.status?.toLowerCase() === activeTab);
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30">
            <Header />

            <main className="relative pt-10 pb-32">
                {/* 1. HERO SECTION */}
                <section className="container mx-auto px-6 lg:px-12 mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-none uppercase italic"
                    >
                        Global <span className="text-[#00A651] not-italic">Summits.</span>
                    </motion.h1>
                </section>

                {/* 2. TAB NAVIGATION */}
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

                {/* 3. GRID SECTION */}
                <section className="container mx-auto px-6 lg:px-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                        >
                            {filteredEvents.map((event, idx) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group flex flex-col h-full bg-white relative rounded-2rem 
                                    border border-zinc-100
                                    shadow-[0_2px_20px_rgba(0,0,0,0.04)] 
                                    hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] 
                                    hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                                >
                                    {/* CARD IMAGE CONTAINER */}
                                    <div className="relative aspect-16/10 bg-zinc-50 border-b border-zinc-100">
                                        <Image
                                            src={event.image}
                                            alt={event.title}
                                            fill
                                            className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                                        />

                                        {/* Status Badge - Floating nicely */}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-zinc-100">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                event.status === "ongoing" ? "bg-[#00A651] animate-pulse" :
                                                    event.status === "upcoming" ? "bg-yellow-400" : "bg-red-500"
                                            )} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-900">
                                                {event.status}
                                            </span>
                                        </div>

                                        {/* Completed Overlay */}
                                        {event.status === "past" && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                                                <span className="bg-red-600 text-white px-4 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-lg">
                                                    Concluded
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTENT AREA */}
                                    <div className="flex flex-col grow p-8">
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 leading-[1.1] mb-4 group-hover:text-[#00A651] transition-colors line-clamp-2">
                                            {event.title}
                                        </h3>

                                        <p className="text-sm text-zinc-500 font-serif italic leading-relaxed mb-8 line-clamp-3">
                                            {event.description}
                                        </p>

                                        <div className="mt-auto space-y-4">
                                            {/* Date & Time Row */}
                                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-[#00A651]" />
                                                    <span>{event.date}</span>
                                                </div>
                                                <div className="w-1 h-1 bg-zinc-200 rounded-full hidden sm:block" />
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-[#00A651]" />
                                                    <span>{event.time}</span>
                                                </div>
                                            </div>

                                            {/* Location Row (Clickable) */}
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
                                                    <div className="text-xs font-bold text-zinc-900 leading-tight mb-0.5 group-hover/map:text-[#00A651] transition-colors">
                                                        {event.venue}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">
                                                        {event.location}
                                                    </div>
                                                </div>
                                                <Navigation size={14} className="text-zinc-300 group-hover/map:text-[#00A651] transition-colors" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* FOOTER ACTION */}
                                    <div className="px-8 pb-8 pt-0">
                                        <a
                                            href={event.url}
                                            target="_blank"
                                            className="w-full py-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black transition-all group-hover:shadow-lg"
                                        >
                                            View Agenda <ArrowUpRight size={14} />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </section>
            </main>

            <Footer />
        </div>
    );
}