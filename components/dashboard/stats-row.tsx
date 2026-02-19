"use client";

import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDashboard } from "./dashboard-shell";

/* ── Types ─────────────────────────────────────────────────────── */
interface SectorIndex {
    name: string;
    value: number;
    change: number;       // percentage change
    changeDir: "up" | "down" | "flat";
}

/* ── Simulated real-time index data ────────────────────────────── */
// In production, replace this with a real API (e.g., /api/dashboard/indices)
function generateIndices(communities: { community_name: string }[]): SectorIndex[] {
    if (communities.length === 0) return [];

    // Deduplicate by community_name so we don't show the same sector twice
    const seen = new Set<string>();
    const unique = communities.filter((c) => {
        if (seen.has(c.community_name)) return false;
        seen.add(c.community_name);
        return true;
    });

    return unique.map((c) => {
        // Seed-based pseudo-random so values are consistent per community name
        let seed = 0;
        for (let i = 0; i < c.community_name.length; i++) seed += c.community_name.charCodeAt(i);

        const baseValue = 1000 + (seed % 9000);        // 1000 – 9999
        const fluctuation = (Math.random() - 0.45) * 40; // slight upward bias
        const value = Math.round((baseValue + fluctuation) * 100) / 100;
        const changePct = Math.round(fluctuation / baseValue * 10000) / 100;

        return {
            name: c.community_name,
            value,
            change: Math.abs(changePct),
            changeDir: changePct > 0.05 ? "up" : changePct < -0.05 ? "down" : "flat",
        };
    });
}

/* ── Component ──────────────────────────────────────────────────── */
export function StatsRow() {
    const { profile } = useDashboard();
    const communities = profile.communities || [];
    const [indices, setIndices] = useState<SectorIndex[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const refresh = useCallback(() => {
        setIndices(generateIndices(communities));
    }, [communities]);

    useEffect(() => {
        refresh();
        // Update every 5 seconds for real-time feel
        intervalRef.current = setInterval(refresh, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [refresh]);

    if (communities.length === 0) return null;

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={15} style={{ color: "var(--dash-accent)" }} />
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-dim)" }}>
                    Sector Indices
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4CAF50" }} />
                    <span className="text-[10px]" style={{ color: "var(--dash-text-dim)" }}>Live</span>
                </div>
            </div>

            {/* Ticker Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {indices.map((idx, i) => {
                    const TrendIcon = idx.changeDir === "up" ? TrendingUp : idx.changeDir === "down" ? TrendingDown : Minus;
                    const trendColor = idx.changeDir === "up" ? "#4CAF50" : idx.changeDir === "down" ? "#EF4444" : "var(--dash-text-dim)";
                    const trendBg = idx.changeDir === "up" ? "rgba(76,175,80,0.1)" : idx.changeDir === "down" ? "rgba(239,68,68,0.1)" : "rgba(161,161,170,0.1)";

                    return (
                        <div
                            key={`${idx.name}-${i}`}
                            className="rounded-xl p-4 transition-all hover:scale-[1.02] group"
                            style={{
                                background: "var(--dash-card)",
                                border: "1px solid var(--dash-border)",
                            }}
                        >
                            {/* Sector name */}
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 truncate" style={{ color: "var(--dash-text-dim)" }}>
                                {idx.name}
                            </p>

                            {/* Value + change */}
                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-xl font-black leading-none tabular-nums" style={{ color: "var(--dash-text)" }}>
                                        {idx.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold"
                                    style={{ background: trendBg, color: trendColor }}
                                >
                                    <TrendIcon size={11} />
                                    {idx.change.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
