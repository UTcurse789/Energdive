"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, LayoutGrid, CreditCard, Calendar, Settings, Bookmark, Download, Menu, Zap
} from "lucide-react";
import { useDashboard } from "./dashboard-shell";

const NAV_ITEMS = [
    { label: "ENERGDIVE", href: "/", icon: Home },
    { label: "My Feed", href: "/dashboard", icon: LayoutGrid },
    { label: "Saved", href: "/dashboard/saved", icon: Bookmark },
    { label: "My Downloads", href: "/dashboard/my-downloads", icon: Download },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    { label: "Account Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardHeader() {
    const pathname = usePathname();
    const { setSidebarOpen } = useDashboard();
    const [latestIssueSlug, setLatestIssueSlug] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function fetchLatestIssue() {
            try {
                const res = await fetch("/api/menu");
                if (!res.ok) return;
                const menuData = await res.json();
                if (!isMounted) return;

                if (Array.isArray(menuData?.issues) && menuData.issues.length > 0) {
                    const MONTH_TO_INDEX: Record<string, number> = {
                        january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
                        april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
                        august: 7, aug: 7, september: 8, sept: 8, sep: 8, october: 9,
                        oct: 9, november: 10, nov: 10, december: 11, dec: 11
                    };

                    const normalizedIssues = menuData.issues
                        .map((item: any) => {
                            const month = String(item?.Month ?? "").trim();
                            const year = String(item?.Year ?? "").trim();
                            const slugFromApi = typeof item?.slug === "string" ? item.slug.trim() : "";
                            const slug = slugFromApi || `${month.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year}`;
                            
                            const monthIndex = MONTH_TO_INDEX[month.toLowerCase().trim()] ?? -1;
                            const yearNumber = parseInt(year, 10);
                            const fallbackDate = Date.parse(item?.Date ?? item?.publishedAt ?? item?.createdAt ?? "");
                            const sortDate = !isNaN(yearNumber) && monthIndex >= 0
                                ? new Date(yearNumber, monthIndex, 1).getTime()
                                : (isNaN(fallbackDate) ? 0 : fallbackDate);
                            
                            return { slug, sortDate };
                        })
                        .filter((i: any) => i.slug);

                    normalizedIssues.sort((a: any, b: any) => b.sortDate - a.sortDate);
                    if (normalizedIssues.length > 0) {
                        setLatestIssueSlug(normalizedIssues[0].slug);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch latest issue:", err);
            }
        }
        fetchLatestIssue();
        return () => { isMounted = false; };
    }, []);

    return (
        <header
            className="flex flex-col sticky top-0 z-50"
            style={{
                background: "var(--dash-surface)",
                borderBottom: "1px solid var(--dash-border)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* ── Top Row ── */}
            <div
                className="relative flex items-center justify-between px-6 py-3 h-[70px]"
                style={{ borderBottom: "1px solid var(--dash-border-subtle)" }}
            >
                {/* Mobile Hamburger */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 mr-2 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] sm:hidden"
                >
                    <Menu size={24} />
                </button>

                {/* Left Side: Energdive Logo — hidden on mobile */}
                <Link href="/" className="flex-shrink-0 hidden sm:block">
                    <Image
                        src="/logo2-removebg-preview.png"
                        alt="Energdive"
                        width={150}
                        height={50}
                        className="object-contain"
                        priority
                    />
                </Link>

                {/* Centre / Left on mobile: EnergClub Logo */}
                <Link href="/dashboard" className="flex-shrink-0 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
                    <Image
                        src="/energclub.png"
                        alt="EnergClub"
                        width={150}
                        height={50}
                        className="object-contain"
                    />
                </Link>

                {/* Right Side: Dynamic Latest Issue Link */}
                <div className="flex-shrink-0 z-10">
                    {latestIssueSlug ? (
                        <Link
                            href={`/issues/${latestIssueSlug}`}
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border select-none"
                            style={{
                                background: "rgba(201,168,76,0.08)",
                                borderColor: "rgba(201,168,76,0.2)",
                                color: "var(--dash-accent)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(201,168,76,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                            }}
                        >
                            <Zap size={12} className="fill-[var(--dash-accent)]/20 animate-pulse text-[var(--dash-accent)]" />
                            <span>Latest Issue</span>
                        </Link>
                    ) : (
                        <Link
                            href="/issues"
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border text-[var(--dash-text-dim)] border-[var(--dash-border-subtle)] hover:text-[var(--dash-text)]"
                        >
                            <span>Issues Archive</span>
                        </Link>
                    )}
                </div>

            </div>
        </header>
    );
}
