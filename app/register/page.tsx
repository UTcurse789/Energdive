"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { usePostHog } from "@posthog/react";

function RegisterContent() {
    const posthog = usePostHog();
    const [step, setStep] = useState<"form" | "otp" | "success">("form");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
    });
    const [otp, setOtp] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [membershipId, setMembershipId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Step 1: Submit registration form → send OTP
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.email) {
            setError("Name and email are required");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    company: formData.company,
                    source: "website",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to send OTP");
                setIsLoading(false);
                return;
            }

            setMaskedEmail(data.maskedEmail || formData.email);
            setStep("otp");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setError("Please enter the 4-digit OTP");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Verification failed");
                setIsLoading(false);
                return;
            }

            setMembershipId(data.membershipId);
            setStep("success");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    source: "website",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to resend OTP");
            } else {
                setOtp("");
            }
        } catch {
            setError("Failed to resend OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Success state ────────────────────────────────────────────────────
    if (step === "success") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-[#0AB996]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-[#0AB996]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to EnergClub! 🎉
                    </h1>
                    <p className="text-zinc-500 text-sm mb-6">
                        Your registration is complete and verified.
                    </p>

                    {membershipId && (
                        <div className="bg-[#0a2e1f] rounded-xl p-6 mb-6">
                            <p className="text-[#09B697] text-xs font-bold uppercase tracking-widest mb-2">
                                Your Membership ID
                            </p>
                            <p className="text-white text-3xl font-mono font-black tracking-wider">
                                {membershipId}
                            </p>
                            <p className="text-[#6B9E8C] text-xs mt-2">Keep this for your records</p>
                        </div>
                    )}

                    <Link
                        href="/auth"
                        onClick={() => {
                            if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
                        }}
                        className="inline-block w-full bg-[#0AB996] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#099e82] transition-colors shadow-lg shadow-[#0AB996]/20 text-center"
                    >
                        Sign In to Dashboard →
                    </Link>
                </div>
            </div>
        );
    }

    // ── OTP entry state ──────────────────────────────────────────────────
    if (step === "otp") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#0AB996]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#0AB996]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Check Your Email</h1>
                        <p className="text-zinc-400 text-sm mt-2">
                            Enter the verification code sent to <strong className="text-zinc-600">{maskedEmail}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-700">
                                Enter 4-digit OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                                placeholder="• • • •"
                                maxLength={4}
                                autoFocus
                            />
                            <p className="text-xs text-zinc-400 text-center">
                                Code is valid for 10 minutes. Max 5 attempts.
                            </p>
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            disabled={isLoading || otp.length < 4}
                            className="w-full px-4 py-3 bg-[#0AB996] text-white font-semibold rounded-lg hover:bg-[#099c82] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0AB996]/20"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Verify & Create Account"
                            )}
                        </button>

                        <button
                            onClick={handleResendOtp}
                            disabled={isLoading}
                            className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-2"
                        >
                            Didn&apos;t receive the code? Resend OTP
                        </button>

                        <button
                            onClick={() => {
                                setStep("form");
                                setOtp("");
                                setError(null);
                            }}
                            className="w-full text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            ← Back to registration
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Registration form ────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0AB996]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#0AB996]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Join EnergClub</h1>
                    <p className="text-zinc-400 text-sm">
                        Create your account to access the energy intelligence portal
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-sm"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-sm"
                            placeholder="john@company.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-sm"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Company / Organization
                        </label>
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-sm"
                            placeholder="Your company name"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-[#0AB996] text-white font-semibold rounded-lg hover:bg-[#099c82] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0AB996]/20"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending OTP...
                            </span>
                        ) : (
                            "Register & Verify"
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
                    <p className="text-sm text-zinc-400">
                        Already have an account?{" "}
                        <Link 
                            href="/auth" 
                            onClick={() => {
                                if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
                            }}
                            className="text-[#0AB996] font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
                    <div className="w-10 h-10 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mb-4" />
                    <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading...</p>
                </div>
            }
        >
            <RegisterContent />
        </Suspense>
    );
}
