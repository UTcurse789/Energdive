"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, User, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FeedItem {
    id: string;
    title: string;
    slug: string;
    summary: string;
    // category: string;
    allSectors: string[];
    date: string;
    author: string;
    authorAvatar: string | null;
    // readTime: string;
    image: string | null;
    contentType: string;
}

interface FeedResponse {
    items: FeedItem[];
    sectors: string[];
    pagination: { page: number; pageSize: number; total: number };
}

import { useDashboard } from "./dashboard-shell";

export function IntelligenceFeed() {
    const { feedKey } = useDashboard();
    const [data, setData] = useState<FeedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFeed() {
            try {
                setLoading(true);
                setError(null);
                // Only fetch Articles
                const res = await fetch("/api/dashboard/feed?pageSize=15&type=Articles");
                if (!res.ok) throw new Error(`Failed (${res.status})`);
                setData(await res.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
            } finally {
                setLoading(false);
            }
        }
        fetchFeed();
    }, [feedKey]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "var(--dash-accent)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--dash-text-muted)" }}>
                    Loading your personalized feed...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
                <p className="text-sm font-medium text-red-400">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold hover:underline" style={{ color: "var(--dash-accent)" }}>
                    Retry
                </button>
            </div>
        );
    }

    const items = data?.items || [];
    const sectors = Array.from(new Set(data?.sectors || []));

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm mb-1" style={{ color: "var(--dash-text-muted)" }}>No articles found for your sectors</p>
                <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                    {sectors.length > 0 ? `Following: ${sectors.join(", ")}` : "Update your communities to see content."}
                </p>
            </div>
        );
    }

    const formatDate = (d: string) => {
        if (!d) return "";
        try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
        catch { return d; }
    };

    const getDetailUrl = (item: FeedItem) => {
        return `/articles/${item.slug}`;
    };

    const getCatStyle = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes("oil") || c.includes("gas")) return { bg: "rgba(201,168,76,0.15)", color: "#C9A84C" };
        if (c.includes("renew") || c.includes("solar") || c.includes("wind")) return { bg: "rgba(74,222,128,0.1)", color: "#4ade80" };
        if (c.includes("power") || c.includes("generat")) return { bg: "rgba(96,165,250,0.1)", color: "#60a5fa" };
        if (c.includes("distribut")) return { bg: "rgba(167,139,250,0.1)", color: "#a78bfa" };
        if (c.includes("transmis")) return { bg: "rgba(99,102,241,0.1)", color: "#818cf8" };
        if (c.includes("market") || c.includes("electr")) return { bg: "rgba(251,146,60,0.1)", color: "#fb923c" };
        if (c.includes("stor") || c.includes("batter")) return { bg: "rgba(45,212,191,0.1)", color: "#2dd4bf" };
        if (c.includes("sustain")) return { bg: "rgba(163,230,53,0.1)", color: "#a3e635" };
        return { bg: "rgba(161,161,170,0.1)", color: "#a1a1aa" };
    };

    return (
        <>
            {/* Sector chips */}
            {sectors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5 pb-5" style={{ borderBottom: "1px solid var(--dash-border-subtle)" }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest self-center mr-1" style={{ color: "var(--dash-text-dim)" }}>
                        Following:
                    </span>
                    {sectors.map((s) => {
                        const style = getCatStyle(s);
                        return (
                            <span key={s} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: style.bg, color: style.color }}>
                                {s}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Feed — direct links, no popup */}
            <div>
                {items.map((item, i) => {
                    // const catStyle = getCatStyle(item.category);
                    return (
                        <Link
                            key={item.id}
                            href={getDetailUrl(item)}
                            className="block group"
                        >
                            <article
                                className="py-5 transition-all"
                                style={{
                                    borderBottom: i < items.length - 1 ? "1px solid var(--dash-border-subtle)" : "none",
                                }}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2.5">
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                                            // style={{ background: catStyle.bg, color: catStyle.color }}
                                            >
                                                {/* {item.category} */}
                                            </span>
                                            {/* <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--dash-text-dim)" }}>
                                                <Clock size={10} /> {item.readTime}
                                            </span> */}
                                        </div>

                                        <h3 className="text-base font-bold leading-snug mb-2" style={{ color: "var(--dash-text)" }}>
                                            <span className="group-hover:text-[var(--dash-accent)] transition-colors">
                                                {item.title}
                                            </span>
                                        </h3>

                                        <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--dash-text-muted)" }}>
                                            {item.summary}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            {item.authorAvatar ? (
                                                <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                                                    <Image src={item.authorAvatar} alt={item.author} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--dash-surface-2)" }}>
                                                    <User size={11} style={{ color: "var(--dash-text-dim)" }} />
                                                </div>
                                            )}
                                            <span className="text-xs font-semibold" style={{ color: "var(--dash-text-muted)" }}>{item.author}</span>
                                            <span className="text-xs flex items-center gap-1 ml-auto" style={{ color: "var(--dash-text-dim)" }}>
                                                <Calendar size={10} /> {formatDate(item.date)}
                                            </span>
                                        </div>
                                    </div>

                                    {item.image && (
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 self-start">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </article>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
