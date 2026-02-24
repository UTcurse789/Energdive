"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

async function fetchReports() {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Reports&populate=*`,
    { next: { revalidate: 120 } }
  );
  const json = await res.json();
  return json?.data ?? [];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  useEffect(() => {
    fetchReports().then((data) => {
      const formatted = data.map((item: any) => ({
        id: item.id,
        title: item.Title,
        slug: item.slug,
        date: item.publishedAt || item.Date,
        category: "Reports",
        excerpt: item?.Excerpt?.[0]?.children?.[0]?.text || "",
        image: item?.FeaturedImage?.url ? `${STRAPI}${item.FeaturedImage.url}` : null,
      }));
      setReports(formatted);
      setLoading(false);
    });
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || report.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [reports, searchQuery, selectedCategory]);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Header />
      <div className="pt-20">
        <div className="w-full h-[70vh] bg-zinc-900 flex items-center px-6 lg:px-12">
          <div className="max-w-4xl w-full">
            <Skeleton className="h-24 w-3/4 mb-6 bg-white/20" />
            <Skeleton className="h-8 w-1/2 bg-white/10" />
          </div>
        </div>
        <div className="container mx-auto px-6 lg:px-12 py-20 mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-8">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">
      <main className="relative pb-32">
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[70vh] flex items-center bg-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <motion.div
              style={{ y: y1 }}
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#FDFDFD]" />
          </div>

          <div className="container mx-auto px-6 lg:px-12 max-w-[1400px] relative z-10 pt-20">
            <div className="flex flex-col gap-6 max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-6xl md:text-9xl font-black uppercase italic text-[#00A651]"
              >
                Reports
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl font-medium text-white/80 leading-relaxed"
              >
                Explore in-depth reports featuring data-driven analysis, sector insights,
                policy reviews, and market intelligence shaping India’s evolving energy landscape.
              </motion.p>
            </div>
          </div>
        </section>

        {/* SEARCH & FILTER AREA */}
        <div className="container mx-auto px-6 lg:px-12 max-w-[1400px] mt-16 mb-20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-zinc-200 pb-12">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`hover:text-black transition-colors ${selectedCategory === "All" ? "text-[#00A651]" : ""}`}
              >
                All Reports
              </button>
            </div>
          </div>
        </div>

        {/* REPORTS GRID */}
        <div className="container mx-auto px-6 lg:px-12 max-w-[1400px]">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24"
          >
            <AnimatePresence mode='popLayout'>
              {filteredReports.map((report, index) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.slug}`}
                  className="group block outline-none"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col h-full"
                  >
                    {/* IMAGE CONTAINER */}
                    <div className="relative aspect-3/4 bg-zinc-100 overflow-hidden rounded-2xl mb-8">
                      {report.image && (
                        <Image
                          src={report.image}
                          alt={report.title}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                      )}
                      <div className="absolute bottom-6 right-6 bg-white p-4 rounded-full shadow-2xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <ArrowUpRight size={20} className="text-black" />
                      </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase">
                        <span className="text-[#00A651]">{report.category}</span>
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock size={10} />
                          {formatDate(report.date)}
                        </span>
                      </div>

                      <h3 className="text-3xl font-bold font-serif leading-tight group-hover:text-[#00A651] transition-colors">
                        {report.title}
                      </h3>

                      <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
                        {report.excerpt}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
