"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Mail, ChevronDown, Check, Loader2, Minus, Plus } from "lucide-react";

type TsParticlesConfetti = (
    idOrOptions: string | Record<string, unknown>,
    options?: Record<string, unknown>
) => void;

declare global {
    interface Window {
        confetti?: TsParticlesConfetti;
        __energdiveConfettiPromise?: Promise<TsParticlesConfetti | null>;
    }
}

async function loadConfetti(): Promise<TsParticlesConfetti | null> {
    if (typeof window === "undefined") return null;
    if (window.confetti) return window.confetti;
    if (window.__energdiveConfettiPromise) return window.__energdiveConfettiPromise;

    window.__energdiveConfettiPromise = new Promise((resolve) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[data-energdive-confetti="true"]'
        );
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(window.confetti || null), { once: true });
            existingScript.addEventListener("error", () => resolve(null), { once: true });
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@tsparticles/confetti@4.2.1/tsparticles.confetti.bundle.min.js";
        script.async = true;
        script.dataset.energdiveConfetti = "true";
        script.onload = () => resolve(window.confetti || null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });
    return window.__energdiveConfettiPromise;
}

async function fireRealisticConfetti() {
    const confetti = await loadConfetti();
    if (!confetti) return;
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    const fire = (particleRatio: number, opts: Record<string, unknown>) => {
        confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
}

/* ─── Sector / Sub-sector data ────────────────────────── */
const SECTORS: { name: string; subs: string[] }[] = [
    {
        name: "Oil & Gas",
        subs: ["Upstream", "Pipelines", "Refining", "Petrochemicals", "CGD", "LPG", "Retail", "Oil Markets"],
    },
    { name: "Power Generation", subs: ["Thermal", "Nuclear"] },
    {
        name: "Renewables",
        subs: ["Solar", "Wind", "Hydro", "Biopower", "Cogeneration", "Waste-to-Energy"],
    },
    { name: "Transmission", subs: ["Smart Grid"] },
    {
        name: "Distribution",
        subs: ["Smart Meters & AMI", "EV Charging", "Data Centres", "Smart Cities", "Railways & Metros"],
    },
    { name: "Electricity Markets", subs: ["Power Markets", "Carbon Markets", "RCO"] },
    { name: "New Energies", subs: ["Green Hydrogen", "E-Fuels"] },
    {
        name: "Energy Storage",
        subs: ["BESS", "Pumped Hydro", "CAES", "Thermal", "Flywheel"],
    },
    {
        name: "Sustainability & Safety",
        subs: ["Energy Efficiency", "Occupational Health", "Industrial & Process Safety", "Environment"],
    },
];

const FREQUENCIES = [
    { label: "Daily", unit: "per day", max: 5 },
    { label: "Weekly", unit: "per week", max: 7 },
    { label: "Monthly", unit: "per month", max: 4 },
];

const PREFERENCES = [
    "Insights",
    "Opinion",
    "News Briefing",
    "Upcoming Events",
    "Case Study & Technical Papers",
];

/* ─── Animation Variants ───────────────────────────────── */
const backdropVar: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVar: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 25, stiffness: 400 } },
    exit: { opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.15 } },
};

/* ─── Types ───────────────────────────────────────────── */
interface SubscribeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

/* ═══════════════════════════════════════════════════════ */
export function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
    const [email, setEmail] = useState("");
    const [frequency, setFrequency] = useState("");
    const [frequencyCounts, setFrequencyCounts] = useState<Record<string, number>>({ Daily: 0, Weekly: 0, Monthly: 0 });
    const [preferences, setPreferences] = useState<string[]>([]);
    const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
    const [sectorDropOpen, setSectorDropOpen] = useState(false);
    const [expandedSector, setExpandedSector] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const modalRef = useRef<HTMLDivElement>(null);
    const sectorRef = useRef<HTMLDivElement>(null);

    /* ── Utilities ────────────────────────── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) {
            document.addEventListener("keydown", handler);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sectorRef.current && !sectorRef.current.contains(e.target as Node)) {
                setSectorDropOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const togglePreference = useCallback((p: string) => {
        setPreferences((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
    }, []);

    const toggleSector = useCallback((sector: string) => {
        setSelectedSectors((prev) => {
            const isRemoving = prev.includes(sector);
            if (isRemoving) {
                const subsToRemove = SECTORS.find((s) => s.name === sector)?.subs || [];
                setSelectedSubs((sp) => sp.filter((s) => !subsToRemove.includes(s)));
            }
            return isRemoving ? prev.filter((x) => x !== sector) : [...prev, sector];
        });
    }, []);

    const toggleSub = useCallback((sub: string, sectorName: string) => {
        setSelectedSubs((prev) => {
            const next = prev.includes(sub) ? prev.filter((x) => x !== sub) : [...prev, sub];
            if (!prev.includes(sub)) {
                setSelectedSectors((sp) => (sp.includes(sectorName) ? sp : [...sp, sectorName]));
            }
            return next;
        });
    }, []);

    const totalSelected = selectedSectors.length + selectedSubs.length;

    /* ── Reset ── */
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setEmail(""); setFrequency("");
                setFrequencyCounts({ Daily: 0, Weekly: 0, Monthly: 0 });
                setPreferences([]); setSelectedSectors([]); setSelectedSubs([]);
                setStatus("idle"); setErrorMsg(""); setSectorDropOpen(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    /* ── Submit ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!email) return setErrorMsg("Email is required.");
        if (!frequency) return setErrorMsg("Please select a frequency.");
        if (frequencyCounts[frequency] < 1) return setErrorMsg("Please set a quantity.");
        if (preferences.length === 0) return setErrorMsg("Select at least one preference.");

        setStatus("loading");
        const frequencyValue = `${frequency} x${frequencyCounts[frequency]}`;
        const currentUrl = typeof window !== "undefined" ? window.location.href : undefined;
        const currentTitle = typeof document !== "undefined" ? document.title : undefined;

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    frequency: frequencyValue,
                    preferences,
                    communities: selectedSectors,
                    subCommunities: selectedSubs,
                    source: "Subscribe Modal",
                    subscribedFromUrl: currentUrl,
                    subscribedFromTitle: currentTitle,
                    subscribedFromPage: currentTitle,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setStatus("error");
                setErrorMsg(data.error || "Something went wrong.");
                return;
            }
            setStatus("success");
            void fireRealisticConfetti();
        } catch {
            setStatus("error"); setErrorMsg("Network error.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-[9999] overflow-y-auto" variants={backdropVar} initial="hidden" animate="visible" exit="exit">
                    <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm" onClick={onClose} />
                    <div className="relative z-[9999] flex min-h-full items-center justify-center p-4">
                        <motion.div ref={modalRef} variants={panelVar} initial="hidden" animate="visible" exit="exit"
                            className="relative w-full max-w-lg bg-white shadow-2xl rounded-sm border-t-[3px] border-[#00A651]">

                            <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors">
                                <X size={18} />
                            </button>

                            {status === "success" ? (
                                <div className="p-10 text-center py-16">
                                    <div className="w-12 h-12 rounded-full border border-[#00A651] flex items-center justify-center mx-auto mb-4 text-[#00A651]">
                                        <Check size={24} />
                                    </div>
                                    <h3 className="text-2xl font-serif text-zinc-900 mb-2">Subscription Confirmed</h3>
                                    <p className="text-zinc-500 text-sm mb-6">Check your inbox for the latest intelligence.</p>
                                    <button onClick={onClose} className="px-8 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest rounded-sm">Done</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
                                    <div className="mb-5">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00A651] mb-1 block">Briefing</span>
                                        <h3 className="text-xl font-serif text-zinc-900 tracking-tight leading-tight">Stay Ahead of the Curve</h3>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">Energy insights delivered to your professional inbox.</p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300" />
                                            <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-6 pr-3 py-1.5 border-b border-zinc-200 text-sm focus:outline-none focus:border-[#00A651] transition-colors bg-transparent rounded-none" />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Frequency</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {FREQUENCIES.map((f) => {
                                                const isActive = frequency === f.label;
                                                const count = frequencyCounts[f.label] || 0;
                                                return (
                                                    <div key={f.label} onClick={() => setFrequency(f.label)}
                                                        className={`p-2 border rounded-sm cursor-pointer transition-all ${isActive ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-300"}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-[11px] font-bold ${isActive ? "text-zinc-900" : "text-zinc-500"}`}>{f.label}</span>
                                                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isActive ? "border-zinc-900" : "border-zinc-200"}`}>
                                                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5" onClick={(e) => e.stopPropagation()}>
                                                            <button type="button" onClick={() => setFrequencyCounts(p => ({ ...p, [f.label]: Math.max(0, p[f.label] - 1) }))} className="text-zinc-300 hover:text-zinc-900"><Minus size={10} /></button>
                                                            <span className="text-[10px] font-bold tabular-nums">{count}</span>
                                                            <button type="button" onClick={() => setFrequencyCounts(p => ({ ...p, [f.label]: Math.min(f.max, p[f.label] + 1) }))} className="text-zinc-300 hover:text-[#00A651]"><Plus size={10} /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Formats</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {PREFERENCES.map((p) => (
                                                <button key={p} type="button" onClick={() => togglePreference(p)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-colors ${preferences.includes(p) ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mb-5" ref={sectorRef}>
                                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5 tracking-wider">Industry Focus</label>
                                        <button type="button" onClick={() => setSectorDropOpen(!sectorDropOpen)}
                                            className={`w-full flex items-center justify-between px-3 py-2 border rounded-sm text-xs transition-colors ${sectorDropOpen ? "border-zinc-900 bg-white" : "border-zinc-100 bg-zinc-50/50"}`}>
                                            <span className={totalSelected > 0 ? "text-zinc-900 font-medium" : "text-zinc-400"}>{totalSelected > 0 ? `${totalSelected} selected` : "Select sectors..."}</span>
                                            <ChevronDown size={14} className={`text-zinc-400 transition-transform ${sectorDropOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        <AnimatePresence>
                                            {sectorDropOpen && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                    className="mt-1 border border-zinc-200 rounded-sm max-h-40 overflow-y-auto bg-white divide-y divide-zinc-50 shadow-sm">
                                                    {SECTORS.map((sector) => (
                                                        <div key={sector.name} className="px-3 py-2 hover:bg-zinc-50">
                                                            <div className="flex items-center justify-between">
                                                                <button type="button" onClick={() => toggleSector(sector.name)} className="flex items-center text-[11px] font-bold text-zinc-800">
                                                                    <div className={`w-3 h-3 border rounded-sm mr-2 flex items-center justify-center ${selectedSectors.includes(sector.name) ? "bg-[#00A651] border-[#00A651]" : "border-zinc-300"}`}>
                                                                        {selectedSectors.includes(sector.name) && <Check size={8} className="text-white" />}
                                                                    </div>
                                                                    {sector.name}
                                                                </button>
                                                                <button type="button" onClick={() => setExpandedSector(expandedSector === sector.name ? null : sector.name)}>
                                                                    <ChevronDown size={12} className={`text-zinc-300 transition-transform ${expandedSector === sector.name ? "rotate-180" : ""}`} />
                                                                </button>
                                                            </div>
                                                            {expandedSector === sector.name && (
                                                                <div className="mt-2 pl-5 space-y-1.5 pb-1">
                                                                    {sector.subs.map(sub => (
                                                                        <button key={sub} type="button" onClick={() => toggleSub(sub, sector.name)} className="flex items-center text-[10px] text-zinc-500 w-full text-left">
                                                                            <div className={`w-2.5 h-2.5 border rounded-sm mr-2 flex items-center justify-center ${selectedSubs.includes(sub) ? "bg-[#00A651] border-[#00A651]" : "border-zinc-200"}`}>
                                                                                {selectedSubs.includes(sub) && <Check size={6} className="text-white" />}
                                                                            </div>
                                                                            {sub}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {errorMsg && <p className="text-[10px] text-red-500 font-bold mb-3 uppercase tracking-tighter">! {errorMsg}</p>}

                                    <button type="submit" disabled={status === "loading"}
                                        className="w-full bg-[#00A651] text-white py-3 rounded-sm font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-[#008c44] transition-colors flex items-center justify-center gap-2">
                                        {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : "Subscribe"}
                                    </button>
                                    <p className="text-center text-[9px] text-zinc-400 mt-3">You can unsubscribe at any time.</p>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}