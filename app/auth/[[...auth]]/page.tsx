"use client";

import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DotGrid from "@/components/DotGrid";

type AuthStep = "identifier" | "otp-signin" | "otp-signup" | "complete";

export default function UnifiedAuthPage() {
    const { signIn, isLoaded: signInLoaded } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const { isSignedIn } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<AuthStep>("identifier");
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    // If already signed in, redirect
    if (isSignedIn) {
        router.replace("/dashboard");
        return null;
    }

    // ── Step 1: Submit email → try sign-in, fallback to sign-up ──
    const handleEmailSubmit = useCallback(async () => {
        if (!signInLoaded || !signUpLoaded || !email.trim()) return;
        setLoading(true);
        setError("");
        setInfo("");

        try {
            // Try sign-in first
            const result = await signIn!.create({
                identifier: email.trim(),
            });

            // If sign-in needs first factor (OTP)
            if (result.status === "needs_first_factor") {
                // Prepare email OTP
                await signIn!.prepareFirstFactor({
                    strategy: "email_code",
                    emailAddressId: (result.supportedFirstFactors as any[])?.find(
                        (f) => f.strategy === "email_code"
                    )?.emailAddressId,
                });
                setIsNewUser(false);
                setStep("otp-signin");
                setInfo("We sent a verification code to your email.");
            } else if (result.status === "complete") {
                setStep("complete");
                router.replace("/dashboard");
            }
        } catch (err: any) {
            const clerkError = err?.errors?.[0];
            const code = clerkError?.code;

            // User not found → auto sign-up
            if (
                code === "form_identifier_not_found" ||
                code === "identifier_not_found"
            ) {
                try {
                    const signUpResult = await signUp!.create({
                        emailAddress: email.trim(),
                    });

                    // Prepare email verification
                    await signUp!.prepareEmailAddressVerification({
                        strategy: "email_code",
                    });

                    setIsNewUser(true);
                    setStep("otp-signup");
                    setInfo(
                        "No account found — we're creating one for you! Check your email for the verification code."
                    );
                } catch (signUpErr: any) {
                    setError(
                        signUpErr?.errors?.[0]?.longMessage ||
                        "Could not create account. Please try again."
                    );
                }
            } else {
                setError(
                    clerkError?.longMessage ||
                    "Something went wrong. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    }, [email, signIn, signUp, signInLoaded, signUpLoaded, router]);

    // ── Step 2: Verify OTP code ──
    const handleOTPSubmit = useCallback(async () => {
        if (!signInLoaded || !signUpLoaded || !code.trim()) return;
        setLoading(true);
        setError("");

        try {
            if (isNewUser) {
                // Sign-up verification
                const result = await signUp!.attemptEmailAddressVerification({
                    code: code.trim(),
                });
                if (result.status === "complete") {
                    setStep("complete");
                    router.replace("/dashboard");
                }
            } else {
                // Sign-in verification
                const result = await signIn!.attemptFirstFactor({
                    strategy: "email_code",
                    code: code.trim(),
                });
                if (result.status === "complete") {
                    setStep("complete");
                    router.replace("/dashboard");
                }
            }
        } catch (err: any) {
            setError(
                err?.errors?.[0]?.longMessage ||
                "Invalid code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [code, isNewUser, signIn, signUp, signInLoaded, signUpLoaded, router]);

    // ── Google OAuth ──
    const handleGoogleAuth = useCallback(async () => {
        if (!signInLoaded) return;
        try {
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err: any) {
            setError("Google sign-in failed. Please try again.");
        }
    }, [signIn, signInLoaded]);

    // ── LinkedIn OAuth ──
    const handleLinkedInAuth = useCallback(async () => {
        if (!signInLoaded) return;
        try {
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_linkedin_oidc",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (err: any) {
            setError("LinkedIn sign-in failed. Please try again.");
        }
    }, [signIn, signInLoaded]);

    // ── Resend OTP ──
    const handleResend = useCallback(async () => {
        setError("");
        setInfo("");
        try {
            if (isNewUser) {
                await signUp!.prepareEmailAddressVerification({
                    strategy: "email_code",
                });
            } else {
                await signIn!.prepareFirstFactor({
                    strategy: "email_code",
                    emailAddressId: (signIn!.supportedFirstFactors as any[])?.find(
                        (f) => f.strategy === "email_code"
                    )?.emailAddressId,
                });
            }
            setInfo("A new code has been sent to your email.");
        } catch {
            setError("Failed to resend code.");
        }
    }, [isNewUser, signIn, signUp]);

    // ── Go back ──
    const handleBack = () => {
        setStep("identifier");
        setCode("");
        setError("");
        setInfo("");
        setIsNewUser(false);
    };

    if (!signInLoaded || !signUpLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-white overflow-hidden flex items-center justify-center font-sans selection:bg-emerald-200 selection:text-emerald-900">
            {/* DotGrid Background */}
            <div className="absolute inset-0 z-0">
                <DotGrid
                    style={{ width: "100%", height: "100%" }}
                    dotSize={6}
                    gap={20}
                    baseColor="#f1f1f1"
                    activeColor="#10b981"
                    proximity={120}
                    shockRadius={200}
                    shockStrength={3}
                    resistance={500}
                    returnDuration={1}
                />
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,white_90%)]" />
            </div>

            {/* Auth Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-[420px] mx-4"
            >
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/[0.06] border border-zinc-200/60 p-8">
                    {/* Clerk CAPTCHA container for bot protection */}
                    <div id="clerk-captcha" className="mb-2" />

                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight font-sans">
                            Welcome to Energdive
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {step === "identifier"
                                ? "Sign in or create your account"
                                : "Enter the verification code"}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* ── STEP: Email Input ── */}
                        {step === "identifier" && (
                            <motion.div
                                key="identifier"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* Social Logins */}
                                <div className="space-y-2.5 mb-5">
                                    <button
                                        onClick={handleGoogleAuth}
                                        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 transition-all duration-200 text-sm font-medium text-zinc-700"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                    <button
                                        onClick={handleLinkedInAuth}
                                        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 transition-all duration-200 text-sm font-medium text-zinc-700"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                        Continue with LinkedIn
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-3 my-5">
                                    <div className="flex-1 h-px bg-zinc-200/80" />
                                    <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                                        or
                                    </span>
                                    <div className="flex-1 h-px bg-zinc-200/80" />
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1.5 mb-4">
                                    <label className="text-[13px] font-medium text-zinc-600">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError("");
                                        }}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleEmailSubmit()
                                        }
                                        placeholder="you@company.com"
                                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                        autoFocus
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-red-500 mb-3"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleEmailSubmit}
                                    disabled={loading || !email.trim()}
                                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        "Continue"
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* ── STEP: OTP Verification ── */}
                        {(step === "otp-signin" || step === "otp-signup") && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* Info Banner */}
                                {info && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-xl text-sm mb-4 ${isNewUser
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                            : "bg-zinc-50 text-zinc-600 border border-zinc-100"
                                            }`}
                                    >
                                        {info}
                                    </motion.div>
                                )}

                                {/* Email display */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <span className="text-sm text-zinc-500">
                                        Sending to{" "}
                                        <span className="font-medium text-zinc-700">
                                            {email}
                                        </span>
                                    </span>
                                    <button
                                        onClick={handleBack}
                                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Change
                                    </button>
                                </div>

                                {/* OTP Input */}
                                <div className="space-y-1.5 mb-4">
                                    <label className="text-[13px] font-medium text-zinc-600">
                                        Verification code
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => {
                                            setCode(
                                                e.target.value.replace(/\D/g, "").slice(0, 6)
                                            );
                                            setError("");
                                        }}
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && handleOTPSubmit()
                                        }
                                        placeholder="Enter 6-digit code"
                                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 text-center tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                        autoFocus
                                        maxLength={6}
                                        inputMode="numeric"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-red-500 mb-3"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                {/* Verify Button */}
                                <button
                                    onClick={handleOTPSubmit}
                                    disabled={loading || code.length < 6}
                                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        "Verify & Continue"
                                    )}
                                </button>

                                {/* Resend */}
                                <p className="text-center mt-4 text-xs text-zinc-400">
                                    Didn&apos;t receive the code?{" "}
                                    <button
                                        onClick={handleResend}
                                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Resend
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Security footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2"
            >
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-semibold">
                    Encrypted &amp; Secure
                </span>
            </motion.div>
        </div>
    );
}
