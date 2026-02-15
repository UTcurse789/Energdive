"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Search, Bell, Home, LayoutGrid, BrainCircuit, Users,
    CreditCard, Calendar, Bookmark, Settings
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useDashboard } from "./dashboard-shell";

const NAV_ITEMS = [
    { label: "Main Site", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Intelligence", href: "/dashboard/feed", icon: BrainCircuit },
    { label: "Community", href: "/dashboard/community", icon: Users },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    { label: "Bookmarks", href: "/dashboard/bookmarks", icon: Bookmark },
    { label: "Account Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardHeader() {
    const { profile } = useDashboard();
    const pathname = usePathname();
    const firstName = profile.first_name || "User";
    const role = profile.job_title || "Member";

    return (
        <header className="flex flex-col bg-white border-b sticky top-0 z-50">
            {/* ── Top Row: Brand + Search + User ── */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 h-[70px]">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="bg-[#D4AF37] w-8 h-8 flex items-center justify-center rounded text-white font-serif font-bold text-lg">
                        E
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">ENERGCLUB</span>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl mx-12 hidden md:block">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--dash-accent)] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search (Coming Soon)"
                            disabled
                            className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:bg-white focus:border-[var(--dash-accent)] focus:ring-4 focus:ring-[var(--dash-accent-dim)] transition-all"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-5">
                    <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="flex items-center gap-3 pl-5 border-l border-gray-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900 leading-none">{firstName} {profile.last_name}</p>
                            <p className="text-xs text-gray-500 mt-1">{role}</p>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>

            {/* ── Bottom Row: Navigation ── */}
            <div className="flex items-center gap-1 px-6 h-[50px] overflow-x-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-2 px-4 h-full border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                                ${isActive
                                    ? "border-[var(--dash-accent)] text-[var(--dash-accent)]"
                                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }
                            `}
                        >
                            <Icon size={16} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>
        </header>
    );
}
