"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useState, useEffect } from "react";
import {
    Mail,
    MapPin,
    ArrowRight,
    Send,
    X,
    Linkedin,
    Youtube,
    Instagram,
    Facebook,
} from "lucide-react";

import { Sector } from "@/types";
import { SECTORS } from "@/data/dummy";

const brandGreen = "#00A651";

const QUICK_LINKS = [
    { name: "News", href: "/news" },
    { name: "Articles", href: "/articles" },
    { name: "Opinions", href: "/opinion" },
    { name: "Reports", href: "/reports" },
    { name: "Videos", href: "/videos" },
    { name: "Events", href: "/events" },
];

const COMPANY = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Advertise", href: "/advertise" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
];

const SOCIAL_ICONS = [
    { Icon: X, href: "https://x.com/energdive", label: "Twitter" },
    { Icon: Linkedin, href: "https://www.linkedin.com/company/energdive/", label: "LinkedIn" },
    { Icon: Youtube, href: "https://www.youtube.com/@energdive", label: "YouTube" },
    { Icon: Instagram, href: "https://www.instagram.com/energdiveindia", label: "Instagram" },
    { Icon: Facebook, href: "https://www.facebook.com/energdive/", label: "Facebook" },
];

const SECTOR_ORDER = [
    "oil-gas",
    "power-generation",
    "renewables",
    "transmission",
    "distribution",
    "electricity-markets",
    "new-energies",
    "energy-storage",
    "sustainability-and-safety",
];

export function Footer() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const [year, setYear] = useState(2026); // Default to current year or a static value

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    const orderedSectors = SECTOR_ORDER
        .map((slug) => SECTORS.find((sector) => sector.slug === slug))
        .filter((sector): sector is Sector => Boolean(sector));

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
            setEmail("");
            setTimeout(() => setSubscribed(false), 4000);
        }
    };

    return (
        <footer className="bg-[#0A0A0A] text-white relative overflow-hidden">
            {/* Decorative top accent */}
            <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent 5%, ${brandGreen} 50%, transparent 95%)` }} />

            <div className="container mx-auto px-6 lg:px-12 max-w-[1400px]">

                {/* ─── Newsletter Banner ─── */}
                <div className="py-10 border-b border-white/[0.06]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: brandGreen }}>
                                <Send size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold tracking-tight">Subscribe to our Newsletter</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Get energy intelligence delivered weekly. Join 10,000+ industry professionals.</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-[280px]">
                                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-[#00A651]/50 focus:ring-1 focus:ring-[#00A651]/20 outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white flex items-center gap-1.5 hover:brightness-110 transition-all shrink-0"
                                style={{ background: brandGreen }}
                            >
                                {subscribed ? "✓ Done!" : <>Subscribe <ArrowRight size={14} /></>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ─── Main Footer Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-14">

                    {/* Brand Column */}
                    <div className="lg:col-span-4">
                        <Link href="/" className="inline-block mb-6 group">
                            <NextImage
                                src="/logo2-removebg-preview.png"
                                alt="EnergDive"
                                width={200}
                                height={55}
                                className="h-11 w-auto brightness-0 invert group-hover:opacity-80 transition-opacity"
                            />
                        </Link>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-7 max-w-sm">
                            India&apos;s premier energy intelligence platform delivering in-depth coverage, analysis, and insights across Oil &amp; Gas, Power, Renewables, and the evolving energy landscape.
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-2.5">
                            {SOCIAL_ICONS.map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
                                >
                                    <Icon size={14} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Sectors */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Sectors</h4>
                        <ul className="space-y-2">
                            {orderedSectors.map((sector) => (
                                <li key={sector.title}>
                                    <Link href={`/sectors/${sector.slug}`} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                        {sector.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Quick Links</h4>
                        <ul className="space-y-2">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Company</h4>
                        <ul className="space-y-2">
                            {COMPANY.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Get in Touch</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2.5">
                                <MapPin size={13} className="text-gray-600 mt-0.5 shrink-0" />
                                <span className="text-[13px] text-gray-500 leading-relaxed">Sector 12A, Dwarka, New Delhi 110075</span>
                            </li>
                            <li>
                                {/* Hydration Fix: Hardcoded email matches client and server */}
                                <a href="mailto:contact@energdive.com" className="flex items-center gap-2.5 text-[13px] text-gray-500 hover:text-white transition-colors">
                                    <Mail size={13} className="text-gray-600 shrink-0" />
                                    contact@energdive.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ─── Bottom Bar ─── */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t border-white/[0.06]">
                    <p className="text-[11px] text-gray-600">
                        &copy; <span>{year}</span> EnergDive. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5">
                        <Link href="/terms" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Privacy</Link>
                        <Link href="/cookies" className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}