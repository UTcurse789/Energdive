"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Search, Bell, Home, LayoutGrid, BrainCircuit, Users,
    CreditCard, Calendar, Settings
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useDashboard } from "./dashboard-shell";

const NAV_ITEMS = [
    { label: "Main Site", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Intelligence", href: "/dashboard/feed", icon: BrainCircuit },
    // { label: "Community", href: "/dashboard/community", icon: Users },
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
                className="flex items-center justify-between px-6 py-3 h-[70px]"
                style={{ borderBottom: "1px solid var(--dash-border-subtle)" }}
            >
                <Image
                    src="/energclub.png"
                    alt="ENERGClub"
                    width={130}
                    height={42}
                    className="object-contain"
                    priority
                />

                {/* Search */}
                {/* <div className="flex-1 max-w-2xl mx-12 hidden md:block">
                    <div className="relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                            style={{ color: "var(--dash-text-dim)" }}
                            size={17}
                        />
                        <input
                            type="text"
                            placeholder="Search (Coming Soon)"
                            disabled
                            className="w-full rounded-full py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
                            style={{
                                background: "var(--dash-surface-2)",
                                border: "1px solid var(--dash-border)",
                                color: "var(--dash-text-muted)",
                            }}
                        />
                    </div>
                </div> */}

                {/* Right Actions */}
                <div className="flex items-center gap-5">
                    <button
                        className="relative transition-colors"
                        style={{ color: "var(--dash-text-dim)" }}
                    >
                        <Bell size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-var(--dash-accent) rounded-full border-2"
                            style={{ borderColor: "var(--dash-surface)" }}
                        />
                    </button>

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
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    userPreviewSecondaryIdentifier: { display: "none" },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <div
                className="flex items-center gap-1 px-6 h-[50px] overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
            >
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : item.href === "/dashboard"
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
                                    ? {
                                        color: "var(--dash-accent)",
                                        borderBottomColor: "var(--dash-accent)",
                                    }
                                    : {
                                        color: "var(--dash-text-muted)",
                                        borderBottomColor: "transparent",
                                    }
                            }
                        >
                            <Icon size={15} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}
