"use client";

import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { StatsRow } from "@/components/dashboard/stats-row";
import { TrendsSidebar } from "@/components/dashboard/trends-sidebar";
import { IntelligenceFeed } from "@/components/dashboard/intelligence-feed";

export default function DashboardPage() {
    const { profile } = useDashboard();
    const firstName = profile.first_name || "User";

    return (
        <div className="animate-fade-in-up">
            {/* Welcome */}
            <div className="mb-7">
                <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--dash-text)" }}>
                    Welcome{" "}
                    <span style={{ color: "var(--dash-accent)" }}>{firstName}</span>
                </h1>
                <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                    Your intelligence hub for energy industry insights
                </p>
            </div>

            {/* Stats */}
            <StatsRow />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
                {/* Left: Feed (2/3) */}
                <div className="lg:col-span-2">
                    <div
                        className="rounded-xl p-6 shadow-sm min-h-[600px]"
                        style={{
                            background: "var(--dash-card)",
                            border: "1px solid var(--dash-border)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-1 h-5 rounded-full" style={{ background: "var(--dash-accent)" }} />
                                <h2 className="text-base font-bold" style={{ color: "var(--dash-text)" }}>
                                    Intelligence Feed
                                </h2>
                            </div>
                            <span
                                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded"
                                style={{ background: "var(--dash-accent-dim)", color: "var(--dash-accent)" }}
                            >
                                Live
                            </span>
                        </div>

                        <IntelligenceFeed />
                    </div>
                </div>

                {/* Right: Sidebar (1/3) */}
                <div className="lg:col-span-1">
                    <TrendsSidebar />
                </div>
            </div>
        </div>
    );
}