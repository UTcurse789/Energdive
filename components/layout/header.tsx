"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Menu, X, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/buttons";
import { SECTORS } from "@/data/dummy";
import Image from "next/image";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSectorOpen, setIsSectorOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <header
            className={cn(
                "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent",
                isScrolled ? "bg-white/95 backdrop-blur-sm shadow-sm border-border py-2" : "bg-white py-4 border-border"
            )}
        >
            <div className="container flex items-center justify-between h-16">
                {/* Left: Logo */}
                <Link href="/" className="shrink-0 z-50">
                    <Image className="font-serif text-3xl font-black tracking-tight text-primary" src="/Energdive-Logo.png" alt="EnergDive" width={200} height={200} />
                </Link>

                {/* Center: Navigation (Desktop) */}
                <nav className="hidden lg:flex items-center gap-6">
                    <Link href="/news" className="text-sm font-medium hover:text-primary transition-colors">News</Link>
                    <Link href="/reports" className="text-sm font-medium hover:text-primary transition-colors">Reports</Link>
                    <Link href="/opinion" className="text-sm font-medium hover:text-primary transition-colors">Opinion</Link>

                    {/* Sector Dropdown */}
                    <div
                        className="relative group"
                        onMouseEnter={() => setIsSectorOpen(true)}
                        onMouseLeave={() => setIsSectorOpen(false)}
                    >
                        <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors focus:outline-none">
                            Sectors <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Mega Menu / Dropdown */}
                        <div className={cn(
                            "absolute top-full left-1/2 -translate-x-1/2 pt-4 w-screen max-w-sm transition-all duration-200 origin-top",
                            isSectorOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                        )}>
                            <div className="bg-white border border-border shadow-xl p-4 rounded-none grid grid-cols-2 gap-x-8 gap-y-2">
                                {SECTORS.map((sector) => (
                                    <Link
                                        key={sector.slug}
                                        href={`/sectors/${sector.slug}`}
                                        className="text-sm text-foreground/80 hover:text-primary py-2 border-b border-muted last:border-0 hover:pl-2 transition-all"
                                    >
                                        {sector.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Link href="/magazine" className="text-sm font-medium hover:text-primary transition-colors">Magazine</Link>
                    <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors">Events</Link>
                    <Link href="/data" className="text-sm font-medium hover:text-primary transition-colors">Data & Insights</Link>
                </nav>

                {/* Right: Actions */}
                <div className="hidden lg:flex items-center gap-4">
                    <button aria-label="Search" className="text-foreground/70 hover:text-primary transition-colors">
                        <Search className="w-5 h-5" />
                    </button>

                    <Link href="/login" className="text-sm font-medium hover:text-primary">
                        Login
                    </Link>

                    <Button variant="primary" size="sm" className="font-bold">
                        Subscribe
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden p-2 z-50 text-foreground"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Drawer */}
            <div className={cn(
                "fixed inset-0 bg-background z-40 transition-transform duration-300 lg:hidden pt-24 px-6 overflow-y-auto",
                isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col gap-6">
                    <Link href="/subscribe" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                        <Button fullWidth size="lg">Subscribe Now</Button>
                    </Link>

                    <nav className="flex flex-col gap-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Sections</div>
                        <Link href="/news" className="text-xl font-serif font-bold" onClick={() => setIsMobileMenuOpen(false)}>News</Link>
                        <Link href="/reports" className="text-xl font-serif font-bold" onClick={() => setIsMobileMenuOpen(false)}>Reports</Link>
                        <Link href="/opinion" className="text-xl font-serif font-bold" onClick={() => setIsMobileMenuOpen(false)}>Opinion</Link>
                        <Link href="/magazine" className="text-xl font-serif font-bold" onClick={() => setIsMobileMenuOpen(false)}>Magazine</Link>

                        <div className="border-t border-border my-2"></div>

                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Sectors</div>
                        {SECTORS.map((sector) => (
                            <Link
                                key={sector.slug}
                                href={`/sectors/${sector.slug}`}
                                className="text-lg font-medium text-foreground/80"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {sector.title}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-auto pb-8 border-t border-border pt-6">
                        <Link href="/login" className="flex items-center gap-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                            <User className="w-5 h-5" /> Login
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
