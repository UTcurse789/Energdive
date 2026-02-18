"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ================================
   STRAPI CONFIG
================================ */

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

/* ================================
   FETCH SECTOR (WITH CHILDREN)
================================ */

async function fetchSectorWithChildren(slug: string) {
    try {
        const url =
            `${STRAPI}/api/sectors?` +
            `filters[slug][$eq]=${slug}` +
            `&populate=children`;

        console.log("🚀 Sector Fetch:", url);

        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();

        console.log("✅ SECTOR RESPONSE:", json);

        return json?.data?.[0] || null;
    } catch (err) {
        console.error("❌ Sector fetch error:", err);
        return null;
    }
}

/* ================================
   FETCH ARTICLES
================================ */

async function fetchSectorArticles(slug: string) {
    try {
        const url =
            `${STRAPI}/api/contents?` +
            `filters[type_of_content][name][$eq]=Articles` +
            `&filters[sectors][slug][$eq]=${slug}` +
            `&populate=*`;

        console.log("🚀 Articles Fetch:", url);

        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();

        return json?.data || [];
    } catch (err) {
        console.error("❌ Articles fetch error:", err);
        return [];
    }
}

/* ================================
   PAGE
================================ */

export default function SectorIntelligencePage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [articles, setArticles] = useState<any[]>([]);
    const [childSectors, setChildSectors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");

    /* ================================
       LOAD DATA
    ================================= */

    useEffect(() => {
        if (!slug) return;

        // Load sector hierarchy
        fetchSectorWithChildren(slug).then((sector) => {
            setChildSectors(sector?.children || []);
        });

        // Load articles
        fetchSectorArticles(slug).then((data) => {
            const formatted = data.map((item: any) => ({
                id: item.id,
                title: item.Title,
                slug: item.slug,
                date: item.Date,
                sectors: item.sectors || [],
                image: item?.FeaturedImage?.url
                    ? `${STRAPI}${item.FeaturedImage.url}`
                    : "/placeholder.jpg",
            }));

            setArticles(formatted);
        });
    }, [slug]);

    /* ================================
       SECTOR META
    ================================= */

    const sectorData = useMemo(() => {
        const title = slug
            ?.replaceAll("-", " ")
            ?.replace(/\b\w/g, (c) => c.toUpperCase());

        return {
            title: title || "Sector Intelligence",
            description:
                "Proprietary market data and infrastructure insights mapping the future of energy.",
            heroImage:
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
        };
    }, [slug]);

    /* ================================
       FILTER TABS (CHILD SECTORS ONLY)
    ================================= */

    const subCategories = useMemo(() => {
        const children = childSectors.map((c: any) =>
            c.name?.toUpperCase()
        );

        return ["ALL", ...children];
    }, [childSectors]);

    /* ================================
       FILTERING
    ================================= */

    const filteredReports = useMemo(() => {
        return articles.filter((report) => {
            const matchesTab =
                activeTab === "ALL" ||
                report.sectors?.some(
                    (s: any) =>
                        s?.name?.toUpperCase() === activeTab
                );

            const matchesSearch = report.title
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());

            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchQuery, articles]);

    /* ================================
       UI
    ================================= */

    return (
        <div className="min-h-screen bg-white text-[#121212] font-sans">

            {/* HERO */}
            <section className="relative h-[55vh] flex items-center overflow-hidden border-b">
                <Image
                    src={sectorData.heroImage}
                    alt={sectorData.title}
                    fill
                    className="object-cover opacity-20 grayscale"
                />

                <div className="container mx-auto px-6 lg:px-16 relative z-10">
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
                        <Link href="/">EnergDive</Link>
                        <ChevronRight size={10} />
                        <span className="text-[#00C6A7]">Intelligence</span>
                    </nav>

                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight mb-6">
                        {sectorData.title}
                    </h1>

                    <p className="text-xl text-gray-500 max-w-2xl border-l-4 border-[#00C6A7]/30 pl-6">
                        {sectorData.description}
                    </p>
                </div>
            </section>

            {/* FILTER BAR */}
            <section className="sticky top-0 z-40 bg-white border-b py-5">
                <div className="container mx-auto px-6 lg:px-16 flex flex-col md:flex-row gap-6 justify-between">

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto">
                        {subCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${activeTab === cat
                                    ? "bg-black text-white"
                                    : "border-gray-200 text-gray-500"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${sectorData.title}...`}
                            className="w-full bg-gray-50 border rounded-full py-3 pl-11 pr-4 text-sm"
                        />
                    </div>
                </div>
            </section>

            {/* GRID */}
            <section className="container mx-auto px-6 lg:px-16 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredReports.map((report) => (
                            <motion.div key={report.id} layout>
                                <Link
                                    href={`/articles/${report.slug}`}
                                    className="group block border rounded-lg overflow-hidden hover:shadow-xl transition"
                                >
                                    <div className="relative aspect-[4/3]">
                                        <Image
                                            src={report.image}
                                            alt={report.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition"
                                        />
                                    </div>

                                    <div className="p-6">
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-[#00C6A7]">
                                            {report.title}
                                        </h3>

                                        <p className="text-xs text-gray-500 mt-4">
                                            {report.date || "—"}
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredReports.length === 0 && (
                    <div className="py-32 text-center text-gray-400">
                        No articles found.
                    </div>
                )}
            </section>
        </div>
    );
}
