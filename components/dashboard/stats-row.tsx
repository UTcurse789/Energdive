"use client";

import { FileText, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface StatItem {
    label: string;
    value: string;
    icon: React.ElementType;
    accentColor: string;
}

const STAT_CONFIGS = [
    { label: "Articles Published", apiKey: "articles", icon: FileText, accentColor: "#C9A84C" },
    { label: "Trending Topics", apiKey: "trending", icon: TrendingUp, accentColor: "#4ade80" },
    { label: "Active Members", apiKey: "members", icon: Users, accentColor: "#60a5fa" },
    { label: "Live Updates", apiKey: "updates", icon: Zap, accentColor: "#fb923c" },
];

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "";

export function StatsRow() {
    const [stats, setStats] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch total article count from Strapi
                const res = await fetch(
                    `${STRAPI}/api/contents?pagination[pageSize]=1&pagination[page]=1`,
                    { next: { revalidate: 300 } }
                );
                const json = await res.json();
                const total = json?.meta?.pagination?.total || 0;

                setStats({
                    articles: total > 999 ? `${(total / 1000).toFixed(1)}K` : String(total),
                    trending: "Live",
                    members: "2.4K",
                    updates: "Today",
                });
            } catch {
                setStats({
                    articles: "—",
                    trending: "Live",
                    members: "2.4K",
                    updates: "Today",
                });
            }
        }
        fetchStats();
    }, []);

    const items: StatItem[] = STAT_CONFIGS.map((cfg) => ({
        ...cfg,
        value: stats[cfg.apiKey] || "—",
    }));

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {items.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className="rounded-xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02]"
                        style={{
                            background: "var(--dash-card)",
                            border: "1px solid var(--dash-border)",
                        }}
                    >
                        <div
                            className="p-2.5 rounded-lg"
                            style={{ background: `${stat.accentColor}18` }}
                        >
                            <Icon size={20} style={{ color: stat.accentColor }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold leading-none" style={{ color: "var(--dash-text)" }}>
                                {stat.value}
                            </p>
                            <p className="text-xs mt-1.5" style={{ color: "var(--dash-text-dim)" }}>
                                {stat.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
