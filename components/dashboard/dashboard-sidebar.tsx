"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    Home,
    LayoutGrid,
    CreditCard,
    Calendar,
    Settings,
    Bookmark,
    Download,
    FileText,
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    PlusCircle,
    X
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { CustomUserMenu } from "@/components/layout/CustomUserMenu";
import { useDashboard } from "./dashboard-shell";

type SubItem = {
    label: string;
    href: string;
    match?: string;
    badgeKey?: string;
    icon?: React.ForwardRefExoticComponent<any>;
};

const NAV_ITEMS = [
    { label: "ENERGDIVE", href: "/", icon: Home },
    { label: "My Feed", href: "/dashboard", icon: LayoutGrid, exact: true },
    { label: "Saved", href: "/dashboard/saved", icon: Bookmark, badgeKey: "saved" },
    { label: "My Downloads", href: "/dashboard/my-downloads", icon: Download, badgeKey: "downloads" },
    {
        label: "Insight Exchange",
        icon: FileText,
        subItems: [
            { label: "All Submissions", href: "/dashboard/my-submissions?view=submissions", match: "/dashboard/my-submissions" },
            { label: "Abstract", href: "/dashboard/my-submissions?view=abstract", badgeKey: "abstracts" },
            { label: "Final Paper", href: "/dashboard/my-submissions?view=final-paper", badgeKey: "finalPaper" },
            { label: "Re Submission", href: "/dashboard/my-submissions?view=resubmission", badgeKey: "resubmission" },
            { label: "New Abstract Submission", href: "/dashboard/submit-paper", icon: PlusCircle }
        ] as SubItem[]
    },
    {
        label: "Account Settings",
        icon: Settings,
        subItems: [
            { label: "Profile", href: "/dashboard/settings?tab=profile" },
            { label: "Communities & Industries", href: "/dashboard/settings?tab=communities" },
            { label: "Membership", href: "/dashboard/settings?tab=membership" },
            { label: "Personalized Briefings", href: "/dashboard/settings?tab=briefings" },
            { label: "Security", href: "/dashboard/settings?tab=security" }
        ] as SubItem[]
    }
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { profile, sidebarOpen, setSidebarOpen, badgeCounts } = useDashboard();
    
    const firstName = profile.first_name || user?.firstName || "User";
    const lastName = profile.last_name || user?.lastName || "";
    const role = profile.job_title || "Member";
    
    // Desktop collapsed state
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // Submenu expansion state
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        "My Submission": true
    });

    const [seenCounts, setSeenCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem("energclub_seen_counts");
            if (stored) {
                setSeenCounts(JSON.parse(stored));
            }
        } catch (e) {}
    }, []);

    useEffect(() => {
        if (!badgeCounts) return;
        const view = searchParams.get('view');
        
        let keysToUpdate: string[] = [];
        
        if (pathname === "/dashboard/my-downloads") keysToUpdate = ["downloads"];
        if (pathname === "/dashboard/saved") keysToUpdate = ["saved"];
        if (pathname === "/dashboard/my-submissions") {
            if (view === "abstract") keysToUpdate.push("abstracts");
            if (view === "final-paper") keysToUpdate.push("finalPaper");
            if (view === "resubmission") keysToUpdate.push("resubmission");
            if (view === "submissions" || !view) {
                keysToUpdate = ["abstracts", "finalPaper", "resubmission"];
            }
        }

        if (keysToUpdate.length > 0) {
            setSeenCounts(prev => {
                const next = { ...prev };
                let changed = false;
                for (const k of keysToUpdate) {
                    const typedK = k as keyof typeof badgeCounts;
                    if (next[typedK] !== badgeCounts[typedK]) {
                        next[typedK] = badgeCounts[typedK] || 0;
                        changed = true;
                    }
                }
                if (changed) {
                    localStorage.setItem("energclub_seen_counts", JSON.stringify(next));
                }
                return next;
            });
        }
    }, [pathname, searchParams, badgeCounts]);

    const hasNewBadge = (key?: string) => {
        if (!key || !badgeCounts) return false;
        const typedK = key as keyof typeof badgeCounts;
        return (badgeCounts[typedK] || 0) > (seenCounts[typedK] || 0);
    };

    const hasAnyChildBadge = (item: any) => {
        if (!item.subItems) return false;
        return item.subItems.some((sub: any) => hasNewBadge(sub.badgeKey));
    };

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
        if (isCollapsed) {
            setIsCollapsed(false);
        }
    };

    const isItemActive = (item: any) => {
        if (item.exact) return pathname === item.href;
        if (item.subItems) {
            return item.subItems.some((sub: any) => {
                if (sub.match) return pathname.startsWith(sub.match);
                return pathname === sub.href.split('?')[0]; 
            });
        }
        if (item.href === "/") return pathname === "/";
        return pathname.startsWith(item.href);
    };

    const isSubItemActive = (href: string) => {
        const path = href.split('?')[0];
        const search = href.split('?')[1];
        
        if (pathname !== path) return false;
        
        if (search) {
            const params = new URLSearchParams(search);
            for (const [key, value] of params.entries()) {
                const currentVal = searchParams.get(key);
                if (currentVal !== value) {
                    // Default to profile if no tab is provided on settings
                    if (path === "/dashboard/settings" && key === "tab" && value === "profile" && !currentVal) {
                        return true;
                    }
                    return false;
                }
            }
        } else {
            if (searchParams.toString()) return false;
        }
        
        return true;
    };

    if (!mounted) return null;

    const sidebarContent = (
        <div className="flex flex-col h-full bg-[var(--dash-surface)] border-r border-[var(--dash-border)]">
            <div className="flex items-center justify-between p-4 h-[70px] border-b border-[var(--dash-border-subtle)] sm:hidden">
                <span className="font-bold text-lg text-[var(--dash-text)]">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)]">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 hide-scrollbar">
                {NAV_ITEMS.map((item, idx) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;
                    const hasSubItems = !!item.subItems;
                    const isGroupExpanded = expandedGroups[item.label];
                    const showParentBadge = hasAnyChildBadge(item) || hasNewBadge((item as any).badgeKey);

                    if (hasSubItems) {
                        return (
                            <div key={item.label} className="flex flex-col mb-1">
                                <button
                                    onClick={() => toggleGroup(item.label)}
                                    className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors group relative ${
                                        active ? "bg-[var(--dash-accent)]/10 text-[var(--dash-accent)]" : "text-[var(--dash-text-muted)] hover:bg-[var(--dash-border-subtle)] hover:text-[var(--dash-text)]"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Icon size={18} className={active ? "text-[var(--dash-accent)]" : "text-[var(--dash-text-muted)] group-hover:text-[var(--dash-text)]"} />
                                            {isCollapsed && showParentBadge && (
                                                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--dash-accent)] animate-pulse border border-[var(--dash-surface)]"></div>
                                            )}
                                        </div>
                                        {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="flex items-center gap-2">
                                            {showParentBadge && <div className="w-2 h-2 rounded-full bg-[var(--dash-accent)] animate-pulse"></div>}
                                            {isGroupExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                    )}
                                </button>
                                
                                {(!isCollapsed && isGroupExpanded) && (
                                    <div className="flex flex-col gap-1 mt-1 pl-[28px]">
                                        {item.subItems?.map((sub, sIdx) => {
                                            const subActive = isSubItemActive(sub.href);
                                            const SubIcon = sub.icon;
                                            const showSubBadge = hasNewBadge((sub as any).badgeKey);
                                            return (
                                                <Link 
                                                    key={sIdx} 
                                                    href={sub.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                                                        subActive ? "text-[var(--dash-accent)] font-medium" : "text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-border-subtle)]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {SubIcon && <SubIcon size={14} />}
                                                        <span className="text-xs">{sub.label}</span>
                                                    </div>
                                                    {showSubBadge && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--dash-accent)]/20 text-[var(--dash-accent)]">
                                                            New
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const showItemBadge = hasNewBadge((item as any).badgeKey);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            title={isCollapsed ? item.label : undefined}
                            className={`flex items-center justify-between p-2.5 rounded-lg transition-colors group mb-1 ${
                                active ? "bg-[var(--dash-accent)]/10 text-[var(--dash-accent)]" : "text-[var(--dash-text-muted)] hover:bg-[var(--dash-border-subtle)] hover:text-[var(--dash-text)]"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Icon size={18} className={active ? "text-[var(--dash-accent)]" : "text-[var(--dash-text-muted)] group-hover:text-[var(--dash-text)]"} />
                                                    {isCollapsed && showItemBadge && (
                                                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--dash-accent)] animate-pulse border border-[var(--dash-surface)]"></div>
                                                    )}
                                                </div>
                                                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                                            </div>
                                            {!isCollapsed && showItemBadge && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--dash-accent)]/20 text-[var(--dash-accent)]">
                                                    New
                                                </span>
                                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Section: Profile */}
            <div className="mt-auto flex flex-col border-t border-[var(--dash-border-subtle)]">
                <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-3 py-4' : 'justify-between px-4 py-3'}`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="flex-shrink-0 select-none pointer-events-none">
                            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent">
                                <img
                                    src={user?.imageUrl || "/magazine-default.jpg"}
                                    alt={firstName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0 pr-2 select-none">
                                <p className="text-sm font-bold leading-none truncate" style={{ color: "var(--dash-text)" }}>
                                    {firstName} {lastName}
                                </p>
                                <p className="text-xs mt-1 truncate" style={{ color: "var(--dash-text-dim)" }}>
                                    {role}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-1.5 rounded-md text-[var(--dash-text-muted)] hover:bg-[var(--dash-border-subtle)] hover:text-[var(--dash-text)] transition-colors hidden sm:block ${isCollapsed ? '' : ''}`}
                    >
                        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside 
                className={`hidden sm:block h-full transition-all duration-300 ease-in-out z-40`}
                style={{ 
                    width: isCollapsed ? "70px" : "260px",
                    minWidth: isCollapsed ? "70px" : "260px"
                }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Drawer Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 sm:hidden" 
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside 
                className={`fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-[var(--dash-surface)] transform transition-transform duration-300 ease-in-out sm:hidden ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {sidebarContent}
            </aside>
            
            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
}
