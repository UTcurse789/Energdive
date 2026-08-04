"use client";

import React, { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

export function SidebarNewsletterForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;

        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    frequency: "Daily x1",
                    preferences: ["News Briefing"],
                    source: "Sidebar Daily Briefing CTA",
                    subscribedFromUrl: typeof window !== "undefined" ? window.location.href : "",
                    subscribedFromTitle: typeof document !== "undefined" ? document.title : "",
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStatus("error");
                setMessage(data.error || "Subscription failed. Please try again.");
                return;
            }

            setStatus("success");
            setMessage(data.message || "Subscribed successfully! Check your inbox.");
            setEmail("");
        } catch (err) {
            console.error("[SidebarNewsletterForm] Submit error:", err);
            setStatus("error");
            setMessage("Network error. Please try again later.");
        }
    }

    return (
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-6 sm:p-8 shadow-md ring-1 ring-slate-100">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5">
                <Mail size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Energy Briefing</h3>
            <p className="text-sm text-slate-500 mb-6 font-light">
                Get the most critical energy news and market signals delivered directly to your inbox every morning.
            </p>

            {status === "success" ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2">
                        <Check size={18} />
                    </div>
                    <p className="text-xs font-bold text-emerald-900 mb-1">Subscribed Successfully!</p>
                    <p className="text-[11px] text-emerald-700">{message}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all rounded-md"
                        required
                        disabled={status === "loading"}
                    />
                    {status === "error" && (
                        <p className="text-xs font-medium text-red-600 px-1">{message}</p>
                    )}
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full bg-slate-900 text-white font-bold text-sm py-3 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 rounded-md disabled:opacity-70"
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
                </form>
            )}

            <p className="text-[10px] text-slate-400 text-center mt-4">
                By subscribing, you agree to our Terms of Service & Privacy Policy.
            </p>
        </div>
    );
}
