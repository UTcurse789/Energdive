"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Mail,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Zap,
    BarChart2,
    Globe,
    BookOpen,
    Clock,
    Users,
    ShieldCheck,
} from "lucide-react";

import { useAuthModal } from "@/hooks/use-auth-modal";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: Zap,
        title: "Energy News",
        desc: "Be the first to know about policy shifts, project announcements, and market-moving events across India's energy sector.",
    },
    {
        icon: BarChart2,
        title: "Market Intelligence",
        desc: "Weekly data-driven analysis on power tariffs, renewable capacity additions, and sector-wide financial trends.",
    },
    {
        icon: BookOpen,
        title: "Expert Opinions, Interviews & Editorials",
        desc: "Curated perspectives from industry leaders, policymakers, and independent analysts shaping India's energy narrative.",
    },
    {
        icon: Globe,
        title: "Global Energy Watch",
        desc: "Stay informed on international developments — from OPEC decisions to IEA reports — and their impact on India.",
    },
];

const STATS = [
    { value: "50K+", label: "Active Subscribers", icon: Users },
    { value: "Daily", label: "Fresh Briefings", icon: Clock },
    { value: "40+", label: "Sectors & Sub-Sectors Covered", icon: Globe },
];

const TAGS = ["Daily briefings", "Weekly deep-dives", "Event alerts", "Market data"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewsletterPage() {
    const { openAuthModal } = useAuthModal();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
 
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) return;

        setErrorMsg("");
        setStatus("loading");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: normalizedEmail,
                    frequency: "Daily x1",
                    preferences: ["News Briefing"],
                    communities: [],
                    subCommunities: [],
                    source: "Newsletter Page",
                    subscribedFromUrl: window.location.href,
                    subscribedFromTitle: document.title,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStatus("error");
                setErrorMsg(data.error || "Subscription failed. Please try again.");
                return;
            }

            setStatus("success");
            setEmail("");
        } catch {
            setStatus("error");
            setErrorMsg("Network error. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900">

            {/* ─── Hero ─── */}
            <section className="relative bg-[#F9FAFB] border-b border-slate-100 pt-12 pb-10 px-6 overflow-hidden">
                {/* Subtle dot grid */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        opacity: 0.45,
                    }}
                />
                {/* Green glow top-right */}
                <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-[#00C853]/6 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00C853]/30 bg-[#00C853]/8 text-[#009624] text-[11px] font-bold tracking-widest uppercase mb-4">
                        <Mail className="w-3 h-3" />
                        Newsletter Subscribe
                    </div>

                    {/* Headline */}
                    <h1 className="font-serif text-4xl md:text-6xl font-black text-[#0F172A] leading-[1.05] tracking-tight mb-4">
                        Energy News, <span className="text-[#00C853]">Delivered.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-slate-500 text-base md:text-lg font-light max-w-2xl leading-relaxed mb-8">
                        Join 50,000+ energy professionals who start their day with ENERGDIVE — India's sharpest daily briefing on power, renewables, and the evolving energy landscape.
                    </p>

                    {/* ─── Stats Bar ─── */}
                    <div className="grid grid-cols-3 divide-x divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden max-w-xl">
                        {STATS.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3 px-5 py-4">
                                <stat.icon size={18} className="text-[#00C853] shrink-0" />
                                <div>
                                    <div className="text-lg font-bold text-slate-900 leading-tight">{stat.value}</div>
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-tight mt-0.5">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Main Content ─── */}
            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-16">

                    {/* ── Left: What You Get ── */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00C853] mb-3">What You Get</p>
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0F172A] mb-10 leading-tight">
                            Your daily edge in<br className="hidden sm:block" /> energy markets.
                        </h2>

                        {/* Features */}
                        <div className="space-y-7 mb-10">
                            {FEATURES.map((item, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#00C853]/20 flex items-center justify-center group-hover:bg-[#00C853]/10 transition-colors">
                                        <item.icon size={18} className="text-[#00C853]" />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="text-[14px] font-bold text-slate-900 mb-1">{item.title}</h4>
                                        <p className="text-slate-500 text-[13px] leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-slate-100 mb-8" />

                        {/* Testimonial */}
                        <div className="relative bg-[#0F172A] rounded-2xl px-7 py-7 overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#00C853]/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="text-[#00C853] text-4xl font-black leading-none mb-3 font-serif">"</div>
                            <p className="text-slate-300 text-[13px] leading-relaxed mb-4">
                                ENERGDIVE's Daily Briefing is an essential part of my day. It gives me the context I need to make faster, more informed decisions for our team.
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                — Energy Professional, Renewables Sector
                            </p>
                        </div>
                    </div>

                    {/* ── Right: Conversion Stack ── */}
                    <div className="flex flex-col gap-6">

                        {/* Free Always Card */}

                        {/* ─── Subscription Form Card ─── */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            {/* Card header bar */}
                            <div className="bg-[#0F172A] px-7 py-5 flex items-center gap-4">
                                <div className="w-9 h-9 rounded-full bg-[#00C853]/15 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-[#00C853]" />
                                </div>
                                <div>
                                    <p className="text-white text-[14px] font-bold leading-tight">Subscribe to ENERGDIVE Newsletter</p>
                                    <p className="text-slate-400 text-[11px]">Join thousands of energy professionals</p>
                                </div>
                            </div>

                            <div className="p-7">
                                {status === "success" ? (
                                    <div className="text-center py-10">
                                        <div className="w-14 h-14 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className="w-7 h-7 text-[#00C853]" />
                                        </div>
                                        <h4 className="font-serif text-2xl font-bold text-slate-900 mb-2">You&apos;re Subscribed!</h4>
                                        <p className="text-slate-500 text-sm mb-6">
                                            Welcome aboard. Your first briefing is on its way.
                                        </p>
                                        <Link href="/" className="inline-flex items-center gap-2 text-[#00C853] font-bold text-sm hover:underline">
                                            Back to Homepage <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">Enter your email to subscribe</h4>
                                        <p className="text-slate-400 text-[13px] mb-6">
                                            Your daily briefing — curated, concise, and delivered every morning.
                                        </p>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label htmlFor="nl-email" className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    id="nl-email"
                                                    type="email"
                                                    placeholder="you@company.com"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C853]/25 focus:border-[#00C853] text-[14px] transition-all bg-slate-50"
                                                />
                                            </div>

                                            {status === "error" && errorMsg && (
                                                <p className="text-red-500 text-[12px] font-medium">{errorMsg}</p>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={status === "loading"}
                                                className="w-full bg-[#00C853] hover:bg-[#00b347] disabled:opacity-70 text-white font-bold py-3.5 rounded-xl text-[14px] transition-colors flex items-center justify-center gap-2 tracking-wide"
                                            >
                                                {status === "loading" ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>Subscribe Now <ArrowRight className="w-4 h-4" /></>
                                                )}
                                            </button>
                                        </form>

                                        {/* Trust signals */}
                                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                                            {[
                                                { icon: ShieldCheck, label: "No spam." },
                                                { icon: CheckCircle2, label: "Unsubscribe anytime." },
                                                { icon: ShieldCheck, label: "Always free." },
                                            ].map(({ icon: Icon, label }) => (
                                                <div key={label} className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                                    <Icon className="w-3.5 h-3.5 text-[#00C853]" />
                                                    {label}
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-[11px] text-slate-300 mt-4 leading-relaxed">
                                            By subscribing, you agree to our{" "}
                                            <Link href="/terms" className="text-[#00C853] hover:underline">Terms</Link>{" "}
                                            and{" "}
                                            <Link href="/privacy" className="text-[#00C853] hover:underline">Privacy Policy</Link>.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>


                        {/* ─── ENERGClub CTA ─── */}
                        <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 mb-1">Be a Part of ENERGClub</p>
                                <p className="text-slate-400 text-[12px]">Become a member and get exclusive access to events, webinars, and networking opportunities.</p>
                            </div>
                            <button
                                onClick={() => openAuthModal("/energclub")}
                                className="shrink-0 inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-bold text-[12px] px-5 py-2.5 rounded-xl hover:border-[#00C853] hover:text-[#00C853] transition-colors whitespace-nowrap cursor-pointer"
                            >
                                Join ENERGClub <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* ─── Print Edition CTA ─── */}
                        <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                            <div>
                                <p className="text-[13px] font-bold text-slate-900 mb-1">Looking for the print edition?</p>
                                <p className="text-slate-400 text-[12px]">Subscribe to ENERGDIVE Magazine for in-depth quarterly analysis.</p>
                            </div>
                            <Link
                                href="/subscribe"
                                className="shrink-0 inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-bold text-[12px] px-5 py-2.5 rounded-xl hover:border-[#00C853] hover:text-[#00C853] transition-colors whitespace-nowrap"
                            >
                                Print Subscription <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
