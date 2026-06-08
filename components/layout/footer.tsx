"use client";

import Link from "next/link";
import NextImage from "next/image";
import {
    X,
    Linkedin,
    Youtube,
    Instagram,
    Facebook,
} from "lucide-react";

import { SECTORS } from "@/data/dummy";

const brandGreen = "#00A651";

const QUICK_LINKS = [
    { name: "News", href: "/news" },
    { name: "Opinions", href: "/opinion" },
    { name: "Editorials", href: "/editorial" },
    { name: "Editorial Collaboration", href: "/editorial-collaboration" },
    { name: "Reports", href: "/reports" },
    { name: "Videos", href: "/videos" },
    { name: "Events", href: "/events" },
];

const COMPANY = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Advertise", href: "/advertise-with-us" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
];

const SOCIAL_ICONS = [
    { Icon: Linkedin, href: "https://www.linkedin.com/company/energdive/", label: "LinkedIn" },
    { Icon: X, href: "https://x.com/energdive", label: "Twitter" },
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
    const orderedSectors = SECTOR_ORDER
        .map((slug) => SECTORS.find((sector) => sector.slug === slug))
        .filter(Boolean);

    return (
        <footer className="bg-[#0A0A0A] text-white relative overflow-hidden">
            {/* Decorative top accent */}
            <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent 5%, ${brandGreen} 50%, transparent 95%)` }} />

            <div className="container mx-auto px-6 lg:px-12 max-w-[1400px]">



                {/* ─── Main Footer Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-14">

                    {/* Brand Column */}
                    <div className="lg:col-span-6">
                        <Link href="/" className="inline-block mb-6 group">
                            <NextImage
                                src="/EnergDive Logo in White.png"
                                alt="EnergDive"
                                width={280}
                                height={45}
                                className="w-[200px] md:w-[250px] group-hover:opacity-100 transition-opacity"
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
                            {orderedSectors.map((sector) => sector ? (
                                <li key={sector.title}>
                                    <Link href={`/sectors/${sector.slug}`} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                                        {sector.title}
                                    </Link>
                                </li>
                            ) : null)}
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


                </div>

                {/* ─── Bottom Bar ─── */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t border-white/[0.06]">
                    <p className="text-[11px] text-gray-600">
                        &copy; {new Date().getFullYear()} ENERGDIVE. All rights reserved. Published by ClariSector Technologies Pvt. Ltd.
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
