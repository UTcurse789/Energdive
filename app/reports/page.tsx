"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { AdBanner } from "@/components/ads/AdBanner";
import { strapiImageUrl } from "@/lib/strapi-image";
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

type StrapiReportItem = {
  id: number;
  Title: string;
  slug: string;
  publishedAt?: string;
  Date?: string;
  Excerpt?: Array<{
    children?: Array<{
      text?: string;
    }>;
  }>;
  FeaturedImage?: {
    url?: string | null;
  } | null;
};

type ReportSummary = {
  id: number;
  title: string;
  slug: string;
  date: string;
  category: string;
  excerpt: string;
  image: string | null;
};

async function fetchReports(): Promise<StrapiReportItem[]> {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Reports&populate=*&sort=Date:desc`,
    { next: { revalidate: 3600 } }
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
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchReports().then((data) => {
      const formatted = data.map((item) => ({
        id: item.id,
        title: item.Title,
        slug: item.slug,
        date: item.publishedAt || item.Date || "",
        category: "Reports",
        excerpt: item?.Excerpt?.[0]?.children?.[0]?.text || "",
        image: item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : null,
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

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-32 pb-16">
        <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-5">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 overflow-x-hidden">
      <main>
        {/* ════════════════════════════════════════════
            HERO — Clean typographic header
            ════════════════════════════════════════════ */}
        <section className="bg-white pt-16 pb-12">
          <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#1a2340]"
            >
              Reports
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6 max-w-[58ch] text-lg font-light leading-relaxed text-zinc-500"
            >
              Explore in-depth reports featuring data-driven analysis, sector insights,
              policy reviews, and market intelligence shaping India&apos;s evolving energy landscape.
            </motion.p>
          </div>
        </section>

        {/* Ad Banner */}
        <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
          <AdBanner placement="reports_hero" variant="banner" className="flex justify-center" />
        </div>

        {/* ════════════════════════════════════════════
            FILTER & SEARCH BAR
            ════════════════════════════════════════════ */}
        <section className="bg-white pt-14 pb-4">
          <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-zinc-200 pb-6">
              {/* Category filters */}
              <nav className="flex items-center">
                <span className="text-sm font-medium text-[#1a2340] relative pb-1 after:absolute after:bottom-[-25px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1a2340]">
                  All Reports
                </span>
              </nav>

              {/* Search field — minimalist bottom-bordered */}
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reports…"
                  value={searchQuery}
                  className="w-full pl-7 pr-2 py-2.5 bg-transparent border-b border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#1a2340] transition-colors"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════
            REPORTS GRID
            ════════════════════════════════════════════ */}
        <section className="bg-white pt-12 pb-24">
          <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16"
            >
              <AnimatePresence mode="popLayout">
                {filteredReports.map((report, index) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.slug}`}
                    className="group block outline-none"
                  >
                    <motion.article
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      className="flex flex-col h-full"
                    >
                      {/* Image — strict 3:4 portrait ratio */}
                      <div className="relative aspect-[3/4] w-full bg-zinc-100 overflow-hidden rounded-lg mb-6">
                        {report.image ? (
                          <Image
                            src={report.image}
                            alt={report.title}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-serif italic text-zinc-300 text-lg">No Cover</span>
                          </div>
                        )}
                      </div>

                      {/* Content — flex-grow ensures baseline alignment */}
                      <div className="flex flex-col flex-1">
                        {/* Badge + Date row */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00A651]">
                            Report
                          </span>
                          {report.date && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
                              <Clock size={10} />
                              {formatDate(report.date)}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-xl leading-snug text-zinc-900 transition-colors group-hover:text-[#00A651] mb-3">
                          {report.title}
                        </h3>

                        {/* Excerpt — exactly 2 lines max */}
                        {report.excerpt && (
                          <p className="text-sm font-light leading-relaxed text-zinc-500 line-clamp-2 mt-auto">
                            {report.excerpt}
                          </p>
                        )}
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Empty state */}
            {filteredReports.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-zinc-400 font-light text-lg">No reports found matching your search.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
