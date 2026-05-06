"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2, FileText, Clock, Lock, ShieldCheck } from "lucide-react";

export function ArticleNewsletterCTA() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");

        // Simulate API call
        setTimeout(() => {
            setStatus("success");
            setEmail("");
        }, 1200);
    };

    if (status === "success") {
        return (
            <div className="my-10 bg-[#061118] border border-[#00A651]/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-sm">
                <div className="w-10 h-10 bg-[#00A651]/20 text-[#00A651] rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-2xl font-bold text-white mb-2">You&apos;re Subscribed!</h4>
                <p className="text-gray-400 max-w-sm">
                    Thank you for joining. You&apos;ll receive our next daily briefing directly in your inbox.
                </p>
            </div>
        );
    }

    return (
        <div className="my-10 max-w-3xl mx-auto bg-[#040e14] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col border border-white/[0.05]">

            {/* Dot grid pattern top right */}
            <div className="absolute top-8 right-12 opacity-30 pointer-events-none hidden md:block">
                <svg width="120" height="120" fill="none" viewBox="0 0 100 100">
                    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" fill="#00A651" />
                    </pattern>
                    <rect width="100" height="100" fill="url(#dots)" />
                </svg>
            </div>

            {/* Topo lines bottom right */}
            <div className="absolute -bottom-[40%] -right-[10%] w-[60%] h-[100%] opacity-[0.05] pointer-events-none hidden md:block">
                <div className="absolute inset-0 rounded-[35%] border-[1.5px] border-[#00A651] scale-[1.0] rotate-12" />
                <div className="absolute inset-0 rounded-[35%] border-[1.5px] border-[#00A651] scale-[1.2] rotate-[24deg]" />
                <div className="absolute inset-0 rounded-[35%] border-[1.5px] border-[#00A651] scale-[1.4] rotate-[36deg]" />
                <div className="absolute inset-0 rounded-[35%] border-[1.5px] border-[#00A651] scale-[1.6] rotate-[48deg]" />
                <div className="absolute inset-0 rounded-[35%] border-[1.5px] border-[#00A651] scale-[1.8] rotate-[60deg]" />
            </div>

            {/* Main content */}
            <div className="relative z-10 p-6 sm:p-10 pb-6 sm:pb-8 flex flex-col items-center text-center">

                {/* Daily Briefing Pill */}
                <div className="inline-flex items-center gap-2 mb-4 sm:mb-5">
                    <span className="border border-[#00C49A]/40 text-[#00C49A] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2 bg-[#00C49A]/10">
                        <Mail className="w-3 h-3" />
                        Daily Briefing
                    </span>
                </div>

                <h4 className="font-serif text-[28px] sm:text-[32px] md:text-[40px] font-bold text-white mb-6 leading-[1.15] tracking-tight">
                    Expert Energy News, <br className="sm:hidden" /><span className="text-[#00C49A]">Delivered.</span>
                </h4>

                {/* Form */}
                <div className="w-full max-w-lg mb-6">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 bg-transparent sm:bg-[#0B151C] border-0 sm:border border-white/10 rounded-xl p-0 sm:p-1.5 focus-within:border-[#00C49A]/50 transition-colors sm:shadow-inner">
                        <div className="w-9 h-9 rounded-full bg-[#15232D] hidden sm:flex items-center justify-center shrink-0 ml-1.5">
                            <Mail className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 w-full bg-[#0B151C] sm:bg-transparent text-white placeholder-gray-500 py-3.5 sm:py-2.5 px-4 sm:px-2 rounded-xl sm:rounded-none border border-white/10 sm:border-0 focus:outline-none focus:border-[#00C49A]/50 sm:focus:border-transparent text-[15px] text-center sm:text-left transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full sm:w-auto bg-[#00C49A] hover:bg-[#00B08A] text-white font-bold px-6 py-3.5 sm:py-2.5 rounded-xl sm:rounded-[10px] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                        >
                            {status === "loading" ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Subscribe
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center justify-center gap-2 mt-4">
                        <ShieldCheck className="w-[14px] h-[14px] text-[#00C49A]" />
                        <p className="text-[11px] text-gray-400">
                            By subscribing, you agree to our <a href="/terms" className="text-[#00C49A] hover:underline">Terms</a> and <a href="/privacy" className="text-[#00C49A] hover:underline">Privacy Policy</a>.
                        </p>
                    </div>
                </div>

                <div className="w-16 h-[2px] bg-[#00C49A]/50 mb-6 rounded-full" />

                <p className="text-gray-300 text-[15px] leading-relaxed max-w-[500px]">
                    Join <span className="text-[#00C49A] font-semibold">5,000+</span> industry professionals
                    who rely on our daily insights for Free
                </p>
            </div>

            {/* Bottom feature strip */}
            <div className="relative z-10 border-t border-white/5 bg-[#061118]/60 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5 max-w-6xl mx-auto w-full">
                    <div className="flex items-center gap-4 px-8 py-6">
                        <div className="w-10 h-10 rounded-full bg-[#00C49A]/10 flex items-center justify-center shrink-0">
                            <FileText className="w-[18px] h-[18px] text-[#00C49A]" />
                        </div>
                        <div>
                            <p className="text-white text-[13px] font-semibold tracking-wide">Expert Insights</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">Curated by industry experts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-8 py-6">
                        <div className="w-10 h-10 rounded-full bg-[#00C49A]/10 flex items-center justify-center shrink-0">
                            <Clock className="w-[18px] h-[18px] text-[#00C49A]" />
                        </div>
                        <div>
                            <p className="text-white text-[13px] font-semibold tracking-wide">Daily Briefing</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">5 minutes to stay ahead</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-8 py-6">
                        <div className="w-10 h-10 rounded-full bg-[#00C49A]/10 flex items-center justify-center shrink-0">
                            <Lock className="w-[18px] h-[18px] text-[#00C49A]" />
                        </div>
                        <div>
                            <p className="text-white text-[13px] font-semibold tracking-wide">Always Free</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">No paywall. Ever.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

