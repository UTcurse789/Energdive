"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, Search, FileText, Sparkles, MapPin, Building2, 
  Calendar, CheckCircle2, AlertCircle, RefreshCw, Zap, 
  ExternalLink, Layers, ArrowUpRight, Clock, Download,
  SlidersHorizontal, ChevronRight, IndianRupee, ShieldAlert,
  ArrowUpDown, Filter, X, Check, FileDown, Landmark, Activity,
  Radio, BarChart3, ChevronDown, CheckCheck
} from "lucide-react";
import { formatContentDate } from "@/lib/date";
import { UnifiedTender, TenderStats, normalizePythonTender } from "@/lib/api/tenders";

export default function TendersListingPage() {
  const [tenders, setTenders] = useState<UnifiedTender[]>([]);
  const [stats, setStats] = useState<TenderStats>({
    totalTenders: 0,
    energyRelated: 0,
    aiCompleted: 0,
    sectorBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  const [sortBy, setSortBy] = useState<"newest" | "deadline" | "value">("newest");
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch tenders from Python FastAPI engine via reverse proxy
        const tendersRes = await fetch("/api/tender-backend/tenders?energy_only=false&page=1&page_size=100", {
          cache: "no-store",
        });

        if (tendersRes.ok) {
          const json = await tendersRes.json();
          if (json.tenders) {
            const formatted: UnifiedTender[] = json.tenders.map(normalizePythonTender);
            setTenders(formatted);
          }
        }

        // Fetch stats
        const statsRes = await fetch("/api/tender-backend/stats", { cache: "no-store" });
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats({
            totalTenders: statsJson.total_tenders || 0,
            energyRelated: statsJson.energy_related || 0,
            aiCompleted: statsJson.ai_completed || 0,
            sectorBreakdown: statsJson.sector_breakdown || [],
          });
        }
      } catch (err) {
        console.error("Failed to load tenders from Python API:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Compute sector counts
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = { All: tenders.length };
    tenders.forEach((t) => {
      const s = (t.sector || "Energy").trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [tenders]);

  const availableSectors = useMemo(() => {
    return Object.keys(sectorCounts);
  }, [sectorCounts]);

  // Filter and sort tenders
  const filteredAndSortedTenders = useMemo(() => {
    let list = tenders.filter((tender) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tender.title.toLowerCase().includes(q) ||
        tender.organization.toLowerCase().includes(q) ||
        tender.reference.toLowerCase().includes(q) ||
        (tender.tenderId && tender.tenderId.toLowerCase().includes(q)) ||
        (tender.sector && tender.sector.toLowerCase().includes(q)) ||
        (tender.state && tender.state.toLowerCase().includes(q));

      const matchesSector =
        selectedSector === "All" ||
        (tender.sector && tender.sector.toLowerCase() === selectedSector.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Open" && tender.tenderStatus.toLowerCase().includes("open")) ||
        (statusFilter === "Closed" && tender.tenderStatus.toLowerCase().includes("clos"));

      return matchesSearch && matchesSector && matchesStatus;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "deadline") {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === "value") {
        const valA = parseFloat((a.tenderValue || "0").replace(/[^0-9.]/g, "")) || 0;
        const valB = parseFloat((b.tenderValue || "0").replace(/[^0-9.]/g, "")) || 0;
        return valB - valA;
      }
      // default: newest published first
      const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return dateB - dateA;
    });

    return list;
  }, [tenders, searchQuery, selectedSector, statusFilter, sortBy]);

  const visibleTenders = filteredAndSortedTenders.slice(0, visibleCount);
  const activeCount = tenders.filter((t) => t.tenderStatus?.toLowerCase().includes("open")).length;
  const aiCount = stats.aiCompleted || tenders.filter(t => t.aiAnalysis?.summary).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#00A651] selection:text-white">
      <Header />

      <main className="pt-16 sm:pt-20 pb-32">
        
        {/* ── 1. 🌟 REVOLUTIONARY HERO SECTION WITH LIVE INTELLIGENCE ── */}
        <section className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-[1400px] mb-6 sm:mb-10">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-[#071d14] to-[#013319] p-6 sm:p-10 md:p-14 border border-emerald-900/40 shadow-2xl">
            
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-emerald-500/20 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-teal-500/15 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12">
              
              {/* Left Headline */}
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-4 sm:mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Government Tender Intelligence • Daily CPPP Portal
                </div>
                
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] mb-3 sm:mb-5">
                  Global Energy & Public <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-[#00A651]">
                    Procurement Radar
                  </span>
                </h1>

                <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-light max-w-2xl">
                  Track high-value energy tenders, statutory EPC contracts, critical milestone deadlines, and AI-powered executive procurement insights in real-time.
                </p>
              </div>

              {/* Right KPI Metric Dashboard (Glassmorphic) */}
              <div className="w-full lg:w-auto min-w-[280px] sm:min-w-[340px] bg-white/10 backdrop-blur-xl border border-white/15 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-300 border-b border-white/10 pb-3">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> Live Market Feed
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> 24x7 Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4">
                    <div className="text-[10px] sm:text-xs text-slate-300 font-medium">Active Opportunities</div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mt-1 flex items-baseline gap-1.5">
                      {loading ? "..." : activeCount}
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4">
                    <div className="text-[10px] sm:text-xs text-slate-300 font-medium">AI Analyzed</div>
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-300 mt-1 flex items-baseline gap-1.5">
                      {loading ? "..." : aiCount}
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Ready</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center justify-between pt-2">
                  <span>Total Database Records:</span>
                  <span className="font-bold text-white font-mono">{tenders.length} Tenders</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. 🎛️ CONTROL & FILTER PANEL ── */}
        <section className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-[1400px] mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/90 space-y-4">
            
            {/* Top Bar: Search Bar + Status Tabs + Sorting */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-center justify-between">
              
              {/* Search Bar with Clear Button */}
              <div className="relative w-full lg:max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by tender title, ref number, org, state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Segmented Buttons + Sort Dropdown */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
                
                {/* Status Segmented Control */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-1 sm:flex-initial justify-center">
                  {(["All", "Open", "Closed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${
                        statusFilter === status
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {status === "All" ? "All" : status === "Open" ? "Active" : "Closed"}
                    </button>
                  ))}
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent focus:outline-none cursor-pointer text-slate-800 font-medium"
                  >
                    <option value="newest">Newest Published</option>
                    <option value="deadline">Closing Soonest</option>
                    <option value="value">Highest Value</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Horizontal Sector Scroll with Live Badges */}
            {availableSectors.length > 1 && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Sector:
                </span>
                {availableSectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedSector === sector
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{sector}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedSector === sector ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}>
                      {sectorCounts[sector] || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 3. 📦 TENDERS GRID & CARDS ── */}
        <section className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-[1400px]">
          
          {/* Header Count Bar */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{visibleTenders.length}</span> of{" "}
              <span className="font-bold text-slate-900">{filteredAndSortedTenders.length}</span> Procurement Notices
            </p>
            {selectedSector !== "All" && (
              <button
                onClick={() => setSelectedSector("All")}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                Clear Sector Filter <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-2xl" />
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <Skeleton className="h-9 w-28 rounded-xl" />
                    <Skeleton className="h-9 w-28 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedTenders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-16 text-center border border-slate-200 max-w-xl mx-auto my-10 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No tenders match your active filters</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any tenders matching your search query or sector filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("All");
                  setStatusFilter("All");
                }}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              {/* 3-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <AnimatePresence>
                  {visibleTenders.map((tender, index) => {
                    const isOpen = tender.tenderStatus?.toLowerCase().includes("open");
                    const hasAI = Boolean(tender.aiAnalysis?.summary);
                    const pdfUrl = tender.pdfPath || tender.pdfUrl;

                    return (
                      <motion.div
                        key={tender.id || tender.reference || index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.25) }}
                        className="group bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col justify-between relative overflow-hidden"
                      >
                        <div>
                          
                          {/* Top Row: Sector Pill & Status & Financial Value */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 truncate max-w-[150px]">
                                {tender.sector || "Energy"}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 ${
                                  isOpen
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                {isOpen ? "Active" : "Closed"}
                              </span>
                            </div>

                            {/* Value Tag */}
                            {tender.tenderValue && tender.tenderValue !== "0.00" && (
                              <span className="text-[11px] font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md shrink-0">
                                ₹ {tender.tenderValue}
                              </span>
                            )}
                          </div>

                          {/* Reference Number */}
                          {tender.reference && (
                            <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 mb-1.5 truncate">
                              Ref: {tender.reference}
                            </div>
                          )}

                          {/* Title */}
                          <Link href={`/tenders/${tender.slug}`} className="block group-hover:text-emerald-600 transition-colors">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-3 mb-3">
                              {tender.title}
                            </h3>
                          </Link>

                          {/* Authority & Location */}
                          <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                            {tender.organization && (
                              <div className="flex items-start gap-2">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="font-semibold text-slate-700 line-clamp-1">{tender.organization}</span>
                              </div>
                            )}
                            {(tender.state || tender.country || tender.location) && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{[tender.location, tender.state, tender.country].filter(Boolean).join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {/* 📅 Chronological Milestones Timeline Bar */}
                          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 mb-4 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                              <span className="text-slate-400 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" /> Published:
                              </span>
                              <span className="font-semibold text-slate-700">
                                {tender.publishedDate ? formatContentDate(tender.publishedDate) : "Recent"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                              <span className="text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-600" /> Deadline:
                              </span>
                              <span className="font-bold text-emerald-700">
                                {tender.deadline ? formatContentDate(tender.deadline) : "Check Document"}
                              </span>
                            </div>
                          </div>

                          {/* AI Executive Summary Badge if available */}
                          {hasAI && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 mb-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" /> AI Executive Insight
                              </div>
                              <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {tender.aiAnalysis?.summary}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          {pdfUrl ? (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" /> PDF Document
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">CPPP Portal</span>
                          )}

                          <Link
                            href={`/tenders/${tender.slug}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#00A651] text-white text-xs font-bold transition-all shadow-sm group-hover:shadow-md"
                          >
                            Details <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Load More Button */}
              {visibleCount < filteredAndSortedTenders.length && (
                <div className="text-center mt-10 sm:mt-14">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs sm:text-sm font-bold rounded-2xl shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
                  >
                    Load More Opportunities <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
