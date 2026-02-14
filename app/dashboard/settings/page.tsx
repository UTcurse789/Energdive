"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { Loader2, Check, AlertCircle, Shield, Bell, Briefcase, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/buttons";

// ── Types ─────────────────────────────────────────────────────────────
interface Industry { id: number; name: string; }
interface SubIndustry { id: number; name: string; }
interface Community { id: number; name: string; }

export default function SettingsPage() {
    const { user } = useUser();
    const { profile, refreshProfile } = useDashboard();

    // ── State: Profile ──
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [organization, setOrganization] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // ── State: Interests (Nested Logic) ──
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [subIndustries, setSubIndustries] = useState<SubIndustry[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);

    const [selectedIndustryId, setSelectedIndustryId] = useState<number>(0);
    const [selectedSubIndustryId, setSelectedSubIndustryId] = useState<number>(0);
    const [loadingInterests, setLoadingInterests] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(false);

    // ── Load Data ──
    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || "");
            setLastName(profile.last_name || "");
            setJobTitle(profile.job_title || "");
            setOrganization(profile.organization || "");
        }
    }, [profile]);

    // Fetch Master Data
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [indRes, commRes] = await Promise.all([
                    fetch("/api/master/industries"),
                    fetch("/api/master/communities") // Assuming this endpoint exists
                ]);
                setIndustries(await indRes.json());
                setCommunities(await commRes.json());
            } catch (err) {
                console.error("Master data fetch failed", err);
            } finally {
                setLoadingInterests(false);
            }
        };
        fetchMasterData();
    }, []);

    // Load Sub-Industries when Industry changes
    useEffect(() => {
        if (selectedIndustryId === 0) return;
        setLoadingSubs(true);
        fetch(`/api/master/sub-industries?industryId=${selectedIndustryId}`)
            .then(res => res.json())
            .then(data => {
                setSubIndustries(data);
                setLoadingSubs(false);
            });
    }, [selectedIndustryId]);

    const handleProfileSave = async () => {
        setIsSavingProfile(true);
        setProfileMessage(null);
        try {
            const res = await fetch("/api/user/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName, lastName, jobTitle, organization,
                    industryId: selectedIndustryId || undefined,
                    subIndustryId: selectedSubIndustryId || undefined
                }),
            });
            if (!res.ok) throw new Error();
            await refreshProfile();
            setProfileMessage({ type: 'success', text: "Account settings updated." });
            setTimeout(() => setProfileMessage(null), 3000);
        } catch (err) {
            setProfileMessage({ type: 'error', text: "Failed to save updates." });
        } finally { setIsSavingProfile(false); }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-10">
                <h1 className="text-4xl font-bold font-serif text-zinc-900 tracking-tight mb-2">Settings</h1>
                <p className="text-zinc-500 text-lg">Manage your professional identity and platform preferences.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">

                {/* 1. Profile Information */}
                <section className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-[#0AB996]/10 flex items-center justify-center text-[#0AB996]">
                                <Briefcase size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900">Professional Profile</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <InputGroup label="First Name" value={firstName} onChange={setFirstName} placeholder="e.g. Utkarsh" />
                            <InputGroup label="Last Name" value={lastName} onChange={setLastName} placeholder="e.g. Kumar" />
                            <div className="md:col-span-2">
                                <InputGroup label="Work Email" value={user?.primaryEmailAddress?.emailAddress || ""} disabled />
                            </div>
                            <InputGroup label="Current Role" value={jobTitle} onChange={setJobTitle} placeholder="e.g. IT Head" />
                            <InputGroup label="Company" value={organization} onChange={setOrganization} placeholder="e.g. Gijuhan" />
                        </div>
                    </div>
                    <div className="px-8 py-5 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
                        <p className="text-xs text-zinc-400 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
                        <Button onClick={handleProfileSave} loading={isSavingProfile} variant="primary">
                            Save Changes
                        </Button>
                    </div>
                </section>

                {/* 2. Interests & Industry (ENHANCED) */}
                <section className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[#F3EFE0] flex items-center justify-center text-[#8B7355]">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Intelligence Feed Customization</h2>
                            <p className="text-sm text-zinc-500">Tailor your dashboard content by selecting your primary sector.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Industry Selection */}
                        <div>
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Primary Industry</label>
                            {loadingInterests ? <SkeletonLoader /> : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {industries.map(ind => (
                                        <button
                                            key={ind.id}
                                            onClick={() => setSelectedIndustryId(ind.id)}
                                            className={`p-4 rounded-2xl text-sm font-semibold transition-all border text-left flex justify-between items-center ${selectedIndustryId === ind.id
                                                ? "bg-[#0AB996] text-white border-[#0AB996] shadow-lg shadow-[#0AB996]/20"
                                                : "bg-white text-zinc-600 border-zinc-100 hover:border-[#0AB996]/30 hover:bg-zinc-50"
                                                }`}
                                        >
                                            {ind.name}
                                            {selectedIndustryId === ind.id && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sub-Industry Selection */}
                        {selectedIndustryId > 0 && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 block">Specialization (Sub-Industry)</label>
                                {loadingSubs ? <SkeletonLoader count={2} /> : (
                                    <div className="flex flex-wrap gap-2">
                                        {subIndustries.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setSelectedSubIndustryId(sub.id)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedSubIndustryId === sub.id
                                                    ? "bg-zinc-900 text-white border-zinc-900"
                                                    : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
                                                    }`}
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Privacy & Security */}
                <section className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900">Security</h2>
                    </div>
                    <div className="max-w-md space-y-4">
                        <p className="text-sm text-zinc-500 mb-4">Protect your account with a strong, unique password.</p>
                        <PasswordInput placeholder="New password" />
                        <Button variant="outline" onClick={() => { }} className="w-full">Update Security Credentials</Button>
                    </div>
                </section>

            </div>
        </div>
    );
}

// ── UI Components ──────────────────────────────────────────────────────────

function SkeletonLoader({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 animate-pulse rounded-xl" />
            ))}
        </div>
    );
}

function InputGroup({ label, value, onChange, disabled, placeholder }: any) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-loose ml-1">{label}</label>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-[#0AB996]/10 focus:border-[#0AB996] transition-all outline-none disabled:opacity-50"
            />
        </div>
    );
}

function PasswordInput({ placeholder }: any) {
    return (
        <input
            type="password"
            placeholder={placeholder}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm focus:border-[#0AB996] outline-none transition-all"
        />
    );
}
