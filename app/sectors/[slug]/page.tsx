"use client";

import React, { useState, useMemo, useEffect } from "react";
import { buildContentUrl } from "@/lib/content-routes";
import { useParams, useSearchParams } from "next/navigation";
import { Search, ChevronRight, Play, LayoutGrid, List, Bookmark, Share2, ShieldCheck, Zap } from "lucide-react";
import { Header } from "@/components/layout/header";
import { AdBanner } from "@/components/ads/AdBanner";
import Image from "next/image";
import Link from "next/link";
import { TagBadge } from "@/components/ui/tag-badge";
import { DateChip } from "@/components/ui/date-chip";
import { strapiImageUrl } from "@/lib/strapi-image";
import { buildSectorArticlesUrl, getSectorNames } from "@/lib/sector-content";
import { StickySidebar } from "@/components/ui/StickySidebar";
import { SidebarNewsletterForm } from "@/components/news/SidebarNewsletterForm";
import { LatestIssueWidget } from "@/components/news/LatestIssueWidget";
import { getLatestIssue, LatestIssueData } from "@/lib/api/getLatestIssue";
import { formatContentDate } from "@/lib/date";

/* ================================
   STRAPI CONFIG & HELPERS
================================ */
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

async function fetchSectorWithChildren(slug: string) {
    try {
        const names = getSectorNames(slug);
        let filterStr = `filters[$or][0][slug][$eq]=${slug}`;
        names.forEach((n, i) => {
            filterStr += `&filters[$or][${i + 1}][name][$eq]=${encodeURIComponent(n)}`;
        });
        const url = `${STRAPI}/api/sectors?${filterStr}&populate=*`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();

        let bestMatch = null;
        if (json?.data?.length) {
            bestMatch = json.data.find((s: any) => {
                const sSlug = s?.attributes?.slug || s?.slug;
                return sSlug === slug;
            });
            if (!bestMatch) {
                for (const name of names) {
                    bestMatch = json.data.find((s: any) => {
                        const sName = s?.attributes?.name || s?.name;
                        return sName?.toLowerCase() === name.toLowerCase();
                    });
                    if (bestMatch) break;
                }
            }
            if (!bestMatch) bestMatch = json.data[0];
        }

        const raw = bestMatch || null;
        if (!raw) return null;
        return raw?.attributes ? { id: raw.id, ...raw.attributes } : raw;
    } catch {
        return null;
    }
}

async function fetchSectorArticles(slug: string) {
    try {
        const url = buildSectorArticlesUrl(slug);
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const json = await res.json();
        return json?.data || [];
    } catch {
        return [];
    }
}

async function fetchSectorVideos(slug: string) {
    try {
        const names = getSectorNames(slug);
        let filterStr = `filters[$or][0][sectors][slug][$eq]=${slug}`;
        names.forEach((n, i) => {
            filterStr += `&filters[$or][${i + 1}][sectors][name][$containsi]=${encodeURIComponent(n)}`;
        });
        const url = `${STRAPI}/api/videos?${filterStr}&populate=*&sort=createdAt:desc`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const json = await res.json();
        return json?.data || [];
    } catch {
        return [];
    }
}

function normalizeText(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ");
}

function matchesActiveTab(values: string[] = [], activeTab: string) {
    if (activeTab === "ALL") return true;
    const normalizedTab = normalizeText(activeTab);
    if (!normalizedTab) return true;

    const tabWords = normalizedTab.split(" ").filter(Boolean);

    return values.some((value) => {
        const normalizedValue = normalizeText(value || "");
        if (!normalizedValue) return false;
        if (normalizedValue === normalizedTab) return true;

        const valueWords = normalizedValue.split(" ").filter(Boolean);

        const tabMatchesInValue = tabWords.length > 0 && tabWords.every((tw) => valueWords.includes(tw));
        const valueMatchesInTab = valueWords.length > 0 && valueWords.every((vw) => tabWords.includes(vw));

        return tabMatchesInValue || valueMatchesInTab;
    });
}

function extractNames(raw: any): string[] {
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    return list
        .map((item: any) => item?.name || item?.attributes?.name)
        .filter(Boolean);
}

function extractTagObjects(raw: any): { name: string; slug: string }[] {
    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    return list
        .map((item: any) => {
            const source = item?.attributes || item;
            if (!source?.name) return null;
            return { name: source.name, slug: source.slug || source.name.toLowerCase().replace(/\s+/g, "-") };
        })
        .filter(Boolean);
}

function resolveMediaUrl(raw: any): string | null {
    if (!raw) return null;

    const source = Array.isArray(raw) ? raw[0] : raw;
    const data = source?.data || source;
    const attrs = data?.attributes || data;
    const path =
        attrs?.formats?.large?.url ||
        attrs?.formats?.medium?.url ||
        attrs?.formats?.small?.url ||
        attrs?.formats?.thumbnail?.url ||
        attrs?.url ||
        null;

    if (!path) return null;
    return strapiImageUrl(path);
}

const DEFAULT_SECTOR_META = {
    title: "Sector Intelligence",
    description:
        "Deep-dive proprietary market data and critical infrastructure insights mapping the global energy transition.",
    breadcrumbLabel: "Strategic Monitoring Desk",
    heroImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
    quickSignals: ["Policy Momentum", "Investment Outlook", "Technology Shift"],
};

const SECTOR_HERO_MAP: Record<
    string,
    {
        breadcrumbLabel: string;
        description: string;
        quickSignals: [string, string, string];
        heroImage: string;
    }
> = {
    "oil-gas": {
        breadcrumbLabel: "Oil & Gas",
        description: "Explore oil & gas intelligence from ENERGDIVE, bringing you insights on policy, markets, infrastructure, technology, and developments shaping the sector’s future.",
        quickSignals: ["Upstream Activity", "Refining Margins", "Trade & Logistics"],
        heroImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=2200",
    },
    "power-generation": {
        breadcrumbLabel: "Power Generation",
        description: "Track the evolution of India’s power & utilities sector with ENERGDIVE - from generation and grid innovation to the rapid shift to renewables, energy storage, digitalisation, and regulatory change.",
        quickSignals: ["Fuel Mix", "Plant Reliability", "Capacity Additions"],
        heroImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=2200",
    },
    renewables: {
        breadcrumbLabel: "Renewable Energy",
        description: "Capture deployment velocity across solar, wind, and emerging renewable infrastructure.",
        quickSignals: ["Solar Buildout", "Wind Pipeline", "Storage Pairing"],
        heroImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=2200",
    },
    transmission: {
        breadcrumbLabel: "Transmission",
        description: "Track interconnectors, high-voltage expansion, and bottlenecks shaping regional stability.",
        quickSignals: ["HVDC Projects", "Grid Bottlenecks", "Cross-Border Links"],
        heroImage: "https://images.unsplash.com/photo-1617195737496-caf2cfeb4b7f?auto=format&fit=crop&q=80&w=2200",
    },
    distribution: {
        breadcrumbLabel: "Distribution",
        description: "Observe urban and rural network modernization through smart-grid and metering progress.",
        quickSignals: ["Loss Reduction", "Smart Metering", "Network Reliability"],
        heroImage: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&q=80&w=2200",
    },
    "electricity-markets": {
        breadcrumbLabel: "Electricity Markets",
        description: "Decode spot price movement, contract behavior, and policy intervention across power markets.",
        quickSignals: ["Spot Volatility", "Demand Curves", "Market Reform"],
        heroImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=2200",
    },
    "new-energies": {
        breadcrumbLabel: "New Energies",
        description: "Discover new energies intelligence from ENERGDIVE, covering green hydrogen, storage innovation, biofuels, CCUS, carbon markets, and technologies shaping India’s clean transformation.",
        quickSignals: ["Hydrogen Projects", "Fuel Pathways", "Industrial Adoption"],
        heroImage: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=2200",
    },
    "energy-storage": {
        breadcrumbLabel: "Energy Storage",
        description: "Follow grid-scale batteries, long-duration storage, and balancing strategies in real time.",
        quickSignals: ["BESS Pipeline", "Duration Economics", "Grid Integration"],
        heroImage: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=2200",
    },
    "sustainability-and-safety": {
        breadcrumbLabel: "Sustainability & Safety",
        description: "Explore ENERGDIVE's sustainability intelligence - from environment and HSE practices to ESG trends, safety, climate strategies, and pathways driving resilient, responsible growth.",
        quickSignals: ["ESG Disclosure", "HSE & Safety", "Net-Zero Execution"],
        heroImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2200",
    },
};

/* ================================
   MAIN PAGE COMPONENT
================================ */
export default function SectorIntelligencePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params?.slug as string;
    const subParam = searchParams?.get("sub") || "";

    const [articles, setArticles] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    const [childSectors, setChildSectors] = useState<any[]>([]);
    const [sectorInfo, setSectorInfo] = useState<any | null>(null);
    const [latestIssue, setLatestIssue] = useState<LatestIssueData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");
    const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        getLatestIssue().then(setLatestIssue);

        fetchSectorWithChildren(slug).then((sector) => {
            setSectorInfo(sector);

            const normalizedChildren = Array.isArray(sector?.children)
                ? sector.children
                : Array.isArray(sector?.children?.data)
                    ? sector.children.data.map((item: any) => (item?.attributes ? { id: item.id, ...item.attributes } : item))
                    : [];

            setChildSectors(normalizedChildren);
        });

        fetchSectorArticles(slug).then((data) => {
            const formatted = data.map((item: any) => ({
                id: item.id,
                title: item.Title,
                slug: item.slug,
                date: item.Date || item.publishedAt || item.createdAt,
                sectors: extractNames(item.sectors),
                tags: extractTagObjects(item.tags),
                image: strapiImageUrl(item?.FeaturedImage?.url),
                excerpt: item.Excerpt?.[0]?.children?.[0]?.text || "",
                type_of_content: item.type_of_content,
            }));
            setArticles(formatted);
        });

        fetchSectorVideos(slug).then((data) => {
            const formatted = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
                thumbnail: strapiImageUrl(
                    item.thumbnail?.url,
                    `https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg`
                ),
                date: item.date || item.createdAt,
                sectors: extractNames(item.sectors),
                tags: extractNames(item.tags),
            }));
            setVideos(formatted);
            setLoading(false);
        });
    }, [slug]);

    const sectorMeta = useMemo(() => {
        const fallbackTitle = slug?.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const customMeta = (slug && SECTOR_HERO_MAP[slug]) || null;
        const liveTitle = sectorInfo?.name || sectorInfo?.title || sectorInfo?.Title || "";
        const liveDescription = sectorInfo?.description || sectorInfo?.Description || "";
        const liveHero =
            resolveMediaUrl(sectorInfo?.heroImage) ||
            resolveMediaUrl(sectorInfo?.image) ||
            resolveMediaUrl(sectorInfo?.coverImage) ||
            resolveMediaUrl(sectorInfo?.bannerImage);

        return {
            title: liveTitle || fallbackTitle || DEFAULT_SECTOR_META.title,
            description: liveDescription || customMeta?.description || DEFAULT_SECTOR_META.description,
            breadcrumbLabel: customMeta?.breadcrumbLabel || liveTitle || fallbackTitle || DEFAULT_SECTOR_META.breadcrumbLabel,
            heroImage: liveHero || customMeta?.heroImage || DEFAULT_SECTOR_META.heroImage,
            quickSignals: customMeta?.quickSignals || DEFAULT_SECTOR_META.quickSignals,
        };
    }, [slug, sectorInfo]);

    const subCategoryStats = useMemo(() => {
        const children = childSectors
            .map((c: any) => c?.name?.trim())
            .filter(Boolean)
            .map((name: string) => name.toUpperCase());

        const uniqueChildren = Array.from(new Set(children));

        const stats = uniqueChildren.map(cat => {
            const matchingArticles = articles.filter(report => {
                const reportTags = report.tags ? report.tags.map((t: any) => t.name) : [];
                return matchesActiveTab([...(report.sectors || []), ...reportTags], cat);
            });
            const matchingVideos = videos.filter(video => matchesActiveTab([...(video.sectors || []), ...(video.tags || [])], cat));
            return {
                name: cat,
                count: matchingArticles.length + matchingVideos.length
            };
        });

        stats.sort((a, b) => {
            if (a.count > 0 && b.count === 0) return -1;
            if (a.count === 0 && b.count > 0) return 1;
            if (a.count !== b.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });

        return stats;
    }, [childSectors, articles, videos]);

    const subCategories = useMemo(() => {
        return ["ALL", ...subCategoryStats.map(s => s.name)];
    }, [subCategoryStats]);

    const sortedTabs = useMemo(() => {
        if (subCategories.length <= 1) return subCategories;

        const tabsWithoutAll = subCategories.filter((t) => t !== "ALL");
        const tabCounts = tabsWithoutAll.map((tab) => {
            const articleCount = articles.filter((r) => matchesActiveTab([...(r.sectors || []), ...(r.tags || []).map((t: any) => t.name)], tab)).length;
            const videoCount = videos.filter((v) => matchesActiveTab([...(v.sectors || []), ...(v.tags || [])], tab)).length;
            return { tab, total: articleCount + videoCount };
        });
        tabCounts.sort((a, b) => {
            if (a.total > 0 && b.total === 0) return -1;
            if (a.total === 0 && b.total > 0) return 1;
            if (a.total !== b.total) return b.total - a.total;
            return a.tab.localeCompare(b.tab);
        });
        return ["ALL", ...tabCounts.map((t) => t.tab)];
    }, [subCategories, articles, videos]);

    useEffect(() => {
        if (!subCategories.length) return;

        if (!subParam) {
            setActiveTab("ALL");
            return;
        }

        const normalizedParam = normalizeText(subParam.replace(/[-_]+/g, " "));
        const matchedTab = subCategories.find((cat) => {
            if (cat === "ALL") return false;
            const normalizedCat = normalizeText(cat);
            return (
                normalizedCat === normalizedParam ||
                normalizedCat.includes(normalizedParam) ||
                normalizedParam.includes(normalizedCat)
            );
        });

        setActiveTab(matchedTab || "ALL");
    }, [subParam, subCategories]);

    const filteredReports = useMemo(() => {
        return articles.filter((report) => {
            const search = searchQuery.toLowerCase().trim();
            const matchesTab = matchesActiveTab(report.sectors || [], activeTab);
            const matchesSearch =
                !search ||
                report.title?.toLowerCase().includes(search) ||
                report.excerpt?.toLowerCase().includes(search) ||
                report.tags?.some((tag: any) => tag.name?.toLowerCase().includes(search)) ||
                report.sectors?.some((name: string) => name.toLowerCase().includes(search));
            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchQuery, articles]);

    const filteredVideos = useMemo(() => {
        return videos.filter((video) => {
            const search = searchQuery.toLowerCase().trim();
            const tabPools = [
                ...(video.sectors || []),
                ...(video.tags || []),
            ];
            const matchesTab = matchesActiveTab(tabPools, activeTab);
            const matchesSearch =
                !search ||
                video.title?.toLowerCase().includes(search) ||
                video.sectors?.some((name: string) => name.toLowerCase().includes(search)) ||
                video.tags?.some((name: string) => name.toLowerCase().includes(search));
            return matchesTab && matchesSearch;
        });
    }, [videos, activeTab, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-600 selection:text-white font-sans overflow-x-clip">
            
            {/* 1. TOP BREADCRUMB & HEADER BAR */}
            <div className="bg-slate-900 text-slate-200 border-b border-emerald-500 overflow-hidden text-xs font-medium tracking-wide">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between h-11">
                    <nav className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Link href="/" className="hover:text-emerald-400 transition-colors">EnergDive</Link>
                        <ChevronRight size={12} className="text-slate-500" />
                        <Link href="/sectors" className="hover:text-emerald-400 transition-colors">Sectors</Link>
                        <ChevronRight size={12} className="text-slate-500" />
                        <span className="text-emerald-400 font-bold truncate max-w-[200px] sm:max-w-xs">
                            {sectorMeta.breadcrumbLabel}
                        </span>
                    </nav>

                    <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700">
                            {filteredReports.length} Articles
                        </span>
                        {filteredVideos.length > 0 && (
                            <span className="bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700">
                                {filteredVideos.length} Videos
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTOR TITLE & DESCRIPTION BANNER */}
            <div className="bg-slate-50/60 border-b border-slate-100 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900">
                        {sectorMeta.title}
                    </h1>
                    {sectorMeta.description && (
                        <p className="text-slate-600 max-w-3xl mt-3 text-base sm:text-lg font-light leading-relaxed border-l-2 border-emerald-600 pl-4">
                            {sectorMeta.description}
                        </p>
                    )}
                </div>
            </div>

            {/* SECTOR TOP LEADERBOARD AD */}
            <div className="w-full bg-white border-b border-slate-100 pt-2 pb-0">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex justify-center">
                    <AdBanner placement="sector_banner" sectorSlug={slug} variant="banner" />
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-2 pb-12">

                {/* 2. INTERACTIVE TOPIC / SUB-SECTOR FILTER BAR */}
                <div className="bg-white pb-3 pt-2 border-b border-slate-200 mb-6">
                    <div className="bg-white p-2 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Pill Tabs */}
                        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0 scroll-smooth">
                            {sortedTabs.map((cat) => {
                                const stat = subCategoryStats.find(s => s.name === cat);
                                const hasContent = cat === "ALL" || (stat ? stat.count > 0 : false);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => hasContent && setActiveTab(cat)}
                                        disabled={!hasContent}
                                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                                            !hasContent
                                                ? "opacity-35 cursor-not-allowed bg-slate-50 text-slate-300 border-slate-100 pointer-events-none select-none"
                                                : activeTab === cat
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Controls: Search & Layout Switcher */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="relative group flex items-center h-10">
                                <Search size={16} className="absolute left-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors z-10" />
                                <input 
                                    type="text"
                                    placeholder={`Filter ${sectorMeta.title.toLowerCase()}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-full w-full md:w-56 pl-10 pr-4 bg-white border border-slate-200 rounded-full text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 leading-normal flex items-center"
                                />
                            </div>
                            <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                                <button 
                                    onClick={() => setViewMode("grid")}
                                    className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    aria-label="Grid View"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button 
                                    onClick={() => setViewMode("compact")}
                                    className={`p-1.5 rounded-full transition-colors ${viewMode === 'compact' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    aria-label="Compact List View"
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. PRIMARY ARTICLES STREAM (8:4 Layout) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Left Column (8 cols - Articles Stream) */}
                    <div className="lg:col-span-8">
                        {filteredReports.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Search size={24} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No articles match your filter</h3>
                                <p className="text-slate-500 text-sm">Try adjusting your sub-sector or search terms.</p>
                                <button 
                                    onClick={() => { setActiveTab("ALL"); setSearchQuery(""); }}
                                    className="mt-6 text-emerald-600 font-bold text-sm hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className={`grid gap-6 lg:gap-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                {filteredReports.map((item) => (
                                    <article 
                                        key={item.id}
                                        className={`group flex bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 relative ${viewMode === 'compact' ? 'flex-row items-center p-4 gap-6' : 'flex-col'}`}
                                    >
                                        {/* Image */}
                                        <div className={`relative bg-slate-900 shrink-0 overflow-hidden ${viewMode === 'compact' ? 'w-32 h-32 sm:w-48 sm:h-32 rounded-lg' : 'w-full aspect-[16/10] mb-4'}`}>
                                            {item.image ? (
                                                <Image 
                                                    src={item.image} 
                                                    alt={item.title} 
                                                    fill 
                                                    sizes={viewMode === 'compact' ? "192px" : "(max-width: 768px) 100vw, 50vw"} 
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                                    loading="lazy" 
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                                    <Zap size={32} className="text-white/10" />
                                                </div>
                                            )}
                                            {viewMode === 'grid' && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className={`flex flex-col flex-1 space-y-3 ${viewMode === 'compact' ? 'py-1' : 'px-5 pb-5 md:px-6 md:pb-6'}`}>
                                            <div className="flex items-center justify-between relative z-20">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                                                    {sectorMeta.breadcrumbLabel}
                                                </span>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <button className="hover:text-emerald-600 transition-colors"><Bookmark size={14} /></button>
                                                    <button className="hover:text-emerald-600 transition-colors"><Share2 size={14} /></button>
                                                </div>
                                            </div>

                                            <Link href={buildContentUrl({ slug: item.slug, type_of_content: item.type_of_content })} className="before:absolute before:inset-0 z-10">
                                                <h3 className={`font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors ${viewMode === 'compact' ? 'text-[15px] line-clamp-2' : 'text-base line-clamp-3'}`}>
                                                    {item.title}
                                                </h3>
                                            </Link>

                                            {viewMode === 'grid' && item.excerpt && (
                                                <p className="text-sm text-slate-500 line-clamp-2 font-light leading-relaxed">
                                                    {item.excerpt}
                                                </p>
                                            )}

                                            {item.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 relative z-20">
                                                    {item.tags.slice(0, 3).map((tag: any) => (
                                                        <TagBadge key={tag.slug} name={tag.name} slug={tag.slug} />
                                                    ))}
                                                </div>
                                            )}

                                            <div className={`mt-auto flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-100 pt-3 relative z-20 pointer-events-none ${viewMode === 'compact' ? 'mt-3' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                                                        <ShieldCheck size={12} className="text-emerald-500" />
                                                        ENERGDIVE Desk
                                                    </span>
                                                </div>
                                                <time dateTime={item.date} className="bg-slate-50 px-2 py-0.5 rounded-sm border border-slate-100 text-[10px] tracking-wider uppercase">
                                                    {formatContentDate(item.date)}
                                                </time>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar (4 cols - Sticky Widgets, Desktop Only) */}
                    <aside className="hidden lg:block lg:col-span-4 relative">
                        <StickySidebar className="flex flex-col space-y-8 pb-12 pr-2 lg:pr-4">
                            
                            {/* In-Sidebar Ads */}
                            <div>
                                <AdBanner placement="sector_card" sectorSlug={slug} variant="card" />
                            </div>

                            {/* Widget 1: Latest Issue */}
                            {latestIssue && <LatestIssueWidget latestIssue={latestIssue} />}

                            {/* Widget 2: Newsletter */}
                            <SidebarNewsletterForm />

                        </StickySidebar>
                    </aside>
                </div>

                {/* 4. VIDEOS SECTION */}
                {filteredVideos.length > 0 && (
                    <section className="border-t border-slate-200 pt-12 mt-16">
                        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-6">
                            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs">
                                    <Play size={12} className="fill-white translate-x-[1px]" />
                                </span>
                                {sectorMeta.breadcrumbLabel} Videos
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVideos.map((video) => (
                                <Link key={video.id} href={`/videos/${video.slug}`} className="group block bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-3">
                                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-slate-900">
                                        <Image
                                            src={video.thumbnail}
                                            alt={video.title}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center pl-0.5 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-md">
                                                <Play size={16} className="text-red-600 fill-red-600 translate-x-[1px]" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                                        {video.title}
                                    </h3>
                                    <DateChip value={video.date} className="text-[10px] mt-2" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}
