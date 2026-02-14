"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check } from "lucide-react";
import { useDashboard } from "./dashboard-shell";

type Tab = "personal" | "professional" | "interests";

interface EditProfileModalProps {
    open: boolean;
    onClose: () => void;
}

interface Industry { id: number; name: string; sub_industries: { id: number; industry_id: number; name: string }[]; }
interface Community { id: number; name: string; sub_communities: { id: number; community_id: number; name: string }[]; }

export function EditProfileModal({ open, onClose }: EditProfileModalProps) {
    const { profile, refreshProfile } = useDashboard();
    const [tab, setTab] = useState<Tab>("personal");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState(profile.first_name || "");
    const [lastName, setLastName] = useState(profile.last_name || "");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState(profile.country || "");
    const [state, setState] = useState(profile.state || "");
    const [jobTitle, setJobTitle] = useState(profile.job_title || "");
    const [organization, setOrganization] = useState(profile.organization || "");

    // Taxonomy
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedIndustryId, setSelectedIndustryId] = useState<number>(0);
    const [selectedSubIndustryId, setSelectedSubIndustryId] = useState<number>(0);
    const [communitySelections, setCommunitySelections] = useState<{ communityId: number; subCommunityId: number }[]>([]);

    // Load taxonomy data
    useEffect(() => {
        if (!open) return;
        Promise.all([
            fetch("/api/master/industries").then((r) => r.json()),
            fetch("/api/master/communities").then((r) => r.json()),
        ]).then(([indData, comData]) => {
            setIndustries(indData);
            setCommunities(comData);
        });
    }, [open]);

    // Reset on profile change
    useEffect(() => {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setCountry(profile.country || "");
        setState(profile.state || "");
        setJobTitle(profile.job_title || "");
        setOrganization(profile.organization || "");
        setCommunitySelections(
            profile.communities.map((c) => ({
                communityId: c.community_id,
                subCommunityId: c.sub_community_id,
            }))
        );
    }, [profile, open]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    country,
                    state,
                    jobTitle,
                    organization,
                    industryId: selectedIndustryId || undefined,
                    subIndustryId: selectedSubIndustryId || undefined,
                    communitySelections: communitySelections.length > 0 ? communitySelections : undefined,
                }),
            });
            if (!res.ok) throw new Error("Save failed");
            await refreshProfile();
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onClose();
            }, 800);
        } catch (err) {
            console.error(err);
            alert("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const toggleCommunity = (communityId: number, subCommunityId: number) => {
        setCommunitySelections((prev) => {
            const exists = prev.find((s) => s.communityId === communityId && s.subCommunityId === subCommunityId);
            if (exists) return prev.filter((s) => !(s.communityId === communityId && s.subCommunityId === subCommunityId));
            return [...prev, { communityId, subCommunityId }];
        });
    };

    if (!open) return null;

    const selectedIndustry = industries.find((i) => i.id === selectedIndustryId);

    const TABS: { key: Tab; label: string }[] = [
        { key: "personal", label: "Personal Info" },
        { key: "professional", label: "Professional Info" },
        { key: "interests", label: "Communities & Industry" },
    ];

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div
                className="relative w-full max-w-xl rounded-2xl border overflow-hidden animate-fade-in-up"
                style={{ background: "var(--dash-surface)", borderColor: "var(--dash-border)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--dash-border-subtle)" }}>
                    <h2 className="text-lg font-bold font-serif" style={{ color: "var(--dash-accent)" }}>
                        Edit Profile
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--dash-text-muted)" }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-6" style={{ borderColor: "var(--dash-border-subtle)" }}>
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className="px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px"
                            style={{
                                borderColor: tab === t.key ? "var(--dash-accent)" : "transparent",
                                color: tab === t.key ? "var(--dash-accent)" : "var(--dash-text-dim)",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[400px] overflow-y-auto dashboard-scrollbar space-y-4">
                    {tab === "personal" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="First Name" value={firstName} onChange={setFirstName} />
                                <InputField label="Last Name" value={lastName} onChange={setLastName} />
                            </div>
                            <InputField label="Phone" value={phone} onChange={setPhone} />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Country" value={country} onChange={setCountry} />
                                <InputField label="State" value={state} onChange={setState} />
                            </div>
                        </>
                    )}

                    {tab === "professional" && (
                        <>
                            <InputField label="Job Title" value={jobTitle} onChange={setJobTitle} />
                            <InputField label="Organization" value={organization} onChange={setOrganization} />
                        </>
                    )}

                    {tab === "interests" && (
                        <>
                            {/* Industry */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-text-dim)" }}>Industry</label>
                                <select
                                    value={selectedIndustryId}
                                    onChange={(e) => {
                                        setSelectedIndustryId(Number(e.target.value));
                                        setSelectedSubIndustryId(0);
                                    }}
                                    className="w-full bg-transparent border rounded-lg px-3 py-2.5 text-sm outline-none"
                                    style={{ borderColor: "var(--dash-border)", color: "var(--dash-text)" }}
                                >
                                    <option value={0}>Select Industry</option>
                                    {industries.map((ind) => (
                                        <option key={ind.id} value={ind.id} style={{ background: "#1a1a26" }}>{ind.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedIndustry && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-text-dim)" }}>Sub-Industry</label>
                                    <select
                                        value={selectedSubIndustryId}
                                        onChange={(e) => setSelectedSubIndustryId(Number(e.target.value))}
                                        className="w-full bg-transparent border rounded-lg px-3 py-2.5 text-sm outline-none"
                                        style={{ borderColor: "var(--dash-border)", color: "var(--dash-text)" }}
                                    >
                                        <option value={0}>Select Sub-Industry</option>
                                        {selectedIndustry.sub_industries.map((sub) => (
                                            <option key={sub.id} value={sub.id} style={{ background: "#1a1a26" }}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Communities */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--dash-text-dim)" }}>Communities</label>
                                <div className="space-y-3 max-h-[200px] overflow-y-auto dashboard-scrollbar">
                                    {communities.map((c) => (
                                        <div key={c.id}>
                                            <p className="text-xs font-bold mb-1.5" style={{ color: "var(--dash-text-muted)" }}>{c.name}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {c.sub_communities.map((sc) => {
                                                    const selected = communitySelections.some(
                                                        (s) => s.communityId === c.id && s.subCommunityId === sc.id
                                                    );
                                                    return (
                                                        <button
                                                            key={sc.id}
                                                            onClick={() => toggleCommunity(c.id, sc.id)}
                                                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                                                            style={{
                                                                background: selected ? "var(--dash-accent-dim)" : "transparent",
                                                                borderColor: selected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                color: selected ? "var(--dash-accent)" : "var(--dash-text-dim)",
                                                            }}
                                                        >
                                                            {sc.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--dash-border-subtle)" }}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: "var(--dash-text-muted)" }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all"
                        style={{
                            background: saved ? "var(--dash-teal)" : "var(--dash-accent)",
                            color: "#000",
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
                        {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Input Field ─────────────────
function InputField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-text-dim)" }}>
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-var(--dash-accent) transition-colors"
                style={{ borderColor: "var(--dash-border)", color: "var(--dash-text)" }}
            />
        </div>
    );
}
