"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, LayoutGrid, CreditCard, Calendar, Settings, Bookmark, FileText
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { CustomUserMenu } from "@/components/layout/CustomUserMenu";
import { useDashboard } from "./dashboard-shell";

const NAV_ITEMS = [
    { label: "ENERGDIVE", href: "/", icon: Home },
    { label: "My Feed", href: "/dashboard", icon: LayoutGrid },
    { label: "Submit Paper", href: "/dashboard/submit-paper", icon: FileText },
    { label: "Saved", href: "/dashboard/saved", icon: Bookmark },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    { label: "Account Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardHeader() {
    const { profile } = useDashboard();
    const { user } = useUser();
    const pathname = usePathname();
    const firstName = profile.first_name || user?.firstName || "User";
    const lastName = profile.last_name || user?.lastName || "";
    const role = profile.job_title || "Member";

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

                {/* Right Actions */}
                <div className="flex items-center gap-5">
                    <div
                        className="flex items-center gap-3 pl-5"
                        style={{ borderLeft: "1px solid var(--dash-border)" }}
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold leading-none" style={{ color: "var(--dash-text)" }}>
                                {firstName} {lastName}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--dash-text-dim)" }}>
                                {role}
                            </p>
                        </div>
                        <CustomUserMenu />
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <div
                className="flex items-center justify-between px-6 h-[50px] overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
            >
                {/* ENERGDIVE link on the left */}
                {(() => {
                    const homeItem = NAV_ITEMS[0];
                    const Icon = homeItem.icon;
                    const isActive = pathname === homeItem.href;
                    return (
                        <Link
                            href={homeItem.href}
                            className="flex items-center gap-2 px-4 h-full text-sm font-medium transition-all whitespace-nowrap border-b-2"
                            style={
                                isActive
                                    ? { color: "var(--dash-accent)", borderBottomColor: "var(--dash-accent)" }
                                    : { color: "var(--dash-text-muted)", borderBottomColor: "transparent" }
                            }
                        >
                            <Icon size={15} />
                            {homeItem.label}
                        </Link>
                    );
                })()}

                {/* Rest of nav items centered */}
                <div className="flex items-center gap-1 mx-auto">
                    {NAV_ITEMS.slice(1).map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-2 px-4 h-full text-sm font-medium transition-all whitespace-nowrap border-b-2"
                                style={
                                    isActive
                                        ? { color: "var(--dash-accent)", borderBottomColor: "var(--dash-accent)" }
                                        : { color: "var(--dash-text-muted)", borderBottomColor: "transparent" }
                                }
                            >
                                <Icon size={15} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
