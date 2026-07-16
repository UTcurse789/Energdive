"use client";

import { useState, useEffect } from "react";
import { useUser, UserProfile, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { DIGEST_FREQUENCY_OPTIONS, DIGEST_FORMAT_OPTIONS } from "@/lib/digest-preferences";
import {
    Loader2, Check, AlertCircle, Shield, Briefcase, Globe,
    Pencil, ChevronDown, Users, Layers, MapPin, Phone, Mail,
    AlertTriangle, Trash2, X
} from "lucide-react";
import { COUNTRIES } from "@/data/countries";
import { STATES_BY_COUNTRY } from "@/data/states";

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
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';
    const { signOut } = useClerk();

    /* Delete modal state */
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteReasonText, setDeleteReasonText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const DELETE_REASON_MIN_CHARS = 50;

    /* Profile fields */
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [dialCode, setDialCode] = useState("+91");
    const [country, setCountry] = useState("");
    const [state, setState] = useState("");
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
            setCountry(profile.country || "");
            setState(profile.state || "");
            setSelectedIndustryId(profile.industry_id || 0);
            setSelectedSubIndustryId(profile.sub_industry_id || 0);
            setPreferredFrequency(profile.preferred_frequency || "daily");
            setPreferredFormats(profile.preferred_formats || []);
            setDigestEnabled(!profile.content_digest_opted_out);

            // Parse phone: separate dial code from number
            const rawPhone = profile.phone || "";
            if (rawPhone) {
                const matchedCountry = COUNTRIES.find((c) => rawPhone.startsWith(c.dial_code));
                if (matchedCountry) {
                    setDialCode(matchedCountry.dial_code);
                    setPhone(rawPhone.slice(matchedCountry.dial_code.length));
                } else {
                    setPhone(rawPhone);
                }
            }

            // Set dial code from country
            if (profile.country) {
                const matchedCountry = COUNTRIES.find((c) => c.name === profile.country);
                if (matchedCountry) setDialCode(matchedCountry.dial_code);
            }
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

    /* ── Handle Tab Hash Routing ─────────────────────────────────── */
    useEffect(() => {
        if (activeTab === 'security') {
            window.location.hash = '/security';
        } else if (activeTab === 'profile') {
            window.location.hash = '/';
        }
    }, [activeTab]);

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
                    phone: phone.trim() ? `${dialCode}${phone.trim().replace(/^0+/, '')}` : undefined,
                    country: country || undefined,
                    state: state || undefined,
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

    const isDeleteReady =
        deleteConfirmText === "DELETE" &&
        deleteReasonText.trim().length >= DELETE_REASON_MIN_CHARS;

    const handleDeleteAccount = async () => {
        if (!isDeleteReady) return;
        setDeleting(true);
        setDeleteError("");

        try {
            const res = await fetch("/api/user/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    confirmation: "DELETE",
                    reason: deleteReasonText.trim(),
                }),
            });
            const data = await res.json();

            if (data.success) {
                await signOut({ redirectUrl: "/" });
            } else {
                setDeleteError(data.error || "Failed to delete account.");
            }
        } catch (err) {
            console.error("Failed to delete account:", err);
            setDeleteError("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
        setDeleteConfirmText("");
        setDeleteError("");
        setDeleteReasonText("");
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
                {activeTab === 'profile' && (
                <section id="profile" className="rounded-xl overflow-hidden animate-fade-in-up" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                                <Briefcase size={18} style={{ color: "var(--dash-accent)" }} />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Professional Profile</h2>
                        </div>

                        <div className="clerk-profile-top">
                            <UserProfile 
                                routing="hash"
                                appearance={{ 
                                    variables: {
                                        colorPrimary: "#C9A84C",
                                        colorBackground: "#16161B",
                                        colorInputBackground: "#1A1A1F",
                                        colorInputText: "#F0EDE8",
                                        colorText: "#F0EDE8",
                                        colorTextSecondary: "#A8A29E",
                                        colorTextOnPrimaryBackground: "#0A0A0B",
                                        colorDanger: "#EF4444",
                                        colorSuccess: "#4CAF50",
                                        colorWarning: "#FFC107",
                                        borderRadius: "0.75rem",
                                    },
                                    elements: { 
                                        navbar: "!hidden", 
                                        navbarMobileMenuRow: "!hidden",
                                        navbarMobileMenuButton: "!hidden",
                                        header: "!hidden",
                                        headerTitle: "!hidden",
                                        headerSubtitle: "!hidden",
                                        pageScrollBox: "p-0", 
                                        rootBox: "w-full shadow-none",
                                        cardBox: "shadow-none w-full max-w-full p-0 bg-transparent rounded-none border-none",
                                        card: "bg-transparent shadow-none border-none",
                                        page: "gap-0",
                                        profilePage: "gap-0",
                                        profileSection: "border-[#2A2A32] bg-transparent p-0",
                                        profileSectionContent: "bg-transparent",
                                        profileSectionTitle: "border-[#2A2A32]",
                                        profileSectionTitleText: "text-[#A8A29E] uppercase text-[10px] font-bold tracking-wider",
                                        profileSectionPrimaryButton: "text-[#C9A84C] hover:text-[#D4B568]",
                                        formButtonPrimary: "bg-[#C9A84C] hover:bg-[#D4B568] text-[#0A0A0B] font-bold shadow-none",
                                        formButtonReset: "text-[#A8A29E] hover:text-[#F0EDE8]",
                                        formFieldLabel: "text-[#A8A29E]",
                                        formFieldInput: "bg-[#1A1A1F] border-[#2A2A32] text-[#F0EDE8] focus:border-[#C9A84C] focus:ring-[#C9A84C]/20",
                                        formFieldInputShowPasswordButton: "text-[#6B6660] hover:text-[#A8A29E]",
                                        formFieldAction: "text-[#C9A84C] hover:text-[#D4B568]",
                                        avatarBox: "border-2 border-[#2A2A32]",
                                        avatarImageActionsUpload: "text-[#C9A84C]",
                                        badge: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/30",
                                        tagInputContainer: "bg-[#1A1A1F] border-[#2A2A32]",
                                        accordionTriggerButton: "text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        accordionContent: "bg-transparent",
                                        menuButton: "text-[#A8A29E] hover:text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        menuList: "bg-[#16161B] border-[#2A2A32]",
                                        menuItem: "text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        footer: "!hidden",
                                    } 
                                }} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-[var(--dash-border-subtle)]">
                            <DarkInput label="First Name" value={firstName} onChange={setFirstName} placeholder="e.g. Sankalp" />
                            <DarkInput label="Last Name" value={lastName} onChange={setLastName} placeholder="e.g. Gupta" />
                            <div className="md:col-span-2">
                                <DarkInput label="Work Email" value={user?.primaryEmailAddress?.emailAddress || ""} disabled />
                            </div>
                            <DarkInput label="Current Role" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Energy Analyst" />
                            <DarkInput label="Company" value={organization} onChange={setOrganization} placeholder="e.g. ONGC" />

                            {/* Phone with dial code */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-text-muted)" }}>Phone Number</label>
                                <div className="flex">
                                    <select
                                        value={dialCode}
                                        onChange={(e) => setDialCode(e.target.value)}
                                        className="h-11 w-[90px] shrink-0 rounded-l-lg px-2 text-sm font-medium outline-none transition-all"
                                        style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border)", borderRight: "none", color: "var(--dash-text)" }}
                                    >
                                        {COUNTRIES.map((c) => (
                                            <option key={c.code} value={c.dial_code}>{c.dial_code}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="9876543210"
                                        className="w-full h-11 rounded-r-lg px-4 text-sm outline-none transition-all"
                                        style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border)", color: "var(--dash-text)" }}
                                    />
                                </div>
                            </div>

                            {/* Country & State */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-text-muted)" }}>Country</label>
                                <select
                                    value={country}
                                    onChange={(e) => {
                                        setCountry(e.target.value);
                                        setState("");
                                        const matched = COUNTRIES.find((c) => c.name === e.target.value);
                                        if (matched) setDialCode(matched.dial_code);
                                    }}
                                    className="w-full h-11 rounded-lg px-4 text-sm outline-none transition-all"
                                    style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border)", color: "var(--dash-text)" }}
                                >
                                    <option value="">Select country</option>
                                    {COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-text-muted)" }}>State / Region</label>
                                <select
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full h-11 rounded-lg px-4 text-sm outline-none transition-all"
                                    style={{ background: "var(--dash-surface-2)", border: "1px solid var(--dash-border)", color: "var(--dash-text)" }}
                                >
                                    <option value="">Select state</option>
                                    {(STATES_BY_COUNTRY[country] || []).map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Membership ID — read-only, full width */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--dash-accent)" }}>
                                    EnergClub Membership ID
                                </label>
                                <div
                                    className="w-full rounded-lg px-4 py-2.5 text-sm flex items-center justify-between gap-3"
                                    style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", color: "var(--dash-text)" }}
                                >
                                    <span className="font-mono font-bold tracking-wide" style={{ color: profile?.membership_id ? "var(--dash-accent)" : "var(--dash-text-dim)" }}>
                                        {profile?.membership_id ?? "Pending verification…"}
                                    </span>
                                    {profile?.membership_id && (
                                        <button
                                            type="button"
                                            onClick={() => { navigator.clipboard.writeText(profile.membership_id ?? ""); setMsg({ type: "success", text: "Membership ID copied!" }); setTimeout(() => setMsg(null), 2000); }}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 transition-all"
                                            style={{ background: "rgba(201,168,76,0.12)", color: "var(--dash-accent)", border: "1px solid rgba(201,168,76,0.2)" }}
                                        >
                                            Copy
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Connected Accounts Only Section */}
                        <div className="pt-6 mt-4 border-t border-[var(--dash-border-subtle)] clerk-connected-bottom">
                            <UserProfile 
                                routing="hash"
                                appearance={{ 
                                    variables: {
                                        colorPrimary: "#C9A84C",
                                        colorBackground: "#16161B",
                                        colorInputBackground: "#1A1A1F",
                                        colorInputText: "#F0EDE8",
                                        colorText: "#F0EDE8",
                                        colorTextSecondary: "#A8A29E",
                                        colorTextOnPrimaryBackground: "#0A0A0B",
                                        colorDanger: "#EF4444",
                                        colorSuccess: "#4CAF50",
                                        colorWarning: "#FFC107",
                                        borderRadius: "0.75rem",
                                    },
                                    elements: { 
                                        navbar: "!hidden", 
                                        navbarMobileMenuRow: "!hidden",
                                        navbarMobileMenuButton: "!hidden",
                                        header: "!hidden",
                                        headerTitle: "!hidden",
                                        headerSubtitle: "!hidden",
                                        pageScrollBox: "p-0", 
                                        rootBox: "w-full shadow-none",
                                        cardBox: "shadow-none w-full max-w-full p-0 bg-transparent rounded-none border-none",
                                        card: "bg-transparent shadow-none border-none",
                                        page: "gap-4",
                                        profilePage: "gap-4",
                                        profileSection: "border-[#2A2A32] bg-transparent",
                                        profileSectionContent: "bg-transparent",
                                        profileSectionTitle: "border-[#2A2A32]",
                                        profileSectionTitleText: "text-[#A8A29E] uppercase text-[10px] font-bold tracking-wider",
                                        profileSectionPrimaryButton: "text-[#C9A84C] hover:text-[#D4B568]",
                                        formButtonPrimary: "bg-[#C9A84C] hover:bg-[#D4B568] text-[#0A0A0B] font-bold shadow-none",
                                        formButtonReset: "text-[#A8A29E] hover:text-[#F0EDE8]",
                                        formFieldLabel: "text-[#A8A29E]",
                                        formFieldInput: "bg-[#1A1A1F] border-[#2A2A32] text-[#F0EDE8] focus:border-[#C9A84C] focus:ring-[#C9A84C]/20",
                                        formFieldInputShowPasswordButton: "text-[#6B6660] hover:text-[#A8A29E]",
                                        formFieldAction: "text-[#C9A84C] hover:text-[#D4B568]",
                                        avatarBox: "border-2 border-[#2A2A32]",
                                        avatarImageActionsUpload: "text-[#C9A84C]",
                                        badge: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/30",
                                        tagInputContainer: "bg-[#1A1A1F] border-[#2A2A32]",
                                        accordionTriggerButton: "text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        accordionContent: "bg-transparent",
                                        menuButton: "text-[#A8A29E] hover:text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        menuList: "bg-[#16161B] border-[#2A2A32]",
                                        menuItem: "text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        footer: "!hidden",
                                    } 
                                }} 
                            />
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
                )}

                {/* ───────── 2. Selected Communities ────────────────── */}
                {activeTab === 'communities' && (
                    <>
                <section id="communities" className="rounded-xl overflow-hidden animate-fade-in-up" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                                    <Users size={18} style={{ color: "var(--dash-accent)" }} />
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
                                            <Check size={14} style={{ color: "var(--dash-accent)" }} />
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
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                                    <Layers size={18} style={{ color: "var(--dash-accent)" }} />
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
                </>
                )}


                {/* ───────── 4. EnergClub Membership ────────────────── */}
                {activeTab === 'membership' && (
                <section id="membership" className="rounded-xl overflow-hidden animate-fade-in-up" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                                <Globe size={18} style={{ color: "var(--dash-accent)" }} />
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
                                    style={{ background: "linear-gradient(135deg, #1E1E24 0%, #15151A 100%)", border: "1px solid rgba(201,168,76,0.25)" }}
                                >
                                    {/* subtle glow */}
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(201,168,76,0.08), transparent 70%)" }} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--dash-accent)" }}>
                                        Membership ID
                                    </p>
                                    <p className="text-3xl font-mono font-black tracking-wider mb-3" style={{ color: "#ffffff" }}>
                                        {profile.membership_id}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(201,168,76,0.12)", color: "var(--dash-accent)", border: "1px solid rgba(201,168,76,0.2)" }}>
                                                <Check size={10} /> Verified Member
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(profile.membership_id ?? ""); setMsg({ type: "success", text: "Membership ID copied!" }); setTimeout(() => setMsg(null), 2000); }}
                                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                                            style={{ background: "rgba(201,168,76,0.15)", color: "var(--dash-accent)", border: "1px solid rgba(201,168,76,0.25)" }}
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
                )}

                {/* ───────── 5. Email Briefings ────────────────────────────── */}
                {activeTab === 'briefings' && (
                <section id="briefings" className="rounded-xl overflow-hidden animate-fade-in-up" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                                <Mail size={18} style={{ color: "var(--dash-accent)" }} />
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
                                        ? { background: "rgba(201,168,76,0.15)", color: "var(--dash-accent)", border: "1px solid rgba(201,168,76,0.3)" }
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
                                                ? { background: "rgba(201,168,76,0.12)", border: "1px solid var(--dash-accent)", color: "var(--dash-accent)" }
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
                                                    ? { background: "rgba(201,168,76,0.12)", color: "var(--dash-accent)", border: "1px solid rgba(201,168,76,0.35)" }
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
                )}

                {/* ───────── 6. Security ────────────────────────────── */}
                {activeTab === 'security' && (
                <section id="security" className="rounded-xl overflow-hidden animate-fade-in-up" style={cardStyle}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                                <Shield size={18} style={{ color: "var(--dash-accent)" }} />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>Security</h2>
                        </div>
                        <div className="-mt-4">
                            <UserProfile 
                                routing="hash"
                                appearance={{ 
                                    variables: {
                                        colorPrimary: "#C9A84C",
                                        colorBackground: "#16161B",
                                        colorInputBackground: "#1A1A1F",
                                        colorInputText: "#F0EDE8",
                                        colorText: "#F0EDE8",
                                        colorTextSecondary: "#A8A29E",
                                        colorTextOnPrimaryBackground: "#0A0A0B",
                                        colorDanger: "#EF4444",
                                        colorSuccess: "#4CAF50",
                                        colorWarning: "#FFC107",
                                        borderRadius: "0.75rem",
                                    },
                                    elements: { 
                                        navbar: "!hidden", 
                                        navbarMobileMenuRow: "!hidden",
                                        navbarMobileMenuButton: "!hidden",
                                        header: "!hidden",
                                        headerTitle: "!hidden",
                                        headerSubtitle: "!hidden",
                                        pageScrollBox: "p-0", 
                                        rootBox: "w-full shadow-none",
                                        cardBox: "shadow-none w-full max-w-full p-0 bg-transparent rounded-none border-none",
                                        card: "bg-transparent shadow-none border-none",
                                        page: "gap-4",
                                        profilePage: "gap-4",
                                        profileSection: "border-[#2A2A32] bg-transparent",
                                        profileSectionContent: "bg-transparent",
                                        profileSectionTitle: "border-[#2A2A32]",
                                        profileSectionTitleText: "text-[#A8A29E] uppercase text-[10px] font-bold tracking-wider",
                                        profileSectionPrimaryButton: "text-[#C9A84C] hover:text-[#D4B568]",
                                        formButtonPrimary: "bg-[#C9A84C] hover:bg-[#D4B568] text-[#0A0A0B] font-bold shadow-none",
                                        formButtonReset: "text-[#A8A29E] hover:text-[#F0EDE8]",
                                        formFieldLabel: "text-[#A8A29E]",
                                        formFieldInput: "bg-[#1A1A1F] border-[#2A2A32] text-[#F0EDE8] focus:border-[#C9A84C] focus:ring-[#C9A84C]/20",
                                        formFieldInputShowPasswordButton: "text-[#6B6660] hover:text-[#A8A29E]",
                                        formFieldAction: "text-[#C9A84C] hover:text-[#D4B568]",
                                        avatarBox: "border-2 border-[#2A2A32]",
                                        avatarImageActionsUpload: "text-[#C9A84C]",
                                        badge: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/30",
                                        tagInputContainer: "bg-[#1A1A1F] border-[#2A2A32]",
                                        accordionTriggerButton: "text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        accordionContent: "bg-transparent",
                                        menuButton: "text-[#A8A29E] hover:text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        menuList: "bg-[#16161B] border-[#2A2A32]",
                                        menuItem: "text-[#F0EDE8] hover:bg-[#1A1A1F]",
                                        footer: "!hidden",
                                    } 
                                }} 
                            />
                        </div>

                        {/* Custom Danger Zone card */}
                        <div className="pt-5 border-t border-[var(--dash-border-subtle)] mt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Danger Zone</h3>
                            <div className="flex items-center justify-between py-4 px-5 bg-red-500/5 rounded-lg border border-red-500/20">
                                <div>
                                    <p className="text-sm font-semibold text-red-400">Delete Account</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all data</p>
                                </div>
                                <button
                                    onClick={openDeleteModal}
                                    className="text-xs font-bold text-red-500 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                )}
            </div>

            {/* ── Delete Account Confirmation Modal ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-[#16161B] border border-[#2A2A32] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A32]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-[#F0EDE8]">Delete Account</h3>
                            </div>
                            {!deleting && (
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-sm text-red-400 font-medium">
                                    This action is <strong>permanent and irreversible</strong>. All your data, membership, communities, and preferences will be permanently deleted.
                                </p>
                            </div>

                            {/* Reason Text Box */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Why are you deleting your account? <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={deleteReasonText}
                                    onChange={(e) => setDeleteReasonText(e.target.value)}
                                    placeholder="Please tell us why you're leaving — your feedback helps us improve…"
                                    disabled={deleting}
                                    rows={4}
                                    className={`w-full px-4 py-3 bg-[#1A1A1F] border rounded-lg text-sm text-[#F0EDE8] placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 resize-none ${
                                        deleteReasonText.trim().length > 0 && deleteReasonText.trim().length < DELETE_REASON_MIN_CHARS
                                            ? "border-red-500/50 focus:ring-red-500/10 focus:border-red-500"
                                            : deleteReasonText.trim().length >= DELETE_REASON_MIN_CHARS
                                                ? "border-green-500/50 focus:ring-green-500/10 focus:border-green-500"
                                                : "border-[#2A2A32] focus:ring-red-500/10 focus:border-red-500/50"
                                    }`}
                                />
                                <div className="flex items-center justify-between mt-1.5">
                                    <p className="text-xs text-gray-400">
                                        Minimum {DELETE_REASON_MIN_CHARS} characters required
                                    </p>
                                    <p className={`text-xs font-medium tabular-nums ${
                                        deleteReasonText.trim().length >= DELETE_REASON_MIN_CHARS
                                            ? "text-green-500"
                                            : deleteReasonText.trim().length > 0
                                                ? "text-red-500"
                                                : "text-gray-400"
                                    }`}>
                                        {deleteReasonText.trim().length}/{DELETE_REASON_MIN_CHARS}
                                    </p>
                                </div>
                            </div>

                            {/* Confirmation Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Type <span className="font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Type DELETE here"
                                    disabled={deleting}
                                    className="w-full px-4 py-3 bg-[#1A1A1F] border border-[#2A2A32] rounded-lg text-sm text-[#F0EDE8] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all disabled:opacity-50"
                                    autoFocus
                                />
                            </div>

                            {deleteError && (
                                <p className="text-sm text-red-500 font-medium">{deleteError}</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-[#2A2A32] flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={!isDeleteReady || deleting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete My Account
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
