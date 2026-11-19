"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { DateChip } from "@/components/ui/date-chip";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  title: string;
  slug: string;
  date: string;
  location: string;
  venue: string;
  description: string;
  occurrence: string;
  imageUrl: string;
};

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past editions" },
] as const;

export default function EnergdiveEventsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("upcoming");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const response = await fetch(`/api/public/events?occurrence=${activeTab}`, { cache: "no-store" });
        const data = await response.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (error) {
        console.error("Unable to load ENERGDIVE EVENTS:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#f8faf8] text-zinc-900 selection:bg-[#00A651]/25">
      <Header />

      <main className="pb-24">
        <section
          className="relative isolate overflow-hidden px-6 py-20 text-white sm:px-10 lg:px-20 lg:py-28"
          style={{ backgroundColor: "#10261e" }}
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_20%,rgba(0,166,81,0.48),transparent_28%),radial-gradient(circle_at_15%_95%,rgba(86,166,110,0.24),transparent_30%)]" />
          <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="mx-auto max-w-[1200px]">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> The energy industry, in person
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-tighter sm:text-7xl lg:text-8xl">
              ENERGDIVE<br /><span className="text-[#46d889]">EVENTS</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-8 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              A dedicated destination for the conferences, exhibitions, forums, and conversations moving India&apos;s energy transition forward.
            </motion.p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pt-10 sm:px-10 lg:px-20">
          <div className="flex flex-col justify-between gap-5 border-b border-zinc-200 pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00A651]">Explore the calendar</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Meet the people shaping energy.</h2>
            </div>
            <div className="flex w-fit rounded-full bg-zinc-200 p-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-colors", activeTab === tab.id ? "bg-zinc-900 text-white shadow" : "text-zinc-500 hover:text-zinc-900")}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-6 py-10 md:grid-cols-2 lg:grid-cols-3">
              {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[390px] animate-pulse rounded-3xl bg-zinc-200" />) : events.map((event, index) => (
                <motion.article key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-xl">
                  <Link href={`/events/${event.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-zinc-100">
                    <Image src={event.imageUrl} alt={event.title} fill className="object-contain p-5 transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-[#10261e] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white">{event.occurrence}</span>
                  </Link>
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-2 text-[#00A651]"><CalendarDays size={15} /><DateChip value={event.date} monthFormat="long" /></div>
                    <h3 className="min-h-[3.1rem] text-xl font-black uppercase leading-tight tracking-tight group-hover:text-[#00A651]"><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-zinc-500">{event.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-xs font-bold text-zinc-500"><span className="flex min-w-0 items-center gap-2 truncate"><MapPin size={14} className="shrink-0 text-[#00A651]" />{event.venue || event.location}</span><Link href={`/events/${event.slug}`} aria-label={`View ${event.title}`} className="ml-3 shrink-0 rounded-full bg-zinc-100 p-2 text-zinc-900 transition-colors hover:bg-[#00A651] hover:text-white"><ArrowUpRight size={16} /></Link></div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>
          {!loading && events.length === 0 && <div className="py-20 text-center text-zinc-500">No {activeTab} events are available right now.</div>}
        </section>
      </main>
    </div>
  );
}
