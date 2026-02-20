"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, User, Calendar, Lock, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDashboard } from "@/components/dashboard/dashboard-shell";

interface FeedItem {
    id: string;
    title: string;
    slug: string;
    summary: string;
    allSectors: string[];
    date: string;
    author: string;
    authorAvatar: string | null;
    image: string | null;
    contentType: string;
}

interface FeedResponse {
    items: FeedItem[];
    sectors: string[];
    pagination: { page: number; pageSize: number; total: number };
}

export default function IntelligencePage() {
    const { profile, feedKey } = useDashboard();
    const communities = profile.communities || [];

    // Dynamic tabs from user's communities (deduplicated by name)
    const uniqueCommunityNames = [...new Set(communities.map((c) => c.community_name))];
    const tabs = uniqueCommunityNames.length > 0
        ? [
            { id: "__all__", label: "All Sectors" },
            ...uniqueCommunityNames.map((name) => ({ id: name, label: name })),
        ]
        : [{ id: "__all__", label: "All Sectors" }];

    const [activeTab, setActiveTab] = useState("__all__");
    const [data, setData] = useState<FeedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEarlyAccess() {
            try {
                setLoading(true);
                setError(null);

                let url = "/api/dashboard/feed?pageSize=20&earlyAccess=true";
                if (activeTab !== "__all__") {
                    url += `&sector=${encodeURIComponent(activeTab)}`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed (${res.status})`);
                setData(await res.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load");
            } finally {
                setLoading(false);
            }
        }
        fetchEarlyAccess();
    }, [activeTab, feedKey]);

    const formatDate = (d: string) => {
        if (!d) return "";
        try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
        catch { return d; }
    };

    const getDetailUrl = (item: FeedItem) => {
        const t = item.contentType?.toLowerCase() || "";
        if (t.includes("news")) return `/news/${item.slug}`;
        if (t.includes("report")) return `/reports/${item.slug}`;
        if (t.includes("opinion")) return `/opinion/${item.slug}`;
        if (t.includes("video")) return `/videos/${item.slug}`;
        return `/articles/${item.slug}`;
    };

    const items = data?.items || [];

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <Sparkles size={22} style={{ color: "var(--dash-accent)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--dash-text)" }}>
                            Early Access Intelligence
                        </h1>
                        <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                            Exclusive early access content from your sectors
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs — dynamic from user communities */}
            <div
                className="flex items-center gap-1 p-1.5 rounded-xl mb-7 overflow-x-auto"
                style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", scrollbarWidth: "none" }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                            style={
                                isActive
                                    ? {
                                        background: "var(--dash-accent)",
                                        color: "#0A0A0B",
                                        boxShadow: "0 2px 8px rgba(201,168,76,0.3)",
                                    }
                                    : {
                                        color: "var(--dash-text-muted)",
                                    }
                            }
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div
                className="rounded-xl p-6 shadow-sm"
                style={{ background: "var(--dash-card)", border: "1px solid var(--dash-border)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid var(--dash-border-subtle)" }}>
                    <div className="flex items-center gap-2">
                        <Lock size={14} style={{ color: "var(--dash-accent)" }} />
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--dash-accent)" }}>
                            Early Access
                        </span>
                    </div>
                    {!loading && (
                        <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                            {items.length} {items.length === 1 ? "item" : "items"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: "var(--dash-accent)" }} />
                        <p className="text-sm" style={{ color: "var(--dash-text-muted)" }}>Loading early access content...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
                        <p className="text-sm text-red-400">{error}</p>
                        <button onClick={() => setActiveTab(activeTab)} className="mt-3 text-xs font-bold hover:underline" style={{ color: "var(--dash-accent)" }}>
                            Retry
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Lock size={32} className="mb-3" style={{ color: "var(--dash-border)" }} />
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--dash-text-muted)" }}>
                            No early access content
                        </p>
                        <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                            {activeTab === "__all__"
                                ? "No early access articles available for your sectors right now."
                                : `No early access content in "${activeTab}" right now.`}
                        </p>
                    </div>
                ) : (
                    <div>
                        {items.map((item, i) => (
                            <Link key={item.id} href={getDetailUrl(item)} className="block group">
                                <article
                                    className="py-5 transition-all"
                                    style={{ borderBottom: i < items.length - 1 ? "1px solid var(--dash-border-subtle)" : "none" }}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Early access badge + sectors */}
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <span
                                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1"
                                                    style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
                                                >
                                                    <Lock size={8} /> Early Access
                                                </span>
                                                {item.allSectors.slice(0, 2).map((s, idx) => (
                                                    <span
                                                        key={`${s}-${idx}`}
                                                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                                                        style={{ background: "rgba(161,161,170,0.1)", color: "var(--dash-text-dim)" }}
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-base font-bold leading-snug mb-2" style={{ color: "var(--dash-text)" }}>
                                                <span className="group-hover:text-var(--dash-accent) transition-colors">
                                                    {item.title}
                                                </span>
                                            </h3>

                                            {/* Summary */}
                                            <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--dash-text-muted)" }}>
                                                {item.summary}
                                            </p>

                                            {/* Author */}
                                            <div className="flex items-center gap-2">
                                                {item.authorAvatar ? (
                                                    <div className="relative w-5 h-5 rounded-full overflow-hidden flex-0">
                                                        <Image src={item.authorAvatar} alt={item.author} fill className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-0" style={{ background: "var(--dash-surface-2)" }}>
                                                        <User size={11} style={{ color: "var(--dash-text-dim)" }} />
                                                    </div>
                                                )}
                                                <span className="text-xs font-semibold" style={{ color: "var(--dash-text-muted)" }}>{item.author}</span>
                                                <span className="text-xs flex items-center gap-1 ml-auto" style={{ color: "var(--dash-text-dim)" }}>
                                                    <Calendar size={10} /> {formatDate(item.date)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Thumbnail */}
                                        {item.image && (
                                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-0 self-start">
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
