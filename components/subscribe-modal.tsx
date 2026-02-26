"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ChevronDown, Check, Loader2, Sparkles, Zap } from "lucide-react";

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

const FREQUENCIES = ["Daily", "Weekly", "Monthly"];

const PREFERENCES = [
    "News",
    "Newsletter",
    "Opinion",
    "Interview",
    "White Paper",
    "Technical Paper",
];

/* ─── Backdrop variants ───────────────────────────────── */
const backdropVar = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const panelVar = {
    hidden: { opacity: 0, y: 40, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, damping: 28, stiffness: 300 } },
    exit: { opacity: 0, y: 30, scale: 0.97, transition: { duration: 0.2 } },
};

/* ─── Types ───────────────────────────────────────────── */
interface SubscribeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

/* ═══════════════════════════════════════════════════════ */
export function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
    /* ── State ──────────────────────────────────── */
    const [email, setEmail] = useState("");
    const [frequency, setFrequency] = useState("");
    const [preferences, setPreferences] = useState<string[]>([]);
    const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
    const [sectorDropOpen, setSectorDropOpen] = useState(false);
    const [expandedSector, setExpandedSector] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const modalRef = useRef<HTMLDivElement>(null);
    const sectorRef = useRef<HTMLDivElement>(null);

    /* ── Close on Escape ────────────────────────── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handler);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    /* ── Close sector dropdown on outside click ── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (sectorRef.current && !sectorRef.current.contains(e.target as Node)) {
                setSectorDropOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ── Helpers ────────────────────────────────── */
    const togglePreference = useCallback((p: string) => {
        setPreferences((prev) =>
            prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
        );
    }, []);

    const toggleSector = useCallback((sector: string) => {
        setSelectedSectors((prev) => {
            const isRemoving = prev.includes(sector);
            if (isRemoving) {
                // also remove all subs of this sector
                const subsToRemove = SECTORS.find((s) => s.name === sector)?.subs || [];
                setSelectedSubs((sp) => sp.filter((s) => !subsToRemove.includes(s)));
            }
            return isRemoving ? prev.filter((x) => x !== sector) : [...prev, sector];
        });
    }, []);

    const toggleSub = useCallback((sub: string, sectorName: string) => {
        setSelectedSubs((prev) => {
            const next = prev.includes(sub) ? prev.filter((x) => x !== sub) : [...prev, sub];
            // Auto-select parent sector if a sub is selected
            if (!prev.includes(sub)) {
                setSelectedSectors((sp) => (sp.includes(sectorName) ? sp : [...sp, sectorName]));
            }
            return next;
        });
    }, []);

    const totalSelected = selectedSectors.length + selectedSubs.length;

    /* ── Reset on close ────────────────────────── */
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setEmail("");
                setFrequency("");
                setPreferences([]);
                setSelectedSectors([]);
                setSelectedSubs([]);
                setStatus("idle");
                setErrorMsg("");
                setSectorDropOpen(false);
                setExpandedSector(null);
            }, 300);
        }
    }, [isOpen]);

    /* ── Submit ─────────────────────────────────── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!email) return setErrorMsg("Email is required.");
        if (!frequency) return setErrorMsg("Please select a frequency.");
        if (preferences.length === 0) return setErrorMsg("Select at least one preference.");

        setStatus("loading");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    frequency,
                    preferences,
                    communities: selectedSectors,
                    subCommunities: selectedSubs,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus("error");
                setErrorMsg(data.error || "Something went wrong.");
                return;
            }

            setStatus("success");
        } catch {
            setStatus("error");
            setErrorMsg("Network error. Please try again.");
        }
    };

    /* ═══════════════════════════════════════════════ */
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    variants={backdropVar}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        ref={modalRef}
                        variants={panelVar}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Subscribe to Energdive"
                        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
                    >
                        {/* Green accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-[#00A651] via-emerald-400 to-teal-400" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 transition-colors z-10"
                            aria-label="Close"
                        >
                            <X size={18} className="text-zinc-400" />
                        </button>

                        {/* ── Success State ─────────────────── */}
                        {status === "success" ? (
                            <div className="p-10 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12 }}
                                    className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#00A651]/10 flex items-center justify-center"
                                >
                                    <Sparkles className="w-8 h-8 text-[#00A651]" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                                    You&apos;re subscribed! 🚀
                                </h3>
                                <p className="text-zinc-500 text-sm mb-8">
                                    Welcome to the Energdive community. Check your inbox for a confirmation email.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            /* ── Form State ──────────────────── */
                            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#00A651]/10 flex items-center justify-center">
                                            <Zap size={16} className="text-[#00A651]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A651]">
                                            Free Subscription
                                        </span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                                        Stay Ahead of the Curve
                                    </h3>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        Get exclusive energy insights delivered to your inbox.
                                    </p>
                                </div>

                                {/* Email */}
                                <div className="mb-4">
                                    <label htmlFor="subscribe-email" className="block text-xs font-bold text-zinc-700 mb-1.5">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            id="subscribe-email"
                                            type="email"
                                            required
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Frequency */}
                                <div className="mb-4">
                                    <label htmlFor="subscribe-frequency" className="block text-xs font-bold text-zinc-700 mb-1.5">
                                        Frequency <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="subscribe-frequency"
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className="w-full appearance-none px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] transition-all"
                                        >
                                            <option value="">Select frequency...</option>
                                            {FREQUENCIES.map((f) => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Preferences */}
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-zinc-700 mb-2">
                                        Content Preferences <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PREFERENCES.map((p) => {
                                            const isActive = preferences.includes(p);
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => togglePreference(p)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${isActive
                                                        ? "bg-[#00A651]/10 border-[#00A651]/30 text-[#00A651]"
                                                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100"
                                                        }`}
                                                >
                                                    {isActive && <Check size={12} />}
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Communities / Sub-communities */}
                                <div className="mb-6" ref={sectorRef}>
                                    <label className="block text-xs font-bold text-zinc-700 mb-2">
                                        Communities & Sub-Communities
                                        <span className="text-zinc-400 font-normal ml-1">(optional)</span>
                                    </label>

                                    {/* Trigger */}
                                    <button
                                        type="button"
                                        onClick={() => setSectorDropOpen((v) => !v)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${sectorDropOpen
                                            ? "border-[#00A651] ring-2 ring-[#00A651]/30 bg-white"
                                            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                                            }`}
                                    >
                                        <span className={totalSelected > 0 ? "text-zinc-900" : "text-zinc-400"}>
                                            {totalSelected > 0
                                                ? `${totalSelected} selected`
                                                : "Select sectors..."}
                                        </span>
                                        <ChevronDown
                                            size={14}
                                            className={`text-zinc-400 transition-transform duration-200 ${sectorDropOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {sectorDropOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                                exit={{ opacity: 0, y: -4, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="mt-2 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden"
                                            >
                                                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100">
                                                    {SECTORS.map((sector) => {
                                                        const isSectorActive = selectedSectors.includes(sector.name);
                                                        const isExpanded = expandedSector === sector.name;
                                                        const activeSubs = sector.subs.filter((s) =>
                                                            selectedSubs.includes(s)
                                                        );

                                                        return (
                                                            <div key={sector.name}>
                                                                {/* Sector row */}
                                                                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-50 transition-colors">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleSector(sector.name)}
                                                                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isSectorActive
                                                                            ? "bg-[#00A651] border-[#00A651]"
                                                                            : "border-zinc-300"
                                                                            }`}
                                                                    >
                                                                        {isSectorActive && (
                                                                            <Check size={10} className="text-white" strokeWidth={3} />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setExpandedSector(
                                                                                isExpanded ? null : sector.name
                                                                            )
                                                                        }
                                                                        className="flex-1 flex items-center justify-between text-left"
                                                                    >
                                                                        <span className="text-xs font-semibold text-zinc-800">
                                                                            {sector.name}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            {activeSubs.length > 0 && (
                                                                                <span className="text-[10px] bg-[#00A651]/10 text-[#00A651] font-bold px-1.5 py-0.5 rounded">
                                                                                    {activeSubs.length}
                                                                                </span>
                                                                            )}
                                                                            <ChevronDown
                                                                                size={12}
                                                                                className={`text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                                                                    }`}
                                                                            />
                                                                        </span>
                                                                    </button>
                                                                </div>

                                                                {/* Sub-sectors */}
                                                                <AnimatePresence>
                                                                    {isExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.15 }}
                                                                            className="overflow-hidden bg-zinc-50/50"
                                                                        >
                                                                            {sector.subs.map((sub) => {
                                                                                const isSubActive = selectedSubs.includes(sub);
                                                                                return (
                                                                                    <button
                                                                                        key={sub}
                                                                                        type="button"
                                                                                        onClick={() => toggleSub(sub, sector.name)}
                                                                                        className="w-full flex items-center gap-2 pl-9 pr-3 py-2 hover:bg-zinc-100 transition-colors text-left"
                                                                                    >
                                                                                        <span
                                                                                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${isSubActive
                                                                                                ? "bg-[#00A651] border-[#00A651]"
                                                                                                : "border-zinc-300"
                                                                                                }`}
                                                                                        >
                                                                                            {isSubActive && (
                                                                                                <Check size={8} className="text-white" strokeWidth={3} />
                                                                                            )}
                                                                                        </span>
                                                                                        <span className="text-[11px] text-zinc-600">
                                                                                            {sub}
                                                                                        </span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Selected tags */}
                                    {(selectedSectors.length > 0 || selectedSubs.length > 0) && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedSectors.map((s) => (
                                                <span
                                                    key={s}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#00A651]/10 text-[10px] font-bold text-[#00A651]"
                                                >
                                                    {s}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSector(s)}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ))}
                                            {selectedSubs.map((s) => (
                                                <span
                                                    key={s}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 text-[10px] font-semibold text-zinc-600"
                                                >
                                                    {s}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSubs((prev) => prev.filter((x) => x !== s));
                                                        }}
                                                        className="hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Error */}
                                {errorMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600"
                                    >
                                        {errorMsg}
                                    </motion.div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#00A651] to-emerald-500 text-white text-sm font-bold shadow-lg shadow-[#00A651]/20 hover:shadow-[#00A651]/40 hover:brightness-110 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {status === "loading" ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Subscribing...
                                        </>
                                    ) : (
                                        "Subscribe Free"
                                    )}
                                </button>

                                <p className="mt-3 text-center text-[10px] text-zinc-400">
                                    Free • No spam • Unsubscribe anytime
                                </p>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
