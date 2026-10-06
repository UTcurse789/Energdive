"use client";

import Link from "next/link";
import { BrevoNewsletterForm } from "@/components/shared/BrevoNewsletterForm";
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
    { name: "Featured Stories", href: "/featured-stories" },
    { name: "Opinions", href: "/opinion" },
    { name: "Editorials", href: "/editorial" },
    { name: "Editorial Collaboration", href: "/editorial-collaboration" },
    { name: "Reports", href: "/reports" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Submit Paper", href: "/insights-exchange/call-for-papers" },
    { name: "Energy Jobs", href: "/energyjobs" },
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

function FooterBrevoForm() {
    return <BrevoNewsletterForm variant="dark" source="Footer Newsletter CTA (Brevo)" formId="footer" />;
}

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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 lg:gap-x-16 gap-y-12 py-16">

                    {/* Brand Column */}
                    <div className="lg:col-span-4 xl:col-span-3">
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
                                    target="_blank"
                                    rel="noopener"
                                    className="w-10 h-10 rounded-full border border-gray-700/60 flex items-center justify-center text-gray-300 hover:text-white hover:border-[#00A651] hover:bg-[#00A651]/10 transition-all bg-transparent"
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Sectors */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Sectors</h4>
                        <ul className="space-y-3.5">
                            {orderedSectors.map((sector) => sector ? (
                                <li key={sector.title}>
                                    <Link href={`/sectors/${sector.slug}`} className="text-[13px] text-gray-400 font-light hover:text-white transition-colors">
                                        {sector.title}
                                    </Link>
                                </li>
                            ) : null)}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Quick Links</h4>
                        <ul className="space-y-3.5">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-[13px] text-gray-400 font-light hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="lg:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Company</h4>
                        <ul className="space-y-3.5">
                            {COMPANY.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-[13px] text-gray-400 font-light hover:text-white transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-2 xl:col-span-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-5 pb-2 border-b border-white/[0.06]">Newsletter Subscribe</h4>
                        <p className="text-gray-400 text-[12px] mb-4 leading-relaxed">
                            Get our daily insights and market intelligence delivered directly to your inbox.
                        </p>
                        <FooterBrevoForm />
                    </div>


                </div>

                {/* ─── Bottom Bar ─── */}
                <div className="flex flex-col items-center justify-center py-8 border-t border-white/[0.06] text-center">
                    <p className="text-[12px] text-gray-500 font-light flex flex-col md:flex-row items-center gap-2 md:gap-3">
                        <span>&copy; {new Date().getFullYear()} ENERGDIVE. All rights reserved. Published by ClariSector Technologies Pvt. Ltd.</span>
                        <span className="hidden md:inline text-gray-700">|</span>
                        <span className="flex items-center gap-3">
                            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                            <span className="text-gray-700">|</span>
                            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <span className="text-gray-700">|</span>
                            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                        </span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
