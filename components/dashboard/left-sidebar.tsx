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
                        <ul className="space-y-4">
                            {profile.communities.length > 0 ? (() => {
                                const grouped = new Map<string, typeof profile.communities>();
                                profile.communities.forEach((c) => {
                                    const list = grouped.get(c.community_name) || [];
                                    list.push(c);
                                    grouped.set(c.community_name, list);
                                });

                                return Array.from(grouped.entries()).map(([name, children]) => (
                                    <li key={name}>
                                        <div className="flex items-center gap-2.5 mb-1.5 px-3">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ background: "var(--dash-teal)" }}
                                            />
                                            <span className="text-sm font-semibold truncate" style={{ color: "var(--dash-text)" }}>
                                                {name}
                                            </span>
                                        </div>
                                        <ul className="space-y-0.5 ml-[19px] border-l pl-3" style={{ borderColor: "var(--dash-border-subtle)" }}>
                                            {children.map((c) => (
                                                <li
                                                    key={`${c.community_id}-${c.sub_community_id}`}
                                                    className="px-2 py-1 rounded text-xs transition-colors hover:bg-white/5 cursor-pointer truncate"
                                                    style={{ color: "var(--dash-text-dim)" }}
                                                >
                                                    {c.sub_community_name || "General"}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ));
                            })() : (
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
