"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Facebook, Twitter, Linkedin, Megaphone, ChevronRight, Zap, Menu, X } from "lucide-react";
import { SECTORS } from "@/data/dummy";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // 'sectors' | 'magazine' | 'more' | null
    const [magazinePreview, setMagazinePreview] = useState("/magazine-default.jpg");
    const [isLoginHovered, setIsLoginHovered] = useState(false);
    const [hoveredSector, setHoveredSector] = useState<string | null>(null);
    const [hoveredMoreItem, setHoveredMoreItem] = useState<string | null>(null);
    const [realVideos, setRealVideos] = useState<any[]>([]);
    const [realEvents, setRealEvents] = useState<any[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null); // 'sectors' | 'magazine' | 'more'

    const brandGreen = "#00A651";
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch real videos and events from Strapi
    useEffect(() => {
        async function fetchMenuData() {
            try {
                const [videosRes, eventsRes] = await Promise.all([
                    fetch(`${baseUrl}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&pagination[limit]=3&sort=createdAt:desc`),
                    fetch(`${baseUrl}/api/events?populate=*&pagination[limit]=3&sort=createdAt:desc`),
                ]);
                if (videosRes.ok) {
                    const vData = await videosRes.json();
                    setRealVideos(vData.data || []);
                }
                if (eventsRes.ok) {
                    const eData = await eventsRes.json();
                    setRealEvents(eData.data || []);
                }
            } catch (e) {
                console.error("Failed to fetch menu data", e);
            }
        }
        fetchMenuData();
    }, [baseUrl]);

    const closeMenus = () => { setActiveMenu(null); setHoveredSector(null); setHoveredMoreItem(null); };
    const closeAll = () => { closeMenus(); setMobileMenuOpen(false); setMobileExpanded(null); };

    // Close mega menu on route change (when user clicks a link)
    useEffect(() => {
        closeAll();
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

    // Get the currently hovered sector data
    const activeSector = SECTORS.find(s => s.slug === hoveredSector);

    return (
        <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 font-sans bg-white" onMouseLeave={closeMenus}>
            {/* 1. TOP BLACK BAR */}
            <div className="bg-black text-white py-1.5 px-4 md:px-12 flex justify-between items-center text-[10px] md:text-[11px] font-semibold tracking-wider">
                <div className="flex gap-4 items-center">
                    <Facebook className="w-3.5 h-3.5 hover:opacity-70 cursor-pointer" />
                    <Twitter className="w-3.5 h-3.5 hover:opacity-70 cursor-pointer" />
                    <Linkedin className="w-3.5 h-3.5 hover:opacity-70 cursor-pointer" />
                </div>
                <div className="flex items-center gap-2 uppercase cursor-pointer hover:text-gray-300 transition-colors">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap uppercase hidden sm:inline">ADVERTISE WITH US</span>
                    <span className="whitespace-nowrap uppercase sm:hidden">ADVERTISE</span>
                </div>
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
                        <Link href="/opinion" className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>OPINION</Link>

                        {/* MAGAZINE MEGA MENU */}
                        <div className="relative group cursor-pointer" onMouseEnter={() => { setActiveMenu('magazine'); setMagazinePreview("/magazine-default.jpg"); setHoveredMoreItem(null); }}>
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
                            <Image src="/Energdive-Logo.png" alt="EnergDive" width={220} height={45} priority className="object-contain w-[140px] md:w-[220px] h-auto" />
                        </Link>
                    </div>

                    {/* RIGHT NAV */}
                    <div className="flex items-center gap-x-3 md:gap-x-5 xl:gap-x-7 flex-1 justify-end">
                        <nav className="hidden sm:flex items-center gap-x-3 md:gap-x-5 xl:gap-x-7">
                            <Link href="/energclub" target="_blank" className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>ENERGCLUB</Link>
                            <Link href="/subscribe" style={{ color: brandGreen }} className="text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap" onClick={closeMenus}>SUBSCRIBE</Link>
                        </nav>

                        <div className="relative">
                            <SignedIn>
                                <UserButton afterSignOutUrl="/" />
                            </SignedIn>
                            <SignedOut>
                                <motion.div className="relative" onMouseEnter={() => setIsLoginHovered(true)} onMouseLeave={() => setIsLoginHovered(false)}>
                                    <Link href="/auth" className="block border-[1.5px] border-black px-3 py-1 md:px-6 md:py-2 text-[10px] md:text-[12px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all overflow-hidden whitespace-nowrap" onClick={closeAll}>
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
                        <Search className="w-4 h-4 md:w-5 md:h-5 cursor-pointer hover:text-[#00A651] shrink-0" />
                    </div>
                </div>
            </div>

            {/* ══════════════════════════ DESKTOP MEGA MENU ══════════════════════════ */}
            <div className={cn(
                "fixed left-0 w-full bg-white shadow-2xl border-t transition-all duration-300 origin-top overflow-hidden z-60 hidden lg:block",
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
                                    {SECTORS.map((sector) => (
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
                                            {activeSector.subSectors?.map((sub) => (
                                                <Link
                                                    key={sub}
                                                    href={`/sectors/${activeSector.slug}?sub=${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                                    onClick={closeMenus}
                                                    className="group px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-[#00A651] hover:bg-[#00A651]/5 transition-all"
                                                >
                                                    <span className="text-[14px] font-bold text-gray-800 group-hover:text-[#00A651] transition-colors">
                                                        {sub}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                        <p className="mt-8 text-sm text-gray-500 leading-relaxed max-w-lg">
                                            {activeSector.description}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <h4 className="text-[12px] font-bold uppercase text-gray-400 tracking-widest mb-4">Trending Intelligence</h4>
                                            <ul className="space-y-4 text-[14px] font-bold text-gray-700">
                                                <li className="hover:text-[#00A651] cursor-pointer">Global Energy Mix 2026</li>
                                                <li className="hover:text-[#00A651] cursor-pointer">Battery Storage Market</li>
                                            </ul>
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
                                        href="/issues/january-2026"
                                        onClick={closeMenus}
                                        onMouseEnter={() => setMagazinePreview("/magazine-default.jpg")}
                                        className="px-4 py-4 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white flex justify-between items-center transition-colors"
                                    >
                                        CURRENT ISSUE <ChevronRight size={14} />
                                    </Link>
                                    <Link
                                        href="/issues/december-2025"
                                        onClick={closeMenus}
                                        onMouseEnter={() => setMagazinePreview("/current-magazine.jpg")}
                                        className="px-4 py-4 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white flex justify-between items-center transition-colors"
                                    >
                                        PAST ISSUES <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                            <div className="flex-1 p-12 flex items-center justify-center gap-12">
                                <div className="max-w-md">
                                    <h4 className="text-[12px] font-bold uppercase text-gray-400 mb-4 tracking-widest">Monthly Publication</h4>
                                    <p className="text-gray-600 text-[14px] leading-relaxed">Get deep-dive insights into the global energy transition, policy updates, and exclusive interviews with industry leaders.</p>
                                </div>
                                <div className="relative w-64 h-80 bg-gray-100 shadow-2xl overflow-hidden border">
                                    <Image src={magazinePreview} alt="Preview" fill className="object-cover transition-all duration-500" />
                                </div>
                            </div>
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
                                        className="px-4 py-3 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white transition-colors"
                                        onMouseEnter={() => setHoveredMoreItem(null)}
                                    >
                                        Events
                                    </Link>

                                    <Link
                                        href="/about"
                                        onClick={closeMenus}
                                        className="px-4 py-3 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white transition-colors"
                                        onMouseEnter={() => setHoveredMoreItem(null)}
                                    >
                                        About
                                    </Link>

                                    <Link
                                        href="/contact"
                                        onClick={closeMenus}
                                        className="px-4 py-3 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white transition-colors"
                                        onMouseEnter={() => setHoveredMoreItem(null)}
                                    >
                                        Contact
                                    </Link>
                                </div>
                            </div>

                            <div className="flex-1 p-12">
                                {/* Videos hover content */}
                                {hoveredMoreItem === "videos" && (
                                    <div>
                                        <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Latest Videos</h4>
                                        <div className="space-y-5">
                                            {realVideos.length > 0 ? realVideos.map((video: any) => {
                                                const thumbUrl = video.thumbnail?.url
                                                    ? `${baseUrl}${video.thumbnail.url}`
                                                    : `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
                                                return (
                                                    <Link key={video.id} href={`/videos/${video.slug}`} onClick={closeMenus} className="flex gap-4 group cursor-pointer">
                                                        <div className="relative w-28 h-16 bg-gray-200 shrink-0 rounded overflow-hidden">
                                                            <Image src={thumbUrl} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                                                                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-gray-900 border-b-[5px] border-b-transparent ml-0.5"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-bold group-hover:text-[#00A651] transition-colors line-clamp-2">{video.title}</p>
                                                            <p className="text-[11px] text-gray-400 mt-1">{video.date ? new Date(video.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
                                                        </div>
                                                    </Link>
                                                );
                                            }) : (
                                                <p className="text-gray-400 text-sm italic">Loading videos...</p>
                                            )}
                                        </div>
                                        <Link href="/videos" onClick={closeMenus} className="mt-6 inline-flex items-center gap-1 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                            View All Videos <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                )}

                                {/* Events hover content */}
                                {hoveredMoreItem === "events" && (
                                    <div>
                                        <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6 tracking-widest">Upcoming Events</h4>
                                        <div className="space-y-5">
                                            {realEvents.length > 0 ? realEvents.map((event: any) => {
                                                const eventImage = event.image?.url
                                                    ? `${baseUrl}${event.image.url}`
                                                    : event.coverImage?.url
                                                        ? `${baseUrl}${event.coverImage.url}`
                                                        : "/api/placeholder/200/120";
                                                return (
                                                    <Link key={event.id} href={`/events/${event.slug || event.id}`} onClick={closeMenus} className="flex gap-4 group cursor-pointer">
                                                        <div className="relative w-28 h-16 bg-gray-200 shrink-0 rounded overflow-hidden">
                                                            <Image src={eventImage} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-bold group-hover:text-[#00A651] transition-colors line-clamp-2">{event.title}</p>
                                                            <p className="text-[11px] text-gray-400 mt-1">{event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}{event.location ? ` · ${event.location}` : ''}</p>
                                                        </div>
                                                    </Link>
                                                );
                                            }) : (
                                                <p className="text-gray-400 text-sm italic">Loading events...</p>
                                            )}
                                        </div>
                                        <Link href="/events" onClick={closeMenus} className="mt-6 inline-flex items-center gap-1 text-[11px] font-bold text-[#00A651] uppercase tracking-widest hover:underline">
                                            View All Events <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                )}

                                {/* Default content when nothing hovered */}
                                {!hoveredMoreItem && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="bg-gray-900 text-white p-8 rounded-xl max-w-md w-full">
                                            <h5 className="text-[#00A651] font-bold text-[11px] uppercase tracking-widest mb-2">EnergClub</h5>
                                            <p className="text-[14px] font-medium mb-4">Join our exclusive community of energy professionals.</p>
                                            <Link href="/energclub" onClick={closeMenus} className="border border-white/30 py-2 px-6 text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all inline-block">Learn More</Link>
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
                                            {SECTORS.map((sector) => (
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
                            <Link href="/opinion" onClick={closeAll} className="px-6 py-4 text-[13px] font-bold uppercase tracking-[1px] hover:bg-gray-50 transition-colors border-t border-gray-100">
                                OPINION
                            </Link>

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
                                            <Link href="/issues/january-2026" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                Current Issue
                                            </Link>
                                            <Link href="/issues/december-2025" onClick={closeAll} className="block px-10 py-3 text-[13px] font-medium text-gray-700 hover:text-[#00A651] hover:bg-white transition-colors border-b border-gray-100">
                                                Past Issues
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
                                        onClick={closeAll}
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
        </header>
    );
}