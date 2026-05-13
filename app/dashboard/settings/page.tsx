"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { DIGEST_FREQUENCY_OPTIONS, DIGEST_FORMAT_OPTIONS } from "@/lib/digest-preferences";
import {
    Loader2, Check, AlertCircle, Shield, Briefcase, Globe,
    Pencil, ChevronDown, Users, Layers,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────── */
interface Industry { id: number; name: string; }
interface SubIndustry { id: number; name: string; }
interface MasterCommunity { id: number; name: string; sub_communities?: { id: number; name: string }[]; }
interface UserCommunity {
    community_id: number;
    community_name: string;
    sub_community_id?: number;
    sub_community_name?: string;
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function SettingsPage() {
    const { user } = useUser();
    const { profile, refreshProfile } = useDashboard();

    /* Profile fields */
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [organization, setOrganization] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [preferredFrequency, setPreferredFrequency] = useState("daily");
    const [preferredFormats, setPreferredFormats] = useState<string[]>([]);
    const [digestEnabled, setDigestEnabled] = useState(true);

    /* Industry state */
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [subIndustries, setSubIndustries] = useState<SubIndustry[]>([]);
    const [selectedIndustryId, setSelectedIndustryId] = useState<number>(0);
    const [selectedSubIndustryId, setSelectedSubIndustryId] = useState<number>(0);
    const [editingIndustry, setEditingIndustry] = useState(false);

    /* Community state */
    const [masterCommunities, setMasterCommunities] = useState<MasterCommunity[]>([]);
    const [editingCommunities, setEditingCommunities] = useState(false);
    const [pendingCommunities, setPendingCommunities] = useState<UserCommunity[]>([]);
    const [expandedComm, setExpandedComm] = useState<number | null>(null);

    /* ── Load profile into form ──────────────────────────────────── */
    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || "");
            setLastName(profile.last_name || "");
            setJobTitle(profile.job_title || "");
            setOrganization(profile.organization || "");
            setSelectedIndustryId(profile.industry_id || 0);
            setSelectedSubIndustryId(profile.sub_industry_id || 0);
            setPreferredFrequency(profile.preferred_frequency || "daily");
            setPreferredFormats(profile.preferred_formats || []);
            setDigestEnabled(!profile.content_digest_opted_out);
        }
    }, [profile]);

    /* ── Master data ─────────────────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const [indRes, commRes] = await Promise.all([
                    fetch("/api/master/industries"),
                    fetch("/api/master/communities"),
                ]);
                setIndustries(await indRes.json());
                setMasterCommunities(await commRes.json());
            } catch (err) { console.error(err); }
        })();
    }, []);

    /* Sub-industries when industry changes */
    useEffect(() => {
        if (!selectedIndustryId) { setSubIndustries([]); return; }
        fetch(`/api/master/sub-industries?industryId=${selectedIndustryId}`)
            .then((r) => r.json())
            .then(setSubIndustries)
            .catch(console.error);
    }, [selectedIndustryId]);

    /* ── Save profile ────────────────────────────────────────────── */
    const handleSave = async () => {
        setIsSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName, lastName, jobTitle, organization,
                    industryId: selectedIndustryId || undefined,
                    subIndustryId: selectedSubIndustryId || undefined,
                }),
            });
            if (!res.ok) throw new Error();
            await refreshProfile();
            setMsg({ type: "success", text: "Profile updated successfully." });
            setEditingIndustry(false);
            setTimeout(() => setMsg(null), 3000);
        } catch {
            setMsg({ type: "error", text: "Failed to save." });
        } finally { setIsSaving(false); }
    };

    /* ── Save communities ────────────────────────────────────────── */
    const handleSaveCommunities = async () => {
        setIsSaving(true);
        try {
            const selections = pendingCommunities
                .filter((p) => p.sub_community_id)
                .map((p) => ({ communityId: p.community_id, subCommunityId: p.sub_community_id as number }));
            const res = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ communitySelections: selections }),
            });
            if (!res.ok) throw new Error();
            await refreshProfile();
            setEditingCommunities(false);
            setMsg({ type: "success", text: "Communities updated." });
            setTimeout(() => setMsg(null), 3000);
        } catch {
            setMsg({ type: "error", text: "Failed to save communities." });
        } finally { setIsSaving(false); }
    };

    /* Open community editor */
    const startEditCommunities = () => {
        setPendingCommunities(
            (profile.communities || []).map((c: UserCommunity) => ({
                community_id: c.community_id,
                community_name: c.community_name,
                sub_community_id: c.sub_community_id,
                sub_community_name: c.sub_community_name,
            }))
        );
        setEditingCommunities(true);
    };

    const toggleCommunity = (comm: MasterCommunity) => {
        const hasAny = pendingCommunities.some((p) => p.community_id === comm.id);
        if (hasAny) {
            setPendingCommunities((prev) => prev.filter((p) => p.community_id !== comm.id));
            if (expandedComm === comm.id) setExpandedComm(null);
        } else {
            setExpandedComm(comm.id);
        }
    };

    const toggleSubCommunity = (comm: MasterCommunity, sub: { id: number; name: string }) => {
        setPendingCommunities((prev) => {
            const exists = prev.some((p) => p.community_id === comm.id && p.sub_community_id === sub.id);
            if (exists) {
                return prev.filter((p) => !(p.community_id === comm.id && p.sub_community_id === sub.id));
            }
            return [
                ...prev,
                {
                    community_id: comm.id,
                    community_name: comm.name,
                    sub_community_id: sub.id,
                    sub_community_name: sub.name,
                },
            ];
        });
    };

    const togglePreferredFormat = (format: string) => {
        setPreferredFormats((prev) =>
            prev.includes(format)
                ? prev.filter((item) => item !== format)
                : [...prev, format]
        );
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    preferredFrequency,
                    preferredFormats,
                    contentDigestOptedOut: !digestEnabled,
                }),
            });
            if (!res.ok) throw new Error();
            await refreshProfile();
            setMsg({ type: "success", text: "Email briefing preferences updated." });
            setTimeout(() => setMsg(null), 3000);
        } catch {
            setMsg({ type: "error", text: "Failed to save email briefing preferences." });
        } finally {
            setIsSaving(false);
        }
    };

    const cardStyle = { background: "var(--dash-card)", border: "1px solid var(--dash-border)" };

    /* ── Derived display data ────────────────────────────────────── */
    const userCommunities: UserCommunity[] = profile.communities || [];
    const userIndustryName = industries.find((i) => i.id === (profile.industry_id || selectedIndustryId))?.name || "Not selected";
    const userSubIndustryName = profile.sub_industry_name || subIndustries.find((s) => s.id === (profile.sub_industry_id || selectedSubIndustryId))?.name || "—";

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <Briefcase size={22} style={{ color: "var(--dash-accent)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--dash-text)" }}>Account Settings</h1>
                        <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                            Manage your professional identity and platform preferences
                        </p>
                    </div>
                </div>
            </div>

            {/* Status message */}
            {msg && (
                <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-fade-in-up"
                    style={{
                        background: msg.type === "success" ? "rgba(76,175,80,0.1)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${msg.type === "success" ? "rgba(76,175,80,0.3)" : "rgba(239,68,68,0.3)"}`,
                        color: msg.type === "success" ? "#4CAF50" : "#EF4444",
                    }}
                >
                    {msg.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
                    {msg.text}
                </div>
            )}

            <div className="space-y-6">
                {/* ───────── 1. Profile ─────────────────────────────── */}
                <section className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                                <Briefcase size={18} style={{ color: "var(--dash-accent)" }} />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Professional Profile</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <DarkInput label="First Name" value={firstName} onChange={setFirstName} placeholder="e.g. Sankalp" />
                            <DarkInput label="Last Name" value={lastName} onChange={setLastName} placeholder="e.g. Gupta" />
                            <div className="md:col-span-2">
                                <DarkInput label="Work Email" value={user?.primaryEmailAddress?.emailAddress || ""} disabled />
                            </div>
                            <DarkInput label="Current Role" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Energy Analyst" />
                            <DarkInput label="Company" value={organization} onChange={setOrganization} placeholder="e.g. ONGC" />
                            {/* Membership ID — read-only, full width */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "#0AB996" }}>
                                    EnergClub Membership ID
                                </label>
                                <div
                                    className="w-full rounded-lg px-4 py-2.5 text-sm flex items-center justify-between gap-3"
                                    style={{ background: "rgba(10,185,150,0.06)", border: "1px solid rgba(10,185,150,0.3)", color: "var(--dash-text)" }}
                                >
                                    <span className="font-mono font-bold tracking-wide" style={{ color: profile?.membership_id ? "#0AB996" : "var(--dash-text-dim)" }}>
                                        {profile?.membership_id ?? "Pending verification…"}
                                    </span>
                                    {profile?.membership_id && (
                                        <button
                                            type="button"
                                            onClick={() => { navigator.clipboard.writeText(profile.membership_id ?? ""); setMsg({ type: "success", text: "Membership ID copied!" }); setTimeout(() => setMsg(null), 2000); }}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 transition-all"
                                            style={{ background: "rgba(10,185,150,0.15)", color: "#0AB996", border: "1px solid rgba(10,185,150,0.25)" }}
                                        >
                                            Copy
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-end" style={{ borderTop: "1px solid var(--dash-border)" }}>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Save Changes
                        </button>
                    </div>
                </section>

                {/* ───────── 2. Selected Communities ────────────────── */}
                <section className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(33,150,243,0.12)" }}>
                                    <Users size={18} style={{ color: "#2196F3" }} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Selected Communities</h2>
                                    <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Your energy sector communities</p>
                                </div>
                            </div>
                            {!editingCommunities && (
                                <button
                                    onClick={startEditCommunities}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                    style={{ background: "var(--dash-surface-2)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }}
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                            )}
                        </div>

                        {!editingCommunities ? (
                            /* Display mode */
                            userCommunities.length === 0 ? (
                                <p className="text-sm py-4" style={{ color: "var(--dash-text-dim)" }}>No communities selected yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {userCommunities.map((c) => (
                                        <div
                                            key={`${c.community_id}-${c.sub_community_id ?? 'none'}`}
                                            className="flex items-center gap-3 p-4 rounded-xl"
                                            style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)" }}
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                                                <Users size={14} style={{ color: "var(--dash-accent)" }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold" style={{ color: "var(--dash-text)" }}>{c.community_name}</p>
                                                {c.sub_community_name && (
                                                    <p className="text-[10px] mt-0.5" style={{ color: "var(--dash-text-dim)" }}>
                                                        ↳ {c.sub_community_name}
                                                    </p>
                                                )}
                                            </div>
                                            <Check size={14} style={{ color: "#4CAF50" }} />
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            /* Edit mode */
                            <div>
                                <div className="space-y-2 mb-5">
                                    {masterCommunities.map((mc) => {
                                        const subsForComm = pendingCommunities.filter((p) => p.community_id === mc.id);
                                        const isSelected = subsForComm.length > 0;
                                        const isExpanded = expandedComm === mc.id;
                                        return (
                                            <div key={mc.id}>
                                                <div
                                                    className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all"
                                                    style={{
                                                        background: isSelected ? "rgba(201,168,76,0.08)" : "var(--dash-surface-2)",
                                                        border: isSelected ? "1px solid var(--dash-accent)" : "1px solid var(--dash-border-subtle)",
                                                    }}
                                                    onClick={() => toggleCommunity(mc)}
                                                >
                                                    <div
                                                        className="w-5 h-5 rounded flex items-center justify-center flex-0"
                                                        style={isSelected
                                                            ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                                                            : { border: "2px solid var(--dash-border)", background: "transparent" }}
                                                    >
                                                        {isSelected && <Check size={12} />}
                                                    </div>
                                                    <span className="text-sm font-semibold flex-1" style={{ color: "var(--dash-text)" }}>{mc.name}</span>
                                                    {mc.sub_communities && mc.sub_communities.length > 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setExpandedComm(isExpanded ? null : mc.id); }}
                                                            className="text-xs flex items-center gap-1 px-2 py-1 rounded"
                                                            style={{ color: "var(--dash-accent)" }}
                                                        >
                                                            Sub <ChevronDown size={11} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                        </button>
                                                    )}
                                                </div>
                                                {mc.sub_communities && isExpanded && (
                                                    <div className="pl-10 pt-2 flex flex-wrap gap-2">
                                                        {mc.sub_communities.map((sc) => {
                                                            const selected = subsForComm.some((p) => p.sub_community_id === sc.id);
                                                            return (
                                                                <button
                                                                    key={sc.id}
                                                                    onClick={() => toggleSubCommunity(mc, sc)}
                                                                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                                                    style={selected
                                                                        ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                                                                        : { background: "var(--dash-surface-2)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }
                                                                    }
                                                                >
                                                                    {selected ? "✔ " : ""}{sc.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                    <button
                                        onClick={() => setEditingCommunities(false)}
                                        className="px-4 py-2 rounded-lg text-xs font-bold"
                                        style={{ color: "var(--dash-text-muted)" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveCommunities}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                        style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                        Save Communities
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ───────── 3. Industry & Sub-Industry ─────────────── */}
                <section className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(156,39,176,0.12)" }}>
                                    <Layers size={18} style={{ color: "#9C27B0" }} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Industry & Specialization</h2>
                                    <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Your primary industry sector</p>
                                </div>
                            </div>
                            {!editingIndustry && (
                                <button
                                    onClick={() => setEditingIndustry(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                                    style={{ background: "var(--dash-surface-2)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }}
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                            )}
                        </div>

                        {!editingIndustry ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl" style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--dash-text-dim)" }}>Industry</p>
                                    <p className="text-sm font-bold" style={{ color: "var(--dash-text)" }}>{userIndustryName}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--dash-text-dim)" }}>Sub-Industry</p>
                                    <p className="text-sm font-bold" style={{ color: "var(--dash-text)" }}>{userSubIndustryName}</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Industry */}
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--dash-text-dim)" }}>Primary Industry</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {industries.map((ind) => (
                                            <button
                                                key={ind.id}
                                                onClick={() => { setSelectedIndustryId(ind.id); setSelectedSubIndustryId(0); }}
                                                className="p-3 rounded-xl text-sm font-semibold transition-all text-left flex items-center justify-between"
                                                style={selectedIndustryId === ind.id
                                                    ? { background: "rgba(201,168,76,0.15)", border: "1px solid var(--dash-accent)", color: "var(--dash-text)" }
                                                    : { background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)", color: "var(--dash-text-muted)" }}
                                            >
                                                {ind.name}
                                                {selectedIndustryId === ind.id && <Check size={13} style={{ color: "var(--dash-accent)" }} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sub-industry */}
                                {selectedIndustryId > 0 && subIndustries.length > 0 && (
                                    <div className="mb-5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--dash-text-dim)" }}>Sub - Industry</p>
                                        <div className="flex flex-wrap gap-2">
                                            {subIndustries.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => setSelectedSubIndustryId(sub.id)}
                                                    className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                                                    style={selectedSubIndustryId === sub.id
                                                        ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                                                        : { background: "var(--dash-surface-2)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 justify-end">
                                    <button
                                        onClick={() => setEditingIndustry(false)}
                                        className="px-4 py-2 rounded-lg text-xs font-bold"
                                        style={{ color: "var(--dash-text-muted)" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                        style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                        Save Industry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>


                {/* ───────── 4. EnergClub Membership ────────────────── */}
                <section className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(10,185,150,0.15)" }}>
                                <Globe size={18} style={{ color: "#0AB996" }} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>EnergClub Membership</h2>
                                <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Your unique member identifier</p>
                            </div>
                        </div>

                        {profile?.membership_id ? (
                            <div>
                                {/* Membership ID card */}
                                <div
                                    className="relative rounded-xl p-5 mb-4 overflow-hidden"
                                    style={{ background: "linear-gradient(135deg, #0a2e1f 0%, #0d3d28 100%)", border: "1px solid rgba(10,185,150,0.3)" }}
                                >
                                    {/* subtle glow */}
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(10,185,150,0.12), transparent 70%)" }} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#0AB996" }}>
                                        Membership ID
                                    </p>
                                    <p className="text-3xl font-mono font-black tracking-wider mb-3" style={{ color: "#ffffff" }}>
                                        {profile.membership_id}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(10,185,150,0.2)", color: "#0AB996", border: "1px solid rgba(10,185,150,0.3)" }}>
                                                <Check size={10} /> Verified Member
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(profile.membership_id ?? ""); setMsg({ type: "success", text: "Membership ID copied!" }); setTimeout(() => setMsg(null), 2000); }}
                                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                                            style={{ background: "rgba(10,185,150,0.15)", color: "#0AB996", border: "1px solid rgba(10,185,150,0.25)" }}
                                        >
                                            Copy ID
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                    Use this ID when contacting EnergClub support or referencing your membership.
                                </p>
                            </div>
                        ) : (
                            /* No membership ID yet */
                            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)" }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,193,7,0.1)" }}>
                                    <Loader2 size={14} style={{ color: "#FFC107" }} className="animate-spin" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>Membership ID Pending</p>
                                    <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                        Your membership ID will be assigned once your account is fully verified.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ───────── 5. Security ────────────────────────────── */}

                <section className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(10,185,150,0.15)" }}>
                                <Globe size={18} style={{ color: "#0AB996" }} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Email Briefings</h2>
                                <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Control the backend digests generated from your onboarding choices</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div
                                className="flex items-center justify-between gap-4 rounded-xl p-4"
                                style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)" }}
                            >
                                <div>
                                    <p className="text-sm font-bold" style={{ color: "var(--dash-text)" }}>
                                        Personalized briefings
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: "var(--dash-text-dim)" }}>
                                        When enabled, ENERGDIVE sends new matching News Briefing, Opinion, Insights, Events, and Case Study updates to your inbox.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDigestEnabled((prev) => !prev)}
                                    className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                                    style={digestEnabled
                                        ? { background: "rgba(10,185,150,0.16)", color: "#0AB996", border: "1px solid rgba(10,185,150,0.35)" }
                                        : { background: "var(--dash-surface)", color: "var(--dash-text-dim)", border: "1px solid var(--dash-border)" }}
                                >
                                    {digestEnabled ? "Enabled" : "Paused"}
                                </button>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--dash-text-dim)" }}>
                                    Frequency
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {DIGEST_FREQUENCY_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setPreferredFrequency(option.value)}
                                            className="px-4 py-3 rounded-xl text-sm font-semibold border transition-all"
                                            style={preferredFrequency === option.value
                                                ? { background: "rgba(10,185,150,0.12)", border: "1px solid #0AB996", color: "#0AB996" }
                                                : { background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)", color: "var(--dash-text-muted)" }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--dash-text-dim)" }}>
                                    Content Types
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {DIGEST_FORMAT_OPTIONS.map((format) => {
                                        const active = preferredFormats.includes(format);
                                        return (
                                            <button
                                                key={format}
                                                type="button"
                                                onClick={() => togglePreferredFormat(format)}
                                                className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                                                style={active
                                                    ? { background: "rgba(10,185,150,0.14)", color: "#0AB996", border: "1px solid rgba(10,185,150,0.3)" }
                                                    : { background: "var(--dash-surface-2)", color: "var(--dash-text-muted)", border: "1px solid var(--dash-border)" }}
                                            >
                                                {active ? "✓ " : ""}{format}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs mt-3" style={{ color: "var(--dash-text-dim)" }}>
                                    Digest mails only go out when fresh matching content is available for the formats you keep selected.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-end" style={{ borderTop: "1px solid var(--dash-border)" }}>
                        <button
                            onClick={handleSavePreferences}
                            disabled={isSaving || (digestEnabled && preferredFormats.length === 0)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Save Briefings
                        </button>
                    </div>
                </section>

                <section className="rounded-xl overflow-hidden" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(33,150,243,0.12)" }}>
                                <Shield size={18} style={{ color: "#2196F3" }} />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Security</h2>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "var(--dash-text-dim)" }}>
                            Your account security is managed by ENERGClub. Use the profile button in the header to manage password and 2FA settings.
                        </p>
                        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)" }}>
                            <Check size={14} style={{ color: "#4CAF50" }} />
                            <span className="text-xs font-medium" style={{ color: "#4CAF50" }}>Your Account is end to end encrypted with ENERGClub</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

/* ── Dark themed input ──────────────────────────────────────────── */
function DarkInput({ label, value, onChange, disabled, placeholder }: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    disabled?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-dim)" }}>{label}</label>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border-subtle)", color: "var(--dash-text)" }}
            />
        </div>
    );
}
