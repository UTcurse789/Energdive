"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ReportCard } from "@/components/ui/report-card";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================================
   STRAPI FETCH
================================ */

async function fetchReports() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/contents?filters[type_of_content][slug][$eq]=reports&populate=*`,
    { cache: "no-store" }
  );

  const json = await res.json();

  return json.data || [];
}



/* ================================
   PAGE
================================ */

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { scrollY } = useScroll();

  // Hero parallax
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  /* ================================
     LOAD DATA FROM STRAPI
  ================================= */

  useEffect(() => {
    fetchReports().then((data) => {

      const formatted = data.map((item: any) => ({
        id: item.id,
        title: item.Title,
        slug: item.slug,
        excerpt:
          item.Excerpt?.[0]?.children?.[0]?.text || "",
        image: item.FeaturedImage?.url
          ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${item.FeaturedImage.url}`
          : null, // ✅ NOT empty string
        category: "Reports",
        date: item.Date,
      }));


      setReports(formatted);
    });
  }, []);




  /* ================================
     FILTERING
  ================================= */

  const categories = ["All", "Reports"];

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesCategory =
        selectedCategory === "All" ||
        report.category === selectedCategory;

      const matchesSearch =
        report.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        report.excerpt
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, reports]);

  /* ================================
     UI
  ================================= */

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#121212] selection:bg-[#00A651] selection:text-white font-sans">
      <Header />

      <main className="relative pb-24">
        {/* HERO */}
        <section className="relative w-full min-h-[80vh] flex items-center bg-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <motion.div
              style={{ y: y1 }}
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-40 scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-[#F8F9FA]" />
          </div>

          <div className="container mx-auto px-6 lg:px-12 relative z-10 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              style={{ opacity }}
              className="max-w-5xl"
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] uppercase mb-10">
                Strategic <br />
                <span className="text-[#00A651] italic">
                  Reports
                </span>
              </h1>

              <p className="text-xl text-white/70 max-w-2xl mb-12">
                Proprietary data and deep-sector expertise mapping the
                future of energy infrastructure.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm uppercase"
              >
                Browse All Data
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* FILTER BAR */}
        <section className="sticky top-[64px] z-40 bg-white border-b py-4">
          <div className="container mx-auto px-6 lg:px-12 flex justify-between gap-6">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-5 py-2 rounded-full text-xs font-bold uppercase",
                    selectedCategory === cat
                      ? "bg-black text-white"
                      : "bg-zinc-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full bg-zinc-100 border rounded-xl py-3 pl-11 pr-4 text-sm"
              />
            </div>
          </div>
        </section>

        {/* GRID */}
        <section className="container mx-auto px-6 lg:px-12 py-20">
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16"
            >
              {filteredReports.map((report) => (
                <motion.div key={report.id} layout>
                  <ReportCard
                    article={report}
                    variant="featured"
                    baseUrl="/reports"
                  />
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
