"use client";

import { useEffect, useState } from "react";
import { FileBarChart2, Loader2, Plus, X, ChevronDown, User, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useDashboard } from "@/components/dashboard/dashboard-shell";

interface TrendingItem {
    id: string;
    title: string;
    slug: string;
    category: string;
    contentType: string;
    author: string;
    authorAvatar: string | null;
    date: string;
}

interface AvailableCommunity {
    id: number;
    name: string;
    sub_communities: { id: number; community_id: number; name: string }[];
}

export function TrendsSidebar() {
    const { profile, refreshProfile, feedKey } = useDashboard();
    const [trending, setTrending] = useState<TrendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTrending() {
            try {
                // Only fetch News for trending
                const res = await fetch("/api/dashboard/feed?pageSize=5&type=News");
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                setTrending(
                    (data.items || []).slice(0, 5).map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        slug: item.slug,
                        category: item.category,
                        contentType: item.contentType,
                        author: item.author,
                        authorAvatar: item.authorAvatar || null,
                        date: item.date,
                    }))
                );
            } catch (err) {
                console.error("Trending error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTrending();
    }, [feedKey]);

    const getLink = (item: TrendingItem) => `/news/${item.slug}`;

    const formatDate = (d: string) => {
        if (!d) return "";
        try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
        catch { return d; }
    };

    const cardStyle = {
        background: "var(--dash-card)",
        border: "1px solid var(--dash-border)",
    };

    return (
        <div className="space-y-5">
            {/* Trending News */}
            <div className="rounded-xl p-5 shadow-sm" style={cardStyle}>
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-4 rounded-full" style={{ background: "var(--dash-accent)" }} />
                    <h3 className="font-bold text-sm" style={{ color: "var(--dash-text)" }}>Trending News</h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--dash-accent)" }} />
                    </div>
                ) : trending.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: "var(--dash-text-dim)" }}>
                        No trending news yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {trending.map((item, i) => (
                            <Link key={item.id} href={getLink(item)} className="block group">
                                <div className="flex gap-2.5">
                                    <span
                                        className="text-2xl font-black leading-none flex-shrink-0 w-6 mt-0.5"
                                        style={{ color: i === 0 ? "var(--dash-accent)" : "var(--dash-border)" }}
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5 transition-colors" style={{ color: "var(--dash-text)" }}>
                                            <span className="group-hover:text-[var(--dash-accent)] transition-colors">
                                                {item.title}
                                            </span>
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {item.authorAvatar ? (
                                                <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                                    <Image src={item.authorAvatar} alt={item.author} fill className="object-cover" />
                                                </div>
                                            ) : (
                                                <User size={12} style={{ color: "var(--dash-text-dim)" }} />
                                            )}
                                            <span className="text-[10px]" style={{ color: "var(--dash-text-dim)" }}>{item.author}</span>
                                            <span className="text-[10px] ml-auto flex items-center gap-0.5" style={{ color: "var(--dash-text-dim)" }}>
                                                <Calendar size={9} />{formatDate(item.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Community Widget with Edit */}
            <CommunityWidget
                currentCommunities={profile.communities}
                onUpdate={refreshProfile}
                cardStyle={cardStyle}
            />

            {/* Feature Teaser */}
            <div
                className="rounded-xl p-7 text-center"
                style={{
                    background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.05) 100%)",
                    border: "1px solid var(--dash-border-gold)",
                }}
            >
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(201,168,76,0.2)" }}>
                    <FileBarChart2 size={22} style={{ color: "var(--dash-accent)" }} />
                </div>
                <h3 className="font-bold mb-2 text-sm" style={{ color: "var(--dash-text)" }}>More Features Coming</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--dash-text-dim)" }}>
                    Data tools, AI insights and executive lounges arriving soon.
                </p>
            </div>
        </div>
    );
}

/* ─── Community Widget with Edit ───────────────────────────────── */
function CommunityWidget({
    currentCommunities,
    onUpdate,
    cardStyle,
}: {
    currentCommunities: { community_id: number; community_name: string; sub_community_id: number; sub_community_name: string }[];
    onUpdate: () => Promise<void>;
    cardStyle: React.CSSProperties;
}) {
    const [allCommunities, setAllCommunities] = useState<AvailableCommunity[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedComm, setSelectedComm] = useState<number | null>(null);
    const [selectedSubs, setSelectedSubs] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    // Fetch all communities when we need them (add or edit)
    useEffect(() => {
        if (showAdd && !loaded) {
            fetch("/api/master/communities")
                .then((r) => r.json())
                .then((data) => { setAllCommunities(data); setLoaded(true); })
                .catch(console.error);
        }
    }, [showAdd, loaded]);

    const selectedCommObj = allCommunities.find((c) => c.id === selectedComm);
    const existingPairs = new Set(currentCommunities.map((c) => `${c.community_id}-${c.sub_community_id}`));

    const grouped = currentCommunities.reduce((acc, c) => {
        if (!acc.has(c.community_id)) {
            acc.set(c.community_id, { name: c.community_name, subs: [] as { id: number; name: string }[] });
        }
        acc.get(c.community_id)!.subs.push({ id: c.sub_community_id, name: c.sub_community_name });
        return acc;
    }, new Map<number, { name: string; subs: { id: number; name: string }[] }>());

    const toggleSelectedSub = (subId: number) => {
        setSelectedSubs((prev) => {
            const next = new Set(prev);
            if (next.has(subId)) next.delete(subId);
            else next.add(subId);
            return next;
        });
    };

    async function handleAdd() {
        if (!selectedComm || selectedSubs.size === 0) return;
        setSaving(true);
        try {
            const newSelections = [
                ...currentCommunities.map((c) => ({ communityId: c.community_id, subCommunityId: c.sub_community_id })),
                ...Array.from(selectedSubs)
                    .filter((subId) => !existingPairs.has(`${selectedComm}-${subId}`))
                    .map((subId) => ({ communityId: selectedComm, subCommunityId: subId })),
            ];
            if (newSelections.length === currentCommunities.length) {
                setSaving(false);
                setShowAdd(false);
                setSelectedComm(null);
                setSelectedSubs(new Set());
                return;
            }
            await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ communitySelections: newSelections }),
            });
            await onUpdate();
            setShowAdd(false);
            setSelectedComm(null);
            setSelectedSubs(new Set());
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }

    async function handleRemove(communityId: number, subCommunityId: number) {
        setSaving(true);
        try {
            const newSelections = currentCommunities
                .filter((c) => !(c.community_id === communityId && c.sub_community_id === subCommunityId))
                .map((c) => ({ communityId: c.community_id, subCommunityId: c.sub_community_id }));
            await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ communitySelections: newSelections }),
            });
            await onUpdate();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }

    return (
        <div className="rounded-xl p-5 shadow-sm" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: "var(--dash-accent)" }} />
                    <h3 className="font-bold text-sm" style={{ color: "var(--dash-text)" }}>Your Communities</h3>
                </div>
                {!showAdd && (
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-1 text-xs font-semibold transition-colors"
                        style={{ color: "var(--dash-accent)" }}
                    >
                        <Plus size={13} /> Add
                    </button>
                )}
            </div>

            {/* Community list */}
            {currentCommunities.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--dash-text-dim)" }}>
                    No communities selected.
                </p>
            ) : (
                <div className="space-y-2.5 mb-4">
                    {Array.from(grouped.entries()).map(([communityId, group]) => (
                        <div key={communityId} className="rounded-lg px-3 py-3" style={{ background: "var(--dash-surface-2)" }}>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>{group.name}</p>
                                <span className="text-[10px]" style={{ color: "var(--dash-text-dim)" }}>
                                    {group.subs.length} topic{group.subs.length > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {group.subs.map((sub) => (
                                    <span
                                        key={sub.id}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                        style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", color: "var(--dash-text)" }}
                                    >
                                        {sub.name}
                                        <button
                                            onClick={() => handleRemove(communityId, sub.id)}
                                            disabled={saving}
                                            className="p-0.5 rounded hover:bg-red-500/10"
                                            style={{ color: "var(--dash-text-dim)" }}
                                            title="Remove sub-community"
                                        >
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add community form */}
            {showAdd && (
                <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--dash-border-subtle)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--dash-text-dim)" }}>Add Community</p>

                    <div className="relative">
                        <select
                            value={selectedComm ?? ""}
                            onChange={(e) => {
                                const nextVal = Number(e.target.value) || null;
                                setSelectedComm(nextVal);
                                setSelectedSubs(new Set());
                            }}
                            className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm outline-none pr-8"
                            style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border)", color: "var(--dash-text)" }}
                        >
                            <option value="">Select community...</option>
                            {allCommunities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--dash-text-dim)" }} />
                    </div>

                    {selectedCommObj && (
                        <div className="flex flex-wrap gap-2">
                            {selectedCommObj.sub_communities.map((sc) => {
                                const isSelected = selectedSubs.has(sc.id);
                                return (
                                    <button
                                        key={sc.id}
                                        onClick={() => toggleSelectedSub(sc.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSelected
                                                ? "bg-[var(--dash-accent)] text-black border-[var(--dash-accent)]"
                                                : "bg-[var(--dash-surface)] text-[var(--dash-text-muted)] border-[var(--dash-border)]"
                                            }`}
                                    >
                                        {isSelected ? "✔ " : ""}{sc.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            disabled={!selectedComm || selectedSubs.size === 0 || saving}
                            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            {saving ? "Saving..." : "Add"}
                        </button>
                        <button
                            onClick={() => { setShowAdd(false); setSelectedComm(null); setSelectedSubs(new Set()); }}
                            className="px-4 py-2.5 rounded-lg text-sm transition-colors"
                            style={{ background: "var(--dash-surface-2)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
