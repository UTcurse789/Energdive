"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const REASONS = [
    "Too many emails",
    "Content not relevant",
    "Not interested",
    "Other"
];

function UnsubscribeForm() {
    const searchParams = useSearchParams();
    const initialEmail = searchParams.get("email") || "";

    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (initialEmail) {
            setEmail(initialEmail);
        }
    }, [initialEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("idle");
        setMessage("");

        try {
            const res = await fetch("/api/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, reason }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage("You have been successfully unsubscribed.");
            } else {
                setStatus("error");
                setMessage(data.error || "An error occurred.");
            }
        } catch (err) {
            setStatus("error");
            setMessage("Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (status === "success") {
        return (
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full text-center">
                <div className="w-16 h-16 bg-[#00A651]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Unsubscribed Successfully</h2>
                <p className="text-slate-600">
                    We've updated your preferences. You will no longer receive emails from us.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unsubscribe</h2>
            <p className="text-slate-500 mb-8">
                We're sorry to see you go. Please let us know why you're leaving.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Reason for Unsubscribing
                    </label>
                    <select
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent transition-all"
                    >
                        <option value="" disabled>Select a reason...</option>
                        {REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {status === "error" && (
                    <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !email || !reason}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : "Confirm Unsubscribe"}
                </button>
            </form>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <div className="min-h-screen bg-[#F1F3F6] text-slate-900 selection:bg-[#00A651]/20 font-sans flex flex-col items-center pt-24 pb-12 px-6">
            <div className="mb-12 text-center">
                <Image
                    src="/logo2-removebg-preview.png"
                    alt="ENERGDIVE Logo"
                    width={200}
                    height={50}
                    className="mx-auto block"
                />
            </div>
            <Suspense fallback={<div className="text-slate-500">Loading form...</div>}>
                <UnsubscribeForm />
            </Suspense>
        </div>
    );
}
