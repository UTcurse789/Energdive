"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatContentDate } from "@/lib/date";
import { Search, ChevronDown, Facebook, Linkedin, Megaphone, ChevronRight, Zap, Menu, X, MapPin, Mail, Phone, Play, ArrowRight, Youtube, Instagram, LibraryBig } from "lucide-react";
import { SECTORS } from "@/data/dummy";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { GlobalSearch } from "@/components/global-search";
import { strapiImageUrl } from "@/lib/strapi-image";
import { CustomUserMenu } from "@/components/layout/CustomUserMenu";

import { usePostHog } from "@posthog/react";

type MagazineIssue = {
    id: number | string;
    slug: string;
    title: string;
    subTitle: string;
    description: string;
    month: string;
    year: string;
    volume?: string;
    number?: string;
    coverImage: string;
    sortDate: number;
};

type StrapiMedia = {
    url?: string | null;
    formats?: {
        medium?: { url?: string | null };
        small?: { url?: string | null };
    };
};

type StrapiIssueResponseItem = {
    id?: number | string;
    slug?: string;
    Month?: string;
    Year?: number | string;
    Title?: string;
    sub_title?: string;
    Description?: unknown;
    description?: unknown;
    Discription?: unknown;
    Volume?: number | string;
    IssueNumber?: number | string;
    Date?: string;
    publishedAt?: string;
    createdAt?: string;
    CoverImage?: StrapiMedia[] | StrapiMedia | null;
};

const MONTH_TO_INDEX: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sept: 8,
    sep: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
};

function getMonthIndex(month: unknown): number {
    if (typeof month !== "string") return -1;
    const normalized = month.trim().toLowerCase();
    return MONTH_TO_INDEX[normalized] ?? -1;
}

function getIssueDescriptionText(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (!Array.isArray(value)) return "";

    return value
        .map((block) => {
            const children = (block as { children?: Array<{ text?: unknown }> })?.children;
            if (!Array.isArray(children)) return "";
            return children
                .map((child) => (typeof child?.text === "string" ? child.text : ""))
                .join(" ");
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function toIssueSlug(month: string, year: string, fallbackId: unknown): string {
    if (!month || !year) return String(fallbackId ?? "").trim();
    const monthPart = month
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${monthPart}-${year}`;
}

function normalizeIssue(item: StrapiIssueResponseItem): MagazineIssue | null {
    const month = String(item?.Month ?? "").trim();
    const year = String(item?.Year ?? "").trim();

    const slugFromApi = typeof item?.slug === "string" ? item.slug.trim() : "";
    const slug = slugFromApi || toIssueSlug(month, year, item?.id);
    if (!slug) return null;

    const coverImageField = Array.isArray(item?.CoverImage)
        ? item.CoverImage[0]
        : item?.CoverImage;
    const rawCover =
        coverImageField?.formats?.medium?.url ||
        coverImageField?.formats?.small?.url ||
        coverImageField?.url ||
        null;

    const coverImage = rawCover
        ? strapiImageUrl(rawCover)
        : "/magazine-default.jpg";

    const titleFromApi = typeof item?.Title === "string" ? item.Title.trim() : "";
    const title = titleFromApi || [month, year].filter(Boolean).join(" ").trim() || "Latest Issue";
    const description = getIssueDescriptionText(item?.Discription ?? item?.Description ?? item?.description);
    const subTitle = typeof item?.sub_title === "string" ? item.sub_title.trim() : "";

    const monthIndex = getMonthIndex(month);
    const yearNumber = Number.parseInt(year, 10);
    const fallbackDate = Date.parse(item?.Date ?? item?.publishedAt ?? item?.createdAt ?? "");
    const fallbackSortDate = Number.isNaN(fallbackDate) ? 0 : fallbackDate;
    const sortDate = Number.isFinite(yearNumber) && monthIndex >= 0
        ? new Date(yearNumber, monthIndex, 1).getTime()
        : fallbackSortDate;

    return {
        id: item?.id ?? slug,
        slug,
        title,
        subTitle,
        description,
        month,
        year,
        volume: item?.Volume ? String(item.Volume) : undefined,
        number: item?.IssueNumber ? String(item.IssueNumber) : undefined,
        coverImage,
        sortDate,
    };
}

export function Header() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // 'sectors' | 'magazine' | 'more' | 'opinion' | null
    const [magazineIssues, setMagazineIssues] = useState<MagazineIssue[]>([]);
    const [activeMagazineSection, setActiveMagazineSection] = useState<"latest" | "past">("latest");
    const [isLoginHovered, setIsLoginHovered] = useState(false);
    const [hoveredSector, setHoveredSector] = useState<string | null>(null);
    const [hoveredMoreItem, setHoveredMoreItem] = useState<string | null>(null);
    const [hoveredOpinionItem, setHoveredOpinionItem] = useState<string | null>(null);
    const [realVideos, setRealVideos] = useState<any[]>([]);
    const [realEvents, setRealEvents] = useState<any[]>([]);
    const [realSectors, setRealSectors] = useState<any[] | null>(null);
    const [opinionArticles, setOpinionArticles] = useState<any[]>([]);
    const [interviewArticles, setInterviewArticles] = useState<any[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null); // 'sectors' | 'magazine' | 'more' | 'opinion'
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
    const [isDesktopViewport, setIsDesktopViewport] = useState(false);
    const { isLoaded, isSignedIn } = useAuth();
    const posthog = usePostHog();

    const handleLoginClick = () => {
        closeAll();
        if (posthog) {
            posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
        }
    };

    const handleSignupClick = () => {
        closeAll();
        if (posthog) {
            posthog.capture("signup_button_clicked", {
                timestamp: new Date().toISOString(),
                path: window.location.pathname,
            });
        }
    };

    const brandGreen = "#00A651";
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch real videos and events from Strapi
    useEffect(() => {
        let cancelled = false;

        async function fetchMenuData() {
            try {
                const res = await fetch("/api/menu", { cache: "no-store" });
                if (!res.ok) return;

                const menuData = await res.json() as {
                    videos?: any[];
                    events?: any[];
                    issues?: StrapiIssueResponseItem[];
                    sectors?: any[];
                    tagCounts?: Record<string, number>;
                    opinionArticles?: any[];
                    interviewArticles?: any[];
                };

                if (cancelled) return;

                setTagCounts(menuData.tagCounts || {});
                setRealVideos(Array.isArray(menuData.videos) ? menuData.videos : []);
                setRealEvents(Array.isArray(menuData.events) ? menuData.events : []);
                setOpinionArticles(Array.isArray(menuData.opinionArticles) ? menuData.opinionArticles : []);
                setInterviewArticles(Array.isArray(menuData.interviewArticles) ? menuData.interviewArticles : []);

                const normalizedIssues: MagazineIssue[] = Array.isArray(menuData?.issues)
                    ? menuData.issues
                        .map((item) => normalizeIssue(item))
                        .filter((issue: MagazineIssue | null): issue is MagazineIssue => issue !== null)
                    : [];

                normalizedIssues.sort((a, b) => b.sortDate - a.sortDate);
                setMagazineIssues(normalizedIssues);

                if (Array.isArray(menuData.sectors)) {
                    const allSectors = menuData.sectors;
                    const mergedSectors = SECTORS.map(dummySector => {
                        const s = allSectors.find((s: any) => s.slug === dummySector.slug);
                        if (s) {
                            const children = Array.isArray(s.children)
                                ? s.children
                                : Array.isArray(s.children?.data)
                                    ? s.children.data.map((c: any) => c?.attributes ? { ...c.attributes, id: c.id } : c)
                                    : [];
                            return {
                                title: s.name || s.title || s.Title || dummySector.title,
                                slug: dummySector.slug,
                                description: dummySector.description,
                                heroImage: dummySector.heroImage,
                                subSectors: children.map((c: any) => c.name?.trim()).filter(Boolean),
                            };
                        }
                        return { ...dummySector };
                    });

                    if (mergedSectors.length > 0) {
                        setRealSectors(mergedSectors);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch menu data", e);
            }
        }
        fetchMenuData();
        return () => {
            cancelled = true;
        };
    }, []);

    const closeMenus = () => { setActiveMenu(null); setHoveredSector(null); setHoveredMoreItem(null); setHoveredOpinionItem(null); };
    const closeAll = () => { closeMenus(); setMobileMenuOpen(false); setMobileExpanded(null); };

    // Close mega menu on route change
    useEffect(() => {
        const timer = setTimeout(() => {
            closeAll();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileMenuOpen]);

    // Handle Cmd+K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Use real (Strapi) sectors if available, else fallback to dummy
    const displaySectors = realSectors || SECTORS;
    // Get the currently hovered sector data
    const activeSector = displaySectors.find(s => s.slug === hoveredSector);
    const latestIssue = magazineIssues[0] ?? null;
    const pastIssues = magazineIssues.slice(1, 5);
    const latestIssueHref = latestIssue ? `/issues/${latestIssue.slug}` : "/issues";
    const defaultMagazineDescription = "Get deep-dive insights into the global energy transition, policy updates, and exclusive interviews with industry leaders.";
    const latestIssueDescription = latestIssue?.description || defaultMagazineDescription;

    const SOCIAL_ICONS = [
        { Icon: Linkedin, href: "https://www.linkedin.com/company/energdive/", label: "LinkedIn" },
        { Icon: X, href: "https://x.com/energdive", label: "Twitter" },
        { Icon: Youtube, href: "https://www.youtube.com/@energdive", label: "YouTube" },
        { Icon: Instagram, href: "https://www.instagram.com/energdiveindia", label: "Instagram" },
        { Icon: Facebook, href: "https://www.facebook.com/energdive/", label: "Facebook" },
    ];

    return (
        <>
            <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 font-sans bg-white" onMouseLeave={closeMenus}>
                {/* 1. TOP BLACK BAR */}
                <div className="bg-black text-white py-1.5 px-4 md:px-12 flex justify-between items-center text-[10px] md:text-[11px] font-semibold tracking-wider">
                    <div className="flex gap-4 items-center">
                        {SOCIAL_ICONS.map(({ Icon, href, label }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                target="_blank"
                                rel="noopener"
                                className="hover:opacity-70 transition-opacity"
                            >
                                <Icon className="w-3.5 h-3.5 cursor-pointer" />
                            </a>
                        ))}
                    </div>
                    <Link href="/advertise-with-us" className="flex items-center gap-2 uppercase cursor-pointer hover:text-gray-300 transition-colors">
                        <Megaphone className="w-3.5 h-3.5" />
                        <span className="whitespace-nowrap uppercase hidden sm:inline">ADVERTISE WITH US</span>
                        <span className="whitespace-nowrap uppercase sm:hidden">ADVERTISE</span>
                    </Link>
                </div>

                {/* 2. MAIN NAVIGATION */}
                <div className={cn(
                    "border-b transition-all duration-300 px-2 md:px-6 lg:px-8",
                    isScrolled ? "py-2 shadow-sm" : "py-3 md:py-6"
                )}>
                    <div className="max-w-[1920px] mx-auto flex items-center justify-between">

                        {/* HAMBURGER - MOBILE ONLY */}
                        <button
                            className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>

                        {/* LEFT NAV - DESKTOP ONLY */}
                        <nav className="hidden lg:flex items-center gap-x-3 xl:gap-x-7 flex-1">

                            {/* SECTORS */}
                            <div className="relative group cursor-pointer" onMouseEnter={() => { setActiveMenu('sectors'); setHoveredMoreItem(null); }}>
                                <button className="flex items-center gap-1 text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                    SECTORS <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'sectors' && "rotate-180")} />
                                </button>
                            </div>

                            <Link href="/news" className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>NEWS</Link>
                            <Link href="/reports" className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>REPORTS</Link>
                            <div className="relative group cursor-pointer" onMouseEnter={() => { setActiveMenu('opinion'); setHoveredOpinionItem('opinions'); setHoveredSector(null); setHoveredMoreItem(null); }}>
                                <button className="flex items-center gap-1 text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                    OPINION <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'opinion' && "rotate-180")} />
                                </button>
                            </div>

                            {/* MAGAZINE MEGA MENU */}
                            <div className="relative group cursor-pointer" onMouseEnter={() => { setActiveMenu('magazine'); setActiveMagazineSection("latest"); setHoveredMoreItem(null); }}>
                                <button className="flex items-center gap-1 text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                    MAGAZINE <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'magazine' && "rotate-180")} />
                                </button>
                            </div>

                            {/* MORE MEGA MENU */}
                            <div className="relative group cursor-pointer" onMouseEnter={() => { setActiveMenu('more'); setHoveredSector(null); }}>
                                <button className="flex items-center gap-1 text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                    MORE <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'more' && "rotate-180")} />
                                </button>
                            </div>
                        </nav>

                        {/* CENTER LOGO */}
                        <div className="flex-none px-4">
                            <Link href="/" className="flex flex-col items-center" onClick={closeAll}>
                                <Image src="/Energdive-Logo.png" alt="EnergDive" width={220} height={45} priority className="w-[140px] md:w-[220px]" />
                            </Link>
                        </div>

                        {/* RIGHT NAV */}
                        <div className="relative flex items-center gap-x-3 md:gap-x-5 xl:gap-x-7 flex-1 justify-end">
                            <nav className="hidden sm:flex items-center gap-x-3 md:gap-x-5 xl:gap-x-7">
                                <Link href="/energyjobs" className="inline-flex items-center gap-2 rounded-[16px] border-2 border-dashed border-[#00A651]/70 px-3 py-1.5 text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] whitespace-nowrap transition-colors hover:border-[#00A651] hover:bg-[#00A651]/[0.04]" onClick={closeMenus}>
                                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                                    ENERGYJOBS
                                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                                </Link>
                                <Link href="/energclub" target="_blank" className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>ENERGCLUB</Link>
                                <Link href="/subscribe" style={{ color: brandGreen }} className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>SUBSCRIBE</Link>
                            </nav>

                            <div className="relative">
                                <SignedIn>
                                    <CustomUserMenu />
                                </SignedIn>
                                <SignedOut>
                                    <motion.div className="relative" onMouseEnter={() => setIsLoginHovered(true)} onMouseLeave={() => setIsLoginHovered(false)}>
                                        <Link href="/auth" className="block border-[1.5px] border-black px-3 py-1 md:px-6 md:py-2 text-[10px] md:text-[12px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all overflow-hidden whitespace-nowrap" onClick={handleLoginClick}>
                                            LOGIN
                                            <AnimatePresence>
                                                {isLoginHovered && (
                                                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: -40, opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <Zap size={14} fill={brandGreen} color={brandGreen} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Link>
                                    </motion.div>
                                </SignedOut>
                            </div>
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                                aria-label="Open search"
                            >
                                <Search className="w-4 h-4 md:w-5 md:h-5 hover:text-[#00A651]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════ DESKTOP MEGA MENU ══════════════════════════ */}
                <div className={cn(
                    "fixed left-0 w-full bg-white shadow-2xl border-t transition-all duration-300 origin-top overflow-hidden z-[60] hidden lg:block",
                    activeMenu ? "opacity-100 visible h-[600px]" : "opacity-0 invisible h-0"
                )}>
                    <div className="max-w-[1600px] mx-auto w-full flex h-full">

                        {/* 1. SECTORS CONTENT */}
                        {activeMenu === 'sectors' && (
                            <>
                                {/* Sector list */}
                                <div className="w-1/4 bg-[#f8f8f8] border-r p-8">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Industry Sectors</h3>
                                    <div className="flex flex-col gap-1">
                                        {displaySectors.map((sector) => (
                                            <Link
                                                key={sector.slug}
                                                href={`/sectors/${sector.slug}`}
                                                onClick={closeMenus}
                                                className={cn(
                                                    "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                    hoveredSector === sector.slug
                                                        ? "bg-[#00A651] text-white"
                                                        : "hover:bg-[#00A651] hover:text-white"
                                                )}
                                                onMouseEnter={() => setHoveredSector(sector.slug)}
                                            >
                                                {sector.title} <ChevronRight size={14} />
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Sub-sectors panel */}
                                <div className="flex-1 p-12">
                                    {activeSector ? (
                                        <div>
                                            <h4 className="text-[12px] font-bold uppercase border-b pb-3 mb-6 text-gray-400 tracking-widest">
                                                {activeSector.title} — Sub-Sectors
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {(() => {
                                                    const subStats = (activeSector.subSectors || []).map((sub: string) => {
                                                        const upperSub = sub.toUpperCase();
                                                        const count = tagCounts[`${activeSector.slug}::${upperSub}`] || 0;
                                                        return {
                                                            name: sub,
                                                            count
                                                        };
                                                    });

                                                    subStats.sort((a: { name: string, count: number }, b: { name: string, count: number }) => {
                                                        if (a.count > 0 && b.count === 0) return -1;
                                                        if (a.count === 0 && b.count > 0) return 1;
                                                        return a.name.localeCompare(b.name);
                                                    });

                                                    return subStats.map((stat: { name: string, count: number }) => {
                                                        const sub = stat.name;
                                                        const hasContent = stat.count > 0;
                                                        return (
                                                            <Link
                                                                key={sub}
                                                                href={hasContent ? `/sectors/${activeSector.slug}?sub=${encodeURIComponent(sub.toLowerCase().replace(/\s+/g, "-"))}` : "#"}
                                                                onClick={(e) => {
                                                                    if (!hasContent) e.preventDefault();
                                                                    else closeMenus();
                                                                }}
                                                                className={`group px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg transition-all ${hasContent
                                                                        ? "hover:border-[#00A651] hover:bg-[#00A651]/5"
                                                                        : "opacity-40 cursor-not-allowed"
                                                                    }`}
                                                            >
                                                                <span className={`text-[14px] font-bold transition-colors ${hasContent ? "text-gray-800 group-hover:text-[#00A651]" : "text-gray-400"
                                                                    }`}>
                                                                    {sub}
                                                                </span>
                                                            </Link>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                            <p className="mt-8 text-sm text-gray-500 leading-relaxed max-w-lg">
                                                {activeSector.description}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <h4 className="text-[12px] font-bold uppercase border-b pb-3 mb-6 text-gray-400 tracking-widest">
                                                Featured Sectors
                                            </h4>
                                            <div className="grid grid-cols-4 gap-4">
                                                {displaySectors.slice(0, 8).map((sector) => (
                                                    <Link
                                                        key={sector.slug}
                                                        href={`/sectors/${sector.slug}`}
                                                        onClick={closeMenus}
                                                        className="group flex flex-col gap-2 cursor-pointer"
                                                    >
                                                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-100">
                                                            <Image 
                                                                src={sector.heroImage || "/magazine-default.jpg"} 
                                                                alt={sector.title} 
                                                                fill 
                                                                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[13px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors line-clamp-1">{sector.title}</h5>
                                                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed font-medium">{sector.description}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 2. MAGAZINE CONTENT */}
                        {activeMenu === 'magazine' && (
                            <>
                                <div className="w-1/4 bg-[#f8f8f8] border-r p-8">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">EnergDive Magazine</h3>
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={latestIssueHref}
                                            onClick={closeMenus}
                                            onMouseEnter={() => setActiveMagazineSection("latest")}
                                            onFocus={() => setActiveMagazineSection("latest")}
                                            className={cn(
                                                "px-4 py-4 text-[14px] font-bold flex justify-between items-center transition-colors",
                                                activeMagazineSection === "latest"
                                                    ? "bg-[#00A651] text-white"
                                                    : "text-gray-800 hover:bg-[#00A651] hover:text-white"
                                            )}
                                        >
                                            LATEST ISSUE <ChevronRight size={14} />
                                        </Link>
                                        <Link
                                            href="/issues"
                                            onClick={closeMenus}
                                            onMouseEnter={() => setActiveMagazineSection("past")}
                                            onFocus={() => setActiveMagazineSection("past")}
                                            className={cn(
                                                "px-4 py-4 text-[14px] font-bold flex justify-between items-center transition-colors",
                                                activeMagazineSection === "past"
                                                    ? "bg-[#00A651] text-white"
                                                    : "text-gray-800 hover:bg-[#00A651] hover:text-white"
                                            )}
                                        >
                                            PAST ISSUES <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                                {activeMagazineSection === "latest" ? (
                                    <div className="flex-1 p-12 flex items-center justify-center gap-12">
                                        <div className="max-w-md">
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 mb-4 tracking-widest">Latest Issue</h4>
                                            <h5 className="text-2xl font-bold text-zinc-900 mb-2 leading-tight">
                                                {latestIssue?.title ?? "Issue archive will appear here"}
                                            </h5>
                                            {latestIssue?.subTitle && (
                                                <p className="text-base font-serif italic text-gray-500 mb-3">
                                                    {latestIssue.subTitle}
                                                </p>
                                            )}
                                            <p className="text-gray-600 text-[14px] leading-relaxed">
                                                {latestIssueDescription}
                                            </p>
                                            <Link
                                                href={latestIssueHref}
                                                onClick={closeMenus}
                                                className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline"
                                            >
                                                Read Latest Issue <ArrowRight size={13} />
                                            </Link>
                                        </div>
                                        <Link href={latestIssueHref} onClick={closeMenus} className="block">
                                            <div className="relative w-64 h-80 bg-white shadow-2xl overflow-hidden border">
                                                <Image
                                                    src={latestIssue?.coverImage ?? "/magazine-default.jpg"}
                                                    alt={latestIssue?.title ?? "Latest issue"}
                                                    fill
                                                    sizes="256px"
                                                    className="object-fill"
                                                />
                                            </div>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex-1 p-12">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 tracking-widest">Past 4 Issues</h4>
                                        </div>
                                        {pastIssues.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-4 gap-5">
                                                    {pastIssues.map((issue) => (
                                                        <Link
                                                            key={issue.id}
                                                            href={`/issues/${issue.slug}`}
                                                            onClick={closeMenus}
                                                            className="group"
                                                        >
                                                            <div className="relative aspect-3/4 bg-white border shadow-sm overflow-hidden">
                                                                <Image
                                                                    src={issue.coverImage}
                                                                    alt={issue.title}
                                                                    fill
                                                                    sizes="200px"
                                                                    className="object-fill"
                                                                />
                                                            </div>
                                                            <p className="mt-3 text-[13px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors line-clamp-1">
                                                                {issue.title}
                                                            </p>
                                                            {issue.subTitle && (
                                                                <p className="text-[11px] font-serif italic text-gray-500 mt-0.5 line-clamp-1">
                                                                    {issue.subTitle}
                                                                </p>
                                                            )}
                                                            {issue.description && (
                                                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-snug">
                                                                    {issue.description}
                                                                </p>
                                                            )}
                                                        </Link>
                                                    ))}
                                                </div>
                                                <Link
                                                    href="/issues"
                                                    onClick={closeMenus}
                                                    className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline"
                                                >
                                                    View All Archive <ArrowRight size={13} />
                                                </Link>
                                            </>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <p className="text-sm text-gray-400 italic">No past issues found yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* 3. MORE CONTENT */}
                        {activeMenu === 'more' && (
                            <>
                                <div className="w-1/4 bg-[#f8f8f8] border-r p-8">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Explore More</h3>
                                    <div className="flex flex-col gap-1">
                                        <Link
                                            href="/videos"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredMoreItem === "videos"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredMoreItem("videos")}
                                        >
                                            Videos <ChevronRight size={14} />
                                        </Link>

                                        <Link
                                            href="/events"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredMoreItem === "events"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredMoreItem("events")}
                                        >
                                            Events <ChevronRight size={14} />
                                        </Link>

                                        <Link
                                            href="/energdive-insights-exchange"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredMoreItem === "insights-exchange"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredMoreItem("insights-exchange")}
                                        >
                                            Insights Exchange <ChevronRight size={14} />
                                        </Link>

                                        <Link
                                            href="/about"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredMoreItem === "about"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredMoreItem("about")}
                                        >
                                            About <ChevronRight size={14} />
                                        </Link>

                                        <Link
                                            href="/contact"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredMoreItem === "contact"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredMoreItem("contact")}
                                        >
                                            Contact <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex-1 p-12 overflow-y-auto">
                                    {/* Videos hover content — GRID VIEW */}
                                    {hoveredMoreItem === "videos" && (
                                        <div>
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Latest Videos</h4>
                                            <div className="grid grid-cols-3 gap-5">
                                                {realVideos.length > 0 ? realVideos.slice(0, 3).map((video: any) => {
                                                    const rawThumb = video.thumbnail?.url || null;
                                                    const thumbUrl = rawThumb
                                                        ? (strapiImageUrl(rawThumb))
                                                        : (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` : "/magazine-default.jpg");
                                                    return (
                                                        <Link key={video.id} href={`/videos/${video.slug}`} onClick={closeMenus} className="group cursor-pointer block">
                                                            <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                                                                <Image src={thumbUrl} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                        <Play size={16} className="text-gray-900 ml-0.5" fill="currentColor" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-[13px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors line-clamp-2 leading-snug">{video.title}</p>
                                                            <p className="text-[11px] text-gray-400 mt-1.5">{formatContentDate(video.date)}</p>
                                                        </Link>
                                                    );
                                                }) : (
                                                    <p className="text-gray-400 text-sm italic col-span-3">Loading videos...</p>
                                                )}
                                            </div>
                                            <Link href="/videos" onClick={closeMenus} className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                View All Videos <ArrowRight size={13} />
                                            </Link>
                                        </div>
                                    )}

                                    {/* Events hover content — GRID VIEW */}
                                    {hoveredMoreItem === "events" && (
                                        <div>
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Upcoming Events</h4>
                                            <div className="grid grid-cols-3 gap-5">
                                                {realEvents.length > 0 ? realEvents.map((event: any) => {
                                                    const imageField = Array.isArray(event.image) ? event.image[0] : event.image;
                                                    const img = imageField || null;
                                                    let eventImage = "/magazine-default.jpg";
                                                    if (typeof img === "string") {
                                                        eventImage = strapiImageUrl(img);
                                                    } else if (img) {
                                                        const rawUrl =
                                                            img.formats?.medium?.url ||
                                                            img.formats?.small?.url ||
                                                            img.formats?.thumbnail?.url ||
                                                            img.url ||
                                                            null;
                                                        if (rawUrl) {
                                                            eventImage = strapiImageUrl(rawUrl);
                                                        }
                                                    }
                                                    const eventDate = event.parsedDate ? new Date(event.parsedDate) : (event.date ? new Date(event.date) : null);
                                                    const isValidDate = eventDate && !isNaN(eventDate.getTime());
                                                    const eventLocation = event.venue || event.location || "";
                                                    const eventHref = event.url && /^https?:\/\//.test(event.url)
                                                        ? event.url
                                                        : `/events/${event.slug || event.id}`;
                                                    const openInNewTab = !!event.url && /^https?:\/\//.test(event.url);
                                                    return (
                                                        <Link
                                                            key={event.id}
                                                            href={eventHref}
                                                            onClick={closeMenus}
                                                            target={openInNewTab ? "_blank" : undefined}
                                                            rel={openInNewTab ? "noopener" : undefined}
                                                            className="group cursor-pointer block"
                                                        >
                                                            <article className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#00A651]/40 hover:shadow-xl">
                                                                <div className="relative h-40 w-full bg-gradient-to-b from-gray-50 to-gray-100 border-b border-gray-200 overflow-hidden">
                                                                    <Image src={eventImage} alt={event.title || "Event"} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                                                                    {isValidDate && (
                                                                        <div className="absolute top-3 left-3">
                                                                            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center shadow-sm border border-gray-100">
                                                                                <p className="text-[10px] font-bold uppercase leading-none" style={{ color: '#00A651' }}>{eventDate.toLocaleDateString('en-US', { month: 'short' })}</p>
                                                                                <p className="text-[18px] font-bold text-gray-900 leading-none mt-0.5">{eventDate.getDate()}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-4">
                                                                    <p className="text-[13px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors line-clamp-2 leading-snug min-h-[38px]">
                                                                        {event.title}
                                                                    </p>
                                                                    {eventLocation && (
                                                                        <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
                                                                            <MapPin size={10} className="shrink-0" />
                                                                            <span className="line-clamp-1">{eventLocation}</span>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </article>
                                                        </Link>
                                                    );
                                                }) : (
                                                    <p className="text-gray-400 text-sm italic col-span-3">Loading events...</p>
                                                )}
                                            </div>
                                            <Link href="/events" onClick={closeMenus} className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                View All Events <ArrowRight size={13} />
                                            </Link>
                                        </div>
                                    )}

                                    {/* Insights Exchange hover content */}
                                    {hoveredMoreItem === "insights-exchange" && (
                                        <div className="flex items-start gap-12 h-full">
                                            <div className="flex-1">
                                                <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">ENERGDIVE Insights Exchange</h4>
                                                <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-5" style={{ background: '#00A65112' }}>
                                                    <LibraryBig size={24} style={{ color: '#00A651' }} />
                                                </div>
                                                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-4 leading-tight">Where Knowledge Powers Energy Transition</h3>
                                                <p className="text-[14px] text-gray-500 leading-relaxed mb-4">EIX is a curated knowledge platform powered by ENERGClub for research papers, sector outlooks, case studies, white papers, technical notes, and knowledge briefs.</p>
                                                <p className="text-[14px] text-gray-500 leading-relaxed mb-6">It brings together professionals, researchers, academics, policymakers, consultants, technology providers, and emerging talent across India&apos;s energy ecosystem.</p>
                                                <div className="flex flex-wrap gap-3">
                                                    <Link href="/energdive-insights-exchange" onClick={closeMenus} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                        Explore EIX <ArrowRight size={13} />
                                                    </Link>
                                                    <Link href="/knowledge-base/submit" onClick={closeMenus} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-900 uppercase tracking-widest hover:underline">
                                                        Submit a Paper <ArrowRight size={13} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* About hover content — BRIEF OVERVIEW */}
                                    {hoveredMoreItem === "about" && (
                                        <div className="flex items-start gap-12 h-full">
                                            <div className="flex-1">
                                                <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">About EnergDive</h4>
                                                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-4 leading-tight">A Strategic Intelligence Platform</h3>
                                                <p className="text-[14px] text-gray-500 leading-relaxed mb-4">India is entering a defining decade—one that will shape not only its energy security but also its global influence in the age of sustainability.</p>
                                                <p className="text-[14px] text-gray-500 leading-relaxed mb-6">ENERGDIVE is designed to fill a critical void — conceived as India&apos;s foremost Strategic Intelligence Platform, unifying diverse stakeholders on one credible and data-driven platform.</p>
                                                <div className="bg-[#00A651]/5 border-l-4 border-[#00A651] p-4 rounded-r-xl mb-6">
                                                    <p className="text-[13px] font-bold italic text-zinc-700 leading-relaxed">&quot;ENERGDIVE emerges at this pivotal juncture as the definitive voice of India&apos;s energy transformation.&quot;</p>
                                                </div>
                                                <Link href="/about" onClick={closeMenus} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                    Learn More About Us <ArrowRight size={13} />
                                                </Link>
                                            </div>
                                            <div className="hidden xl:block w-56 shrink-0">
                                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                                                    <Image src="/energdive.jpg" alt="ENERGDIVE" fill className="object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact hover content — BRIEF OVERVIEW */}
                                    {hoveredMoreItem === "contact" && (
                                        <div className="flex items-start gap-12 h-full">
                                            <div className="flex-1">
                                                <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Get In Touch</h4>
                                                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-4 leading-tight">We&apos;d Love to Hear From You</h3>
                                                <p className="text-[14px] text-gray-500 leading-relaxed mb-8">Whether you have a story tip, editorial inquiry, advertising question, or just want to connect — our team is ready to help.</p>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#00A651]/30 transition-colors">
                                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#00A65112' }}>
                                                            <Mail size={18} style={{ color: '#00A651' }} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
                                                            <p className="text-[14px] text-gray-700 font-medium">info@energdive.com</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#00A651]/30 transition-colors">
                                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#00A65112' }}>
                                                            <Phone size={18} style={{ color: '#00A651' }} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                                                            <p className="text-[14px] text-gray-700 font-medium">+91 11 4544 4425</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href="/contact" onClick={closeMenus} className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                    Visit Contact Page <ArrowRight size={13} />
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Default content when nothing hovered */}
                                    {!hoveredMoreItem && (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center max-w-md">
                                                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: '#00A65115' }}>
                                                    <Zap size={28} style={{ color: '#00A651' }} />
                                                </div>
                                                <h4 className="text-xl font-bold text-zinc-900 mb-2">Explore ENERGDIVE</h4>
                                                <p className="text-gray-500 text-[14px] leading-relaxed mb-6">Hover over any item to preview. Discover videos, events, learn about us, or get in touch.</p>
                                                <Link href="/energclub" onClick={handleSignupClick} className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition-colors">
                                                    <Zap size={14} style={{ color: '#00A651' }} /> Join EnergClub
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 4. OPINION CONTENT */}
                        {activeMenu === 'opinion' && (
                            <>
                                <div className="w-1/4 bg-[#f8f8f8] border-r p-8">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Opinion & Interviews</h3>
                                    <div className="flex flex-col gap-1">
                                        <Link
                                            href="/opinion"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredOpinionItem === "opinions"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredOpinionItem("opinions")}
                                        >
                                            Opinion Articles <ChevronRight size={14} />
                                        </Link>
                                        <Link
                                            href="/interviews"
                                            onClick={closeMenus}
                                            className={cn(
                                                "px-4 py-3 text-[14px] font-bold text-gray-800 flex justify-between items-center transition-colors",
                                                hoveredOpinionItem === "interviews"
                                                    ? "bg-[#00A651] text-white"
                                                    : "hover:bg-[#00A651] hover:text-white"
                                            )}
                                            onMouseEnter={() => setHoveredOpinionItem("interviews")}
                                        >
                                            Interview <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex-1 p-12 overflow-y-auto">
                                    {/* Opinion Articles hover content */}
                                    {hoveredOpinionItem === "opinions" && (
                                        <div>
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Latest Opinion Articles</h4>
                                            <div className="grid grid-cols-3 gap-5">
                                                {opinionArticles.length > 0 ? opinionArticles.slice(0, 3).map((item: any) => {
                                                    const imgUrl = item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : "/magazine-default.jpg";
                                                    const authorName = item?.author?.name || "Editorial Staff";
                                                    const date = item?.Date ? formatContentDate(item.Date) : "";
                                                    return (
                                                        <Link key={item.id} href={`/opinion/${item.slug}`} onClick={closeMenus} className="group cursor-pointer block">
                                                            <div className="relative w-full h-[320px] bg-white rounded-xl overflow-hidden mb-3 border border-gray-100">
                                                                <Image
                                                                    src={imgUrl}
                                                                    alt={item.Title || ""}
                                                                    fill
                                                                    sizes="(min-width: 1280px) 20vw, 30vw"
                                                                    className="object-cover object-top"
                                                                />
                                                            </div>
                                                            <p className="text-[13px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors line-clamp-2 leading-snug">{item.Title}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {item?.author?.avatar?.url && (
                                                                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                                        <Image src={strapiImageUrl(item.author.avatar.url)} alt={authorName} fill className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <p className="text-[11px] text-gray-400">{authorName}</p>
                                                                {date && <p className="text-[10px] text-gray-300">&middot; {date}</p>}
                                                            </div>
                                                        </Link>
                                                    );
                                                }) : (
                                                    <p className="text-gray-400 text-sm italic col-span-3">Loading opinion articles...</p>
                                                )}
                                            </div>
                                            <Link href="/opinion" onClick={closeMenus} className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                View All Opinion Articles <ArrowRight size={13} />
                                            </Link>
                                        </div>
                                    )}

                                    {/* Interviews hover content */}
                                    {hoveredOpinionItem === "interviews" && (
                                        <div>
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Latest Interview</h4>
                                            <div className="grid grid-cols-3 gap-5">
                                                {interviewArticles.length > 0 ? interviewArticles.slice(0, 3).map((item: any) => {
                                                    const imgUrl = item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : "/magazine-default.jpg";
                                                    const authorName = item?.author?.name || "Editorial Staff";
                                                    const date = item?.Date ? formatContentDate(item.Date) : "";
                                                    return (
                                                        <Link key={item.id} href={`/interviews/${item.slug}`} onClick={closeMenus} className="group cursor-pointer block">
                                                            <div className="relative w-full h-[320px] bg-white rounded-xl overflow-hidden mb-3 border border-gray-100">
                                                                <Image
                                                                    src={imgUrl}
                                                                    alt={item.Title || ""}
                                                                    fill
                                                                    sizes="(min-width: 1280px) 20vw, 30vw"
                                                                    className="object-cover object-top"
                                                                />
                                                            </div>
                                                            <p className="text-[13px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors line-clamp-2 leading-snug">{item.Title}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                {item?.author?.avatar?.url && (
                                                                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                                        <Image src={strapiImageUrl(item.author.avatar.url)} alt={authorName} fill className="object-cover" />
                                                                    </div>
                                                                )}
                                                                <p className="text-[11px] text-gray-400">{authorName}</p>
                                                                {date && <p className="text-[10px] text-gray-300">&middot; {date}</p>}
                                                            </div>
                                                        </Link>
                                                    );
                                                }) : (
                                                    <p className="text-gray-400 text-sm italic col-span-3">Loading interviews...</p>
                                                )}
                                            </div>
                                            <Link href="/interviews" onClick={closeMenus} className="mt-8 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                                View All Interview <ArrowRight size={13} />
                                            </Link>
                                        </div>
                                    )}

                                    {/* Default content when nothing hovered */}
                                    {!hoveredOpinionItem && (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center max-w-md">
                                                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: '#00A65115' }}>
                                                    <Zap size={28} style={{ color: '#00A651' }} />
                                                </div>
                                                <h4 className="text-xl font-bold text-zinc-900 mb-2">Opinion & Interviews</h4>
                                                <p className="text-gray-500 text-[14px] leading-relaxed">Hover over a category to preview the latest articles from our thought leaders.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════ MOBILE MENU ══════════════════════════ */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "calc(100vh - 100px)" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="lg:hidden fixed left-0 right-0 bg-white z-50 overflow-y-auto border-t shadow-2xl"
                        >
                            <nav className="flex flex-col py-4">

                                {/* SECTORS - Expandable */}
                                <div>
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors"
                                        onClick={() => setMobileExpanded(mobileExpanded === 'sectors' ? null : 'sectors')}
                                    >
                                        SECTORS
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === 'sectors' && "rotate-180")} />
                                    </button>
                                    <AnimatePresence>
                                        {mobileExpanded === 'sectors' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden bg-gray-50"
                                            >
                                                {displaySectors.map((sector) => (
                                                    <Link
                                                        key={sector.slug}
                                                        href={`/sectors/${sector.slug}`}
                                                        onClick={closeAll}
                                                        className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100"
                                                    >
                                                        {sector.title}
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Direct Links */}
                                <Link href="/news" onClick={closeAll} className="px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors border-t border-gray-100">
                                    NEWS
                                </Link>
                                <Link href="/reports" onClick={closeAll} className="px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors border-t border-gray-100">
                                    REPORTS
                                </Link>
                                <div className="border-t border-gray-100">
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors"
                                        onClick={() => setMobileExpanded(mobileExpanded === 'opinion' ? null : 'opinion')}
                                    >
                                        OPINION
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === 'opinion' && "rotate-180")} />
                                    </button>
                                    <AnimatePresence>
                                        {mobileExpanded === 'opinion' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden bg-gray-50"
                                            >
                                                <Link href="/opinion" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Opinion Articles
                                                </Link>
                                                <Link href="/interviews" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Interviews
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* MAGAZINE - Expandable */}
                                <div className="border-t border-gray-100">
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors"
                                        onClick={() => setMobileExpanded(mobileExpanded === 'magazine' ? null : 'magazine')}
                                    >
                                        MAGAZINE
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === 'magazine' && "rotate-180")} />
                                    </button>
                                    <AnimatePresence>
                                        {mobileExpanded === 'magazine' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden bg-gray-50"
                                            >
                                                <Link href={latestIssueHref} onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Latest Issue
                                                </Link>
                                                <Link href="/issues" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    View Archive
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* MORE - Expandable */}
                                <div className="border-t border-gray-100">
                                    <button
                                        className="w-full flex items-center justify-between px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors"
                                        onClick={() => setMobileExpanded(mobileExpanded === 'more' ? null : 'more')}
                                    >
                                        MORE
                                        <ChevronDown className={cn("w-4 h-4 transition-transform", mobileExpanded === 'more' && "rotate-180")} />
                                    </button>
                                    <AnimatePresence>
                                        {mobileExpanded === 'more' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden bg-gray-50"
                                            >
                                                <Link href="/videos" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Videos
                                                </Link>
                                                <Link href="/events" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Events
                                                </Link>
                                                <Link href="/energdive-insights-exchange" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Insights Exchange
                                                </Link>
                                                <Link href="/about" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    About
                                                </Link>
                                                <Link href="/contact" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                    Contact
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Bottom links - visible on mobile only */}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <Link href="/energyjobs" onClick={closeAll} className="mx-6 my-3 inline-flex w-fit items-center gap-2 rounded-[16px] border-2 border-dashed border-[#00A651]/70 px-4 py-3 text-[13px] font-bold uppercase tracking-[1px] transition-colors hover:bg-gray-50">
                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                                        ENERGYJOBS
                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                                    </Link>
                                    <Link href="/energclub" onClick={closeAll} className="px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors block">
                                        ENERGCLUB
                                    </Link>
                                    <Link href="/subscribe" onClick={closeAll} className="px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] block" style={{ color: brandGreen }}>
                                        SUBSCRIBE
                                    </Link>
                                </div>

                                {/* Login CTA on mobile */}
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <SignedOut>
                                        <Link
                                            href="/auth"
                                            onClick={handleLoginClick}
                                            className="block w-full text-center border-[1.5px] border-black px-6 py-3 text-[12px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                                        >
                                            LOGIN
                                        </Link>
                                    </SignedOut>
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header >
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
