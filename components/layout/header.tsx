"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Facebook, Twitter, Linkedin, Megaphone, ChevronRight, Zap } from "lucide-react";
import { SECTORS } from "@/data/dummy";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // 'sectors' | 'magazine' | 'more' | null
    const [magazinePreview, setMagazinePreview] = useState("/magazine-default.png");
    const [isLoginHovered, setIsLoginHovered] = useState(false);

    const brandGreen = "#00A651";

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const closeMenus = () => setActiveMenu(null);

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
                    <span className="whitespace-nowrap uppercase">ADVERTISE WITH US</span>
                </div>
            </div>

            {/* 2. MAIN NAVIGATION */}
            <div className={cn(
                "border-b transition-all duration-300 px-2 md:px-6 lg:px-8",
                isScrolled ? "py-2 shadow-sm" : "py-4 md:py-6"
            )}>
                <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-y-4">

                    {/* LEFT NAV */}
                    <nav className="flex items-center justify-center lg:justify-start flex-wrap gap-x-3 gap-y-2 md:gap-x-5 xl:gap-x-7 flex-1 order-2 lg:order-1">

                        {/* SECTORS */}
                        <div className="relative group cursor-pointer" onMouseEnter={() => setActiveMenu('sectors')}>
                            <button className="flex items-center gap-1 text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                SECTORS <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'sectors' && "rotate-180")} />
                            </button>
                        </div>

                        <Link href="/news" className="text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">NEWS</Link>
                        <Link href="/reports" className="text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">REPORTS</Link>
                        <Link href="/opinion" className="text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">OPINION</Link>

                        {/* MAGAZINE MEGA MENU */}
                        <div className="relative group cursor-pointer" onMouseEnter={() => { setActiveMenu('magazine'); setMagazinePreview("/magazine-default.png"); }}>
                            <button className="flex items-center gap-1 text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                MAGAZINE <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'magazine' && "rotate-180")} />
                            </button>
                        </div>

                        {/* MORE MEGA MENU */}
                        <div className="relative group cursor-pointer" onMouseEnter={() => setActiveMenu('more')}>
                            <button className="flex items-center gap-1 text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">
                                MORE <ChevronDown className={cn("w-3 h-3 transition-transform", activeMenu === 'more' && "rotate-180")} />
                            </button>
                        </div>
                    </nav>

                    {/* CENTER LOGO */}
                    <div className="flex-none px-4 order-1 lg:order-2">
                        <Link href="/" className="flex flex-col items-center">
                            <Image src="/Energdive-Logo.png" alt="EnergDive" width={220} height={45} priority className="object-contain w-[160px] md:w-[220px]" />
                        </Link>
                    </div>

                    {/* RIGHT NAV */}
                    <div className="flex items-center justify-center lg:justify-end gap-x-3 md:gap-x-5 xl:gap-x-7 flex-1 order-3">
                        <nav className="flex items-center gap-x-3 md:gap-x-5 xl:gap-x-7">
                            <Link href="/data-insights" className="text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">DATA & INSIGHTS</Link>
                            <Link href="/energclub" className="text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">ENERGCLUB</Link>
                            <Link href="/subscribe" style={{ color: brandGreen }} className="text-[10px] md:text-[12px] xl:text-[13px] font-bold uppercase tracking-[1px] hover:opacity-70 whitespace-nowrap">SUBSCRIBE</Link>
                        </nav>

                        <motion.div className="relative" onMouseEnter={() => setIsLoginHovered(true)} onMouseLeave={() => setIsLoginHovered(false)}>
                            <Link href="/login" className="block border-[1.5px] border-black px-3 py-1 md:px-6 md:py-2 text-[10px] md:text-[12px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all overflow-hidden whitespace-nowrap">
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
                        <Search className="w-4 h-4 md:w-5 h-5 cursor-pointer hover:text-[#00A651] shrink-0" />
                    </div>
                </div>
            </div>

            {/* SHARED STATISTA-STYLE MEGA MENU CONTAINER */}
            <div className={cn(
                "fixed left-0 w-full bg-white shadow-2xl border-t transition-all duration-300 origin-top overflow-hidden z-[60]",
                activeMenu ? "opacity-100 visible h-[450px]" : "opacity-0 invisible h-0"
            )}>
                <div className="max-w-[1600px] mx-auto w-full flex h-full">

                    {/* 1. SECTORS CONTENT */}
                    {activeMenu === 'sectors' && (
                        <>
                            <div className="w-1/4 bg-[#f8f8f8] border-r p-8">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Industry Sectors</h3>
                                <div className="flex flex-col gap-1 overflow-y-auto h-[300px]">
                                    {SECTORS.map((sector) => (
                                        <Link key={sector.slug} href={`/sectors/${sector.slug}`} className="px-4 py-3 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white flex justify-between items-center transition-colors">
                                            {sector.title} <ChevronRight size={14} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 p-12 grid grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase border-b pb-3 mb-6 text-gray-400">Trending Intelligence</h4>
                                    <ul className="space-y-4 text-[14px] font-bold text-gray-700">
                                        <li className="hover:text-[#00A651] cursor-pointer">Global Energy Mix 2026</li>
                                        <li className="hover:text-[#00A651] cursor-pointer">Battery Storage Market</li>
                                    </ul>
                                </div>
                                <div className="bg-gray-50 flex items-center justify-center border">
                                    <div className="text-center">
                                        <div className="w-24 h-32 bg-white shadow-lg mb-4 mx-auto border-t-4 border-[#00A651]"></div>
                                        <button className="text-[10px] font-bold bg-[#00A651] text-white px-4 py-2 uppercase tracking-widest">Industry Report</button>
                                    </div>
                                </div>
                            </div >
                        </>
                    )}

                    {/* 2. MAGAZINE CONTENT */}
                    {activeMenu === 'magazine' && (
                        <>
                            <div className="w-1/4 bg-[#f8f8f8] border-r p-8">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">EnergDive Magazine</h3>
                                <div className="flex flex-col gap-2">
                                    <Link
                                        href="/magazine/current"
                                        onMouseEnter={() => setMagazinePreview("/current-issue-cover.png")}
                                        className="px-4 py-4 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white flex justify-between items-center transition-colors"
                                    >
                                        CURRENT ISSUE <ChevronRight size={14} />
                                    </Link>
                                    <Link
                                        href="/magazine/latest"
                                        onMouseEnter={() => setMagazinePreview("/latest-issue-cover.png")}
                                        className="px-4 py-4 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white flex justify-between items-center transition-colors"
                                    >
                                        LATEST ISSUES <ChevronRight size={14} />
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
                                    {["Videos", "Events", "About", "Contact"].map((item) => (
                                        <Link key={item} href={`/${item.toLowerCase()}`} className="px-4 py-3 text-[14px] font-bold text-gray-800 hover:bg-[#00A651] hover:text-white flex justify-between items-center transition-colors">
                                            {item} <ChevronRight size={14} />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 p-12 grid grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase text-gray-400 border-b pb-3 mb-6">Upcoming Media</h4>
                                    <div className="space-y-6">
                                        <div className="flex gap-4 group cursor-pointer">
                                            <div className="w-20 h-12 bg-gray-200 shrink-0"></div>
                                            <div>
                                                <p className="text-[13px] font-bold group-hover:text-[#00A651]">Energy Summit 2026</p>
                                                <p className="text-[11px] text-gray-400 uppercase">Live Event</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-900 text-white p-8 flex flex-col justify-center">
                                    <h5 className="text-[#00A651] font-bold text-[11px] uppercase tracking-widest mb-2">EnergClub</h5>
                                    <p className="text-[14px] font-medium mb-4">Join our exclusive community of energy professionals.</p>
                                    <button className="border border-white/30 py-2 text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all">Learn More</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}