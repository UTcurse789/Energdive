"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Rss,
    FileBarChart2,
    CalendarDays,
    Settings,
} from "lucide-react";
import { useDashboard } from "./dashboard-shell";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Intelligence Feed", href: "/dashboard/feed", icon: Rss },
    { label: "Market Reports", href: "/dashboard/reports", icon: FileBarChart2 },
    { label: "Events", href: "/dashboard/events", icon: CalendarDays },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function LeftSidebar() {
    const pathname = usePathname();
    const { profile, sidebarOpen, setSidebarOpen } = useDashboard();

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    flex flex-col shrink-0 border-r overflow-y-auto dashboard-scrollbar
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}
                style={{
                    width: "var(--dash-sidebar-w)",
                    background: "var(--dash-surface)",
                    borderColor: "var(--dash-border-subtle)",
                    top: "var(--dash-header-h)",
                }}
            >
                {/* Navigation */}
                <nav className="flex-1 px-3 py-5">
                    <p
                        className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-3"
                        style={{ color: "var(--dash-text-dim)" }}
                    >
                        Navigation
                    </p>
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                                            transition-all duration-200
                                            ${isActive
                                                ? ""
                                                : "hover:bg-white/5"
                                            }
                                        `}
                                        style={
                                            isActive
                                                ? {
                                                    background: "var(--dash-accent-dim)",
                                                    color: "var(--dash-accent)",
                                                }
                                                : { color: "var(--dash-text-muted)" }
                                        }
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Communities */}
                <div className="px-3 pb-5">
                    <div className="border-t pt-4" style={{ borderColor: "var(--dash-border-subtle)" }}>
                        <p
                            className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-3"
                            style={{ color: "var(--dash-text-dim)" }}
                        >
                            Your Communities
                        </p>
                        <ul className="space-y-1">
                            {profile.communities.length > 0 ? (
                                profile.communities.map((c) => (
                                    <li
                                        key={`${c.community_id}-${c.sub_community_id}`}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors cursor-pointer"
                                        style={{ color: "var(--dash-text-muted)" }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ background: "var(--dash-teal)" }}
                                        />
                                        <span className="truncate">
                                            {c.community_name}
                                            <span className="mx-1" style={{ color: "var(--dash-text-dim)" }}>→</span>
                                            <span className="font-medium" style={{ color: "var(--dash-text)" }}>
                                                {c.sub_community_name}
                                            </span>
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li
                                    className="px-3 py-2 text-sm italic"
                                    style={{ color: "var(--dash-text-dim)" }}
                                >
                                    No communities joined
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </aside>
        </>
    );
}
