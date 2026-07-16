"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Search, FileText, Filter, SlidersHorizontal, MapPin, Building2, Calendar, ChevronDown, CheckCircle2 } from "lucide-react";
import { DateChip } from "@/components/ui/date-chip";
import { formatContentDate } from "@/lib/date";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export default function TendersListingPage() {
    const [tenders, setTenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(20);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"All" | "Open" | "Closed">("All");

    useEffect(() => {
        async function fetchData() {
            try {
                const url = `${STRAPI_BASE_URL}/api/tenders?populate=*&pagination[pageSize]=100&sort=publishedAt:desc`;
                const res = await fetch(url);
                const json = await res.json();

                if (json.data) {
                    const formattedData = json.data.map((item: any) => {
                        const attrs = item.attributes || item;

                        const sectorData = attrs.sectors?.data?.[0]?.attributes?.name || attrs.sectors?.[0]?.name || "Energy";

                        return {
                            id: item.id,
                            title: attrs.title || attrs.Title || "Untitled Tender",
                            slug: attrs.slug,
                            organization: attrs.organization,
                            country: attrs.country,
                            state: attrs.state,
                            tenderType: attrs.tender_type,
                            tenderStatus: attrs.tender_status || "Open",
                            deadline: attrs.tender_deadline ? formatContentDate(attrs.tender_deadline) : undefined,
                            sector: sectorData,
                            date: formatContentDate(attrs.publishedAt || attrs.createdAt),
                            rawDate: attrs.publishedAt || attrs.createdAt,
                            featured: attrs.featured === true || attrs.featured === "true",
                        };
                    });

                    formattedData.sort((a: any, b: any) => {
                        return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
                    });

                    setTenders(formattedData);
                }
            } catch (error) {
                console.error("Error fetching tenders:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredTenders = tenders.filter(tender => {
        const matchesSearch = 
            tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tender.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tender.country?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
            activeFilter === "All" || 
            (activeFilter === "Open" && tender.tenderStatus.toLowerCase().includes("open")) ||
            (activeFilter === "Closed" && tender.tenderStatus.toLowerCase().includes("clos"));

        return matchesSearch && matchesStatus;
    });

    const visibleTenders = filteredTenders.slice(0, visibleCount);
    const activeTendersCount = tenders.filter(t => t.tenderStatus?.toLowerCase().includes('open')).length;

    if (loading) return (
        <main className="min-h-screen bg-[#FAFAFA] font-sans">
            <Header />
            <div className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-[1400px]">
                    <Skeleton className="h-64 w-full rounded-3xl mb-12" />
                    <div className="flex gap-8">
                        <Skeleton className="h-[600px] w-1/4 rounded-2xl hidden lg:block" />
                        <div className="flex-1 space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#00A651] selection:text-white">
            <Header />

            <main className="pt-15 pb-32">
                
                {/* ---------- PREMIUM HERO SECTION ---------- */}
                <section className="relative w-full mb-12">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
                        <div className="relative pb-10">
                            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-[#0a1f16] to-[#004d26] shadow-2xl">
                                {/* Abstract background elements */}
                                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-[#00A651] rounded-full blur-[120px] opacity-20" />
                                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] bg-emerald-400 rounded-full blur-[100px] opacity-10" />
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                                
                                <div className="relative z-10 px-8 py-16 md:pt-10 md:pb-20 md:px-16 flex flex-col lg:flex-row items-center justify-between gap-12">
                                    
                                    <div className="max-w-3xl">
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
                                                Global Energy <br/>
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-[#00A651]">
                                                    Tender Database
                                                </span>
                                            </h1>
                                            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
                                                Discover high-value procurement notices, contract opportunities, and strategic tenders across the entire energy value chain. Updated daily.
                                            </p>
                                        </motion.div>
                                    </div>

                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="w-full lg:w-auto min-w-[300px] bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl"
                                    >
                                        <h3 className="text-white font-semibold mb-6 text-lg">Market Overview</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="text-sm text-slate-300 mb-1 uppercase tracking-wider font-semibold">Active Opportunities</div>
                                                <div className="text-4xl font-bold text-white flex items-baseline gap-2">
                                                    {activeTendersCount} <span className="text-emerald-400 text-lg">Live</span>
                                                </div>
                                            </div>
                                            <div className="h-px bg-white/10 w-full" />
                                            <div>
                                                <div className="text-sm text-slate-300 mb-1 uppercase tracking-wider font-semibold">Total Tracked</div>
                                                <div className="text-2xl font-semibold text-white">
                                                    {tenders.length}+
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                </div>
                            </div>

                            {/* Floating Search Bar overlapping the bottom edge */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-20">
                                <div className="bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-2 flex items-center">
                                    <div className="pl-6 pr-4 text-slate-400">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search by keyword, organization, or location..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent py-4 outline-none text-lg text-slate-700 placeholder:text-slate-400"
                                    />
                                    <button className="bg-[#00A651] hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 ml-2">
                                        Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------- MAIN CONTENT AREA ---------- */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] mt-24">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        
                        {/* LEFT SIDEBAR FILTERS */}
                        <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-6 sticky top-28 shadow-sm">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-6 pb-4 border-b border-slate-100">
                                <Filter className="w-5 h-5 text-[#00A651]" /> 
                                Filter Results
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Status</h4>
                                    <div className="space-y-3">
                                        {["All", "Open", "Closed"].map((status) => (
                                            <label key={status} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${activeFilter === status ? 'border-[#00A651] bg-[#00A651]' : 'border-slate-300 group-hover:border-[#00A651]'}`}>
                                                    {activeFilter === status && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </div>
                                                <span className={`text-sm font-medium ${activeFilter === status ? 'text-slate-900' : 'text-slate-600'}`}>{status} Tenders</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Placeholder for future filters */}
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Sectors</h4>
                                    <div className="text-sm text-slate-400 italic">Sector filtering coming soon...</div>
                                </div>
                            </div>
                        </aside>

                        {/* RIGHT DATA LIST */}
                        <div className="flex-1 w-full min-w-0">
                            
                            {/* Toolbar */}
                            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-sm font-semibold text-slate-600">
                                    Showing <span className="text-slate-900 font-bold">{visibleTenders.length}</span> of <span className="text-slate-900 font-bold">{filteredTenders.length}</span> results
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <span className="flex items-center gap-2 cursor-pointer hover:text-slate-900 font-medium">
                                        Sort by: <span className="text-[#00A651]">Newest First</span> <ChevronDown className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>

                            {/* LIST VIEW */}
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {visibleTenders.length === 0 ? (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white border border-slate-200 border-dashed rounded-2xl p-16 text-center flex flex-col items-center justify-center shadow-sm"
                                        >
                                            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">No tenders found</h3>
                                            <p className="text-slate-500">We couldn't find any opportunities matching your criteria. Try adjusting your search filters.</p>
                                        </motion.div>
                                    ) : (
                                        visibleTenders.map((tender, index) => {
                                            const isOpen = tender.tenderStatus.toLowerCase().includes('open');
                                            
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    key={tender.id}
                                                >
                                                    <Link href={`/tenders/${tender.slug}`} className="block bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-[#00A651]/50 hover:shadow-xl hover:shadow-[#00A651]/5 transition-all duration-300 group relative overflow-hidden">
                                                        
                                                        {/* Green hover accent bar */}
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00A651] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                                                        
                                                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                                                            
                                                            {/* Title & Core Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                                                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                        {tender.tenderStatus}
                                                                    </span>
                                                                    {tender.sector && (
                                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A651]">
                                                                            {tender.sector}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#00A651] transition-colors mb-4 line-clamp-2 leading-tight">
                                                                    {tender.title}
                                                                </h2>
                                                                
                                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
                                                                    {tender.organization && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Building2 className="w-4 h-4 text-slate-400" />
                                                                            <span className="font-medium">{tender.organization}</span>
                                                                        </div>
                                                                    )}
                                                                    {(tender.country || tender.state) && (
                                                                        <div className="flex items-center gap-2">
                                                                            <MapPin className="w-4 h-4 text-slate-400" />
                                                                            <span>{[tender.state, tender.country].filter(Boolean).join(", ")}</span>
                                                                        </div>
                                                                    )}
                                                                    {tender.tenderType && (
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="w-4 h-4 text-slate-400" />
                                                                            <span>{tender.tenderType}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Right Action / Dates */}
                                                            <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 p-4 lg:p-0 bg-slate-50 lg:bg-transparent rounded-xl border border-slate-100 lg:border-none">
                                                                <div className="flex flex-col gap-1 lg:text-right">
                                                                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Deadline</div>
                                                                    <div className={`font-bold ${isOpen ? 'text-red-600' : 'text-slate-900'}`}>
                                                                        {tender.deadline || "Not specified"}
                                                                    </div>
                                                                </div>
                                                                <div className="w-px h-8 bg-slate-200 hidden sm:block lg:hidden" />
                                                                <div className="flex flex-col gap-1 lg:text-right">
                                                                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Published</div>
                                                                    <div className="font-medium text-slate-700">
                                                                        {tender.date}
                                                                    </div>
                                                                </div>
                                                                <div className="hidden lg:flex items-center gap-2 mt-4 text-[#00A651] font-bold text-sm opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                                    View Details <ArrowRight className="w-4 h-4" />
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Pagination */}
                            {visibleCount < filteredTenders.length && (
                                <div className="mt-12 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount((prev) => prev + 20)}
                                        className="bg-white border-2 border-[#00A651] text-[#00A651] hover:bg-[#00A651] hover:text-white px-8 py-3 rounded-full font-bold transition-all shadow-sm hover:shadow-lg active:scale-95"
                                    >
                                        Load More Tenders
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
