"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { usePostHog } from "@posthog/react";

function VerifyAccessContent() {
    const posthog = usePostHog();
    const { signIn, setActive } = useSignIn();
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const userId = searchParams.get("userId");
    const email = searchParams.get("email") || "";
    const name = searchParams.get("name") || "";

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "sending" | "verifying" | "signing-in">("idle");

    // Already signed in → dashboard
    if (isLoaded && isSignedIn) {
        router.push("/dashboard");
        return null;
    }

    if (!userId || !email) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-red-100">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Access</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Missing verification parameters. Please use your access link again.
                    </p>
                    <a
                        href="/auth"
                        onClick={() => {
                            if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
                        }}
                        className="inline-block bg-[#0AB996] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#099e82] transition-colors"
                    >
                        Go to Sign In
                    </a>
                </div>
            </div>
        );
    }

    // Mask email: show first 2 chars + ***@domain
    const maskedEmail = (() => {
        const [local, domain] = email.split("@");
        if (!domain) return email;
        const visible = local.slice(0, 2);
        return `${visible}${"•".repeat(Math.max(0, local.length - 2))}@${domain}`;
    })();

    const handleSendOtp = async () => {
        setIsLoading(true);
        setError(null);
        setStatus("sending");

        try {
            const res = await fetch("/api/auth/magic-email-otp-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send OTP");
            setOtpSent(true);
            setStatus("idle");
        } catch (err: any) {
            setError(err.message);
            setStatus("idle");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setError("Please enter the 4-digit OTP");
            return;
        }
        setIsLoading(true);
        setError(null);
        setStatus("verifying");

        try {
            // Step 1: Verify OTP and get Clerk ticket
            const utmPayload = {
                utm_source: localStorage.getItem("utm_source"),
                utm_medium: localStorage.getItem("utm_medium"),
                utm_campaign: localStorage.getItem("utm_campaign"),
                utm_term: localStorage.getItem("utm_term"),
                utm_content: localStorage.getItem("utm_content")
            };

            const res = await fetch("/api/auth/magic-otp-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, userId: Number(userId), ...utmPayload }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Verification failed");

            const { ticket } = data;
            if (!ticket || !signIn) {
                throw new Error("No sign-in ticket received");
            }

            // Step 2: Consume Clerk sign-in ticket
            setStatus("signing-in");
            const result = await signIn.create({
                strategy: "ticket",
                ticket,
            });

            if (result.status === "complete" && result.createdSessionId) {
                await setActive({ session: result.createdSessionId });
                if (posthog) {
                    posthog.capture("login_completed", {
                        timestamp: new Date().toISOString(),
                        path: window.location.pathname,
                    });
                }

                // Force a full navigation to get fresh server state
                setTimeout(() => {
                    window.location.replace(`/dashboard?reload=${Date.now()}`);
                }, 300);
            } else {
                throw new Error("Sign-in could not be completed");
            }
        } catch (err: any) {
            console.error("[VERIFY_ACCESS]", err);
            const msg = err?.errors?.[0]?.message || err?.message || "";

            if (msg.toLowerCase().includes("already signed in")) {
                router.push("/dashboard");
                return;
            }

            setError(msg || "Verification failed. Please try again.");
            setStatus("idle");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-zinc-100">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0AB996]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-[#0AB996]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Verify Your Identity
                    </h1>
                    {name && (
                        <p className="text-zinc-600 font-medium">
                            Welcome back, {name}!
                        </p>
                    )}
                    <p className="text-zinc-400 text-sm mt-2">
                        We&apos;ll send a verification code to your email address
                    </p>
                </div>

                {/* Email display */}
                <div className="bg-zinc-50 rounded-lg p-4 mb-6 text-center">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                        Email Address
                    </p>
                    <p className="text-lg font-mono font-semibold text-zinc-800 tracking-wider">
                        {maskedEmail}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Send OTP button */}
                {!otpSent && (
                    <button
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-[#0AB996] text-white font-semibold rounded-lg hover:bg-[#099c82] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0AB996]/20"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending OTP...
                            </span>
                        ) : (
                            "Send Verification Code"
                        )}
                    </button>
                )}

                {/* OTP input & verify */}
                {otpSent && status !== "signing-in" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-blue-700">
                                Verification code sent to your email
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-700">
                                Enter 4-digit OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                                }
                                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                                placeholder="• • • •"
                                maxLength={4}
                                autoFocus
                            />
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
                                "Verify & Sign In"
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setOtpSent(false);
                                setOtp("");
                                setError(null);
                            }}
                            disabled={isLoading}
                            className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-2"
                        >
                            Resend OTP
                        </button>
                    </div>
                )}

                {/* Signing in state */}
                {status === "signing-in" && (
                    <div className="text-center py-4">
                        <div className="w-8 h-8 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-zinc-600 font-medium">
                            Creating your session...
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
                    <p className="text-xs text-zinc-400">
                        Having trouble?{" "}
                        <a href="/auth" onClick={() => {
                            if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
                        }} className="text-[#0AB996] hover:underline">
                            Try signing in instead
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyAccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
                    <div className="w-10 h-10 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mb-4" />
                    <p className="text-sm text-zinc-500 font-medium animate-pulse">
                        Loading...
                    </p>
                </div>
            }
        >
            <VerifyAccessContent />
        </Suspense>
    );
}
