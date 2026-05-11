"use client";

import React, { useState, useMemo, useEffect } from "react";
import { buildContentUrl } from "@/lib/content-routes";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, ArrowUpRight, Play } from "lucide-react";
import { Header } from "@/components/layout/header";
import { AdBanner } from "@/components/ads/AdBanner";
import Image from "next/image";
import Link from "next/link";
import { TagBadge } from "@/components/ui/tag-badge";
import { DateChip } from "@/components/ui/date-chip";
import { strapiImageUrl } from "@/lib/strapi-image";
import { buildSectorArticlesUrl, getSectorNames } from "@/lib/sector-content";

/* ================================
   STRAPI CONFIG & HELPERS
================================ */
const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

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
        // Exact full-string match
        if (normalizedValue === normalizedTab) return true;

        const valueWords = normalizedValue.split(" ").filter(Boolean);

        // Check if all tab words appear as complete words in the value
        const tabMatchesInValue = tabWords.length > 0 && tabWords.every((tw) => valueWords.includes(tw));
        // Check if all value words appear as complete words in the tab
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
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
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

        // Sort tabs with content first, then alphabetically
        stats.sort((a, b) => {
            if (a.count > 0 && b.count === 0) return -1;
            if (a.count === 0 && b.count > 0) return 1;
            return a.name.localeCompare(b.name);
        });

        return stats;
    }, [childSectors, articles, videos]);

    const subCategories = useMemo(() => {
        return ["ALL", ...subCategoryStats.map(s => s.name)];
    }, [subCategoryStats]);

    // Sorted version of tabs for rendering: tabs with content first, empty ones last
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

    // Simplified loading state WITHOUT complex Skeletons to avoid hydration mismatches
    const content = loading ? (
        <div className="min-h-screen bg-[#fafafa]">
            <Header />
            <div className="flex items-center justify-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-[#00C6A7] border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    ) : (
        <div className="min-h-screen bg-[#fafafa] text-[#121212] selection:bg-[#00C6A7]/30">

            {/* HERO SECTION */}
            <section className="relative min-h-[62vh] md:min-h-[68vh] flex items-center overflow-hidden bg-black">
                <Image
                    src={sectorMeta.heroImage}
                    alt={sectorMeta.title}
                    fill
                    className="object-cover opacity-60 scale-[1.06]"
                />
                <div className="absolute inset-0 bg-linear-to-r from-black/72 via-black/48 to-black/22" />
                <div className="absolute inset-0 bg-linear-to-t from-black/72 via-black/8 to-transparent" />
                <div
                    className="absolute inset-0 opacity-14"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />

                <div className="container mx-auto px-6 lg:px-16 max-w-[1400px] relative z-10">
                    <div className="my-6 sm:my-10">
                        <motion.nav
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black text-[#00C6A7] uppercase tracking-[0.15em] sm:tracking-[0.2em] backdrop-blur-sm shrink-0 max-w-[65%]"
                        >
                            <Link href="/" className="hover:text-white transition shrink-0">EnergDive</Link>
                            <ChevronRight size={10} className="text-white/40 shrink-0" />
                            <span className="text-white/60 hidden sm:inline shrink-0">Articles & Videos</span>
                            <ChevronRight size={10} className="text-white/40 hidden sm:inline shrink-0" />
                            <span className="text-white truncate">{sectorMeta.breadcrumbLabel}</span>
                        </motion.nav>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl sm:text-5xl md:text-[108px] font-black uppercase leading-[0.86] tracking-tighter text-white mb-7"
                    >
                        {sectorMeta.title}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-300 max-w-xl border-l-2 border-[#00C6A7] pl-6 md:pl-8 font-light leading-relaxed"
                    >
                        {sectorMeta.description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 flex flex-wrap gap-3"
                    >
                        <div className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {filteredReports.length} Articles
                        </div>
                        <div className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {filteredVideos.length} Videos
                        </div>
                    </motion.div>

                    {/* <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.48 }}
                        className="mt-6 flex flex-wrap gap-2 mb-25"
                    >
                        {sectorMeta.quickSignals.map((signal: string) => (
                            <span
                                key={signal}
                                className="inline-flex items-center rounded-full bg-[#00C6A7]/18 text-[#7ff1de] px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-[#00C6A7]/30"
                            >
                                {signal}
                            </span>
                        ))}
                    </motion.div> */}
                </div>

                <div className="absolute left-0 right-0 bottom-0 h-16 bg-linear-to-t from-[#fafafa] to-transparent" />
            </section>

            {/* Sector Hero Ad Banner — no wrapper, so no empty space when ad is absent */}
            <AdBanner placement="sector_banner" sectorSlug={slug} variant="banner" className="container mx-auto mt-6 mb-8 flex justify-center bg-[#fafafa] px-6 py-4 md:mt-8 md:mb-10 lg:px-16 max-w-[1400px]" />

            {/* STICKY NAVIGATION & FILTER */}
            <section className="sticky top-[74px] z-10 bg-white/95 backdrop-blur-xl border-y border-gray-100 py-5 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
                <div className="container mx-auto px-6 lg:px-16 max-w-[1400px] flex flex-col lg:flex-row gap-8 justify-between items-center">

                    {/* Tabs */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar w-full lg:w-auto pb-2 lg:pb-0 pr-6 scroll-px-6 snap-x">
                        {sortedTabs.map((cat) => {
                            const stat = subCategoryStats.find(s => s.name === cat);
                            const hasContent = cat === "ALL" || (stat ? stat.count > 0 : false);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => hasContent && setActiveTab(cat)}
                                    disabled={!hasContent}
                                    className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${!hasContent
                                        ? "opacity-40 cursor-not-allowed bg-transparent border-gray-200 text-gray-400"
                                        : activeTab === cat
                                            ? "bg-black text-white border-black scale-105 shadow-lg shadow-black/10"
                                            : "bg-transparent border-gray-200 text-gray-400 hover:border-black hover:text-black"
                                        }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#00C6A7] transition-colors" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search through ${sectorMeta.title.toLowerCase()}...`}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-full py-4 pl-12 pr-6 text-sm focus:bg-white focus:ring-4 focus:ring-[#00C6A7]/5 transition-all outline-none"
                        />
                    </div>
                </div>
            </section>

            {/* ARTICLES GRID */}
            <SectorArticlesSection
                slug={slug}
                filteredReports={filteredReports}
                buildContentUrl={buildContentUrl}
            />

            {/* VIDEOS SECTION */}
            {filteredVideos.length > 0 && (
                <section className="border-t border-gray-200 bg-white pb-30">
                    <div className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-20">

                        {/* Section Heading */}
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 pt-10">
                                Videos
                            </h2>
                            <div className="w-16 h-1 bg-[#00A651] mt-3"></div>
                        </div>

                        {filteredVideos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredVideos.map((video) => (
                                    <Link key={video.id} href={`/videos/${video.slug}`} className="group block">
                                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gray-200">
                                            <Image
                                                src={video.thumbnail}
                                                alt={video.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center pl-1 opacity-80 group-hover:opacity-100 transition-all">
                                                    <Play size={18} className="text-red-600 fill-red-600" />
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-bold group-hover:text-[#00A651] transition-colors line-clamp-2">
                                            {video.title}
                                        </h3>
                                        <DateChip value={video.date} className="text-[10px] mt-1" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
                                <p className="text-sm text-zinc-500">
                                    No Video Found
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}


        </div>
    );

    return content;
}

/* ================================
   SECTOR ARTICLES SECTION
   Right sidebar only appears when ad is loaded
================================ */
function SectorArticlesSection({
    slug,
    filteredReports,
    buildContentUrl,
}: {
    slug: string;
    filteredReports: any[];
    buildContentUrl: (item: any) => string;
}) {
    const [hasRightAd, setHasRightAd] = useState(false);
    const sidebarRef = React.useRef<HTMLDivElement>(null);

    // Check if AdBanner rendered content inside the sidebar
    useEffect(() => {
        if (!sidebarRef.current) return;

        const checkContent = () => {
            const hasContent = sidebarRef.current
                ? sidebarRef.current.querySelector("img, a, div > *") !== null
                : false;
            setHasRightAd(hasContent);
        };

        const observer = new MutationObserver(checkContent);
        observer.observe(sidebarRef.current, {
            childList: true,
            subtree: true,
        });

        // Initial check after a short delay for async ad loading
        const timer = setTimeout(checkContent, 1500);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, []);

    return (
        <section className="container mx-auto px-6 lg:px-16 max-w-[1400px] py-24 min-h-[40vh] mb-10">
            <div
                className={`grid grid-cols-1 gap-12 items-start ${
                    hasRightAd ? "xl:grid-cols-[minmax(0,1fr)_160px]" : ""
                }`}
            >
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-16 mt-15 mb-15">
                        <AnimatePresence mode="popLayout">
                            {/* In-grid Ad Card — no wrapper so no empty space when ad is absent */}
                            <AdBanner placement="sector_card" sectorSlug={slug} variant="card" />

                            {filteredReports.map((report, idx) => (
                                <motion.div
                                    key={report.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <article className="group relative">
                                        <Link
                                            href={buildContentUrl({ slug: report.slug, type_of_content: report.type_of_content })}
                                            className="block"
                                        >
                                            {/* Card Image */}
                                            <div className="relative aspect-16/10 rounded-2xl overflow-hidden mb-6 bg-gray-200 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
                                                <Image
                                                    src={report.image}
                                                    alt={report.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                    <ArrowUpRight size={18} className="text-black" />
                                                </div>
                                            </div>

                                            {/* Card Meta */}
                                            <div className="space-y-3 px-1">
                                                <DateChip value={report.date} className="text-[10px]" />

                                                <h3 className="text-2xl font-bold leading-tight tracking-tight text-[#1a1a1a] group-hover:text-[#00C6A7] transition-colors duration-300">
                                                    {report.title}
                                                </h3>

                                                <p className="text-sm text-gray-500 line-clamp-2 font-light leading-relaxed">
                                                    {report.excerpt}
                                                </p>
                                            </div>
                                        </Link>

                                        {report.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3 px-1">
                                                {report.tags.slice(0, 3).map((tag: any) => (
                                                    <TagBadge key={tag.slug} name={tag.name} slug={tag.slug} />
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Empty State */}
                    {filteredReports.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-40 text-center flex flex-col items-center justify-center"
                        >
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <Search size={32} className="text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-300">No Articles Found</h2>
                            <p className="text-gray-400 mt-2">Adjust your filters or try a different search term.</p>
                        </motion.div>
                    )}
                </div>

                {/* Right sidebar — only visible when ad content exists */}
                <aside className={`hidden ${hasRightAd ? "xl:block" : ""}`}>
                    <div className="sticky top-[148px] flex justify-end" ref={sidebarRef}>
                        <AdBanner
                            placement="header_banner_mobile"
                            variant="vertical"
                            width={160}
                            height={600}
                            className="mx-auto"
                        />
                    </div>
                </aside>
            </div>
        </section>
    );
}
