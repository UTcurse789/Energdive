"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function VerifyAccountContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [step, setStep] = useState<"loading" | "otp" | "success" | "error">("loading");
    const [email, setEmail] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [name, setName] = useState("");
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [otp, setOtp] = useState("");
    const [membershipId, setMembershipId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Validate magic token on page load
    useEffect(() => {
        if (!token) {
            setStep("error");
            setError("Missing verification token. Please use the link from your email.");
            return;
        }

        (async () => {
            try {
                const res = await fetch(`/api/auth/magic-link?token=${encodeURIComponent(token)}`);
                const data = await res.json();

                if (!res.ok) {
                    setStep("error");
                    setError(data.error || "Invalid verification link.");
                    return;
                }

                if (data.alreadyVerified) {
                    setStep("success");
                    setMembershipId("Already Verified");
                    return;
                }

                setEmail(data.email);
                setMaskedEmail(data.maskedEmail || data.email);
                setName(data.name || "");
                setPendingId(data.pendingId);
                setStep("otp");
            } catch {
                setStep("error");
                setError("Something went wrong. Please try again.");
            }
        })();
    }, [token]);

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
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Verification failed. Please try again.");
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
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to resend OTP");
            } else {
                setError(null);
                setOtp("");
            }
        } catch {
            setError("Failed to resend OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Loading state ────────────────────────────────────────────────────
    if (step === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="w-12 h-12 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-600 font-medium">Validating your verification link...</p>
                </div>
            </div>
        );
    }

    // ── Error state ──────────────────────────────────────────────────────
    if (step === "error" && !pendingId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                    <p className="text-zinc-500 text-sm mb-6">{error}</p>
                    <a href="/register" className="inline-block bg-[#0AB996] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#099e82] transition-colors">
                        Register Instead
                    </a>
                </div>
            </div>
        );
    }

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
                        Your membership has been verified successfully.
                    </p>

                    {membershipId && membershipId !== "Already Verified" && (
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

                    <a href="/auth" className="inline-block w-full bg-[#0AB996] text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#099e82] transition-colors shadow-lg shadow-[#0AB996]/20">
                        Go to Dashboard →
                    </a>
                </div>
            </div>
        );
    }

    // ── OTP entry state ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0AB996]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#0AB996]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Verify Your Email
                    </h1>
                    {name && (
                        <p className="text-zinc-600 font-medium">Hi {name}!</p>
                    )}
                    <p className="text-zinc-400 text-sm mt-2">
                        Step 2 of 2 — Enter the verification code sent to your email
                    </p>
                </div>

                {/* Email display */}
                <div className="bg-zinc-50 rounded-lg p-4 mb-6 text-center">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Code sent to</p>
                    <p className="text-lg font-mono font-semibold text-zinc-800 tracking-wider">{maskedEmail}</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* OTP input */}
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
                            "Verify & Complete Registration"
                        )}
                    </button>

                    <button
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-2"
                    >
                        Didn&apos;t receive the code? Resend OTP
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
                    <p className="text-xs text-zinc-400">
                        Having trouble?{" "}
                        <a href="/register" className="text-[#0AB996] hover:underline">
                            Register manually
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyAccountPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
                    <div className="w-10 h-10 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mb-4" />
                    <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading...</p>
                </div>
            }
        >
            <VerifyAccountContent />
        </Suspense>
    );
}
