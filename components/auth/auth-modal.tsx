"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";
import { usePostHog } from "@posthog/react";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
    getSafeRedirectPath,
    getSsoCallbackUrl,
    persistPostAuthRedirect,
} from "@/lib/post-auth-redirect";

type AuthStep = "identifier" | "otp-signin" | "otp-signup" | "complete";
type ClerkErrorBody = {
    code?: string;
    longMessage?: string;
    message?: string;
};
type ClerkErrorLike = {
    errors?: ClerkErrorBody[];
    message?: string;
};
type EmailCodeFactor = {
    strategy?: string;
    emailAddressId?: string;
};

const getClerkError = (error: unknown) => {
    if (typeof error !== "object" || error === null) {
        return { code: undefined, message: undefined };
    }

    const clerkError = error as ClerkErrorLike;
    const firstError = clerkError.errors?.[0];

    return {
        code: firstError?.code,
        message: firstError?.longMessage || firstError?.message || clerkError.message,
    };
};

const findEmailCodeFactor = (factors: unknown): EmailCodeFactor | undefined => {
    if (!Array.isArray(factors)) {
        return undefined;
    }

    return factors.find((factor): factor is EmailCodeFactor => {
        if (typeof factor !== "object" || factor === null) {
            return false;
        }

        return (factor as EmailCodeFactor).strategy === "email_code";
    });
};

export default function AuthModal() {
    const { isOpen, closeAuthModal, redirectUrl } = useAuthModal();
    const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const posthog = usePostHog();
    const [identifier, setIdentifier] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<AuthStep>("identifier");
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [userFirstName, setUserFirstName] = useState("");

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Reset state on close/open
    useEffect(() => {
        if (!isOpen) {
            setIdentifier("");
            setCode("");
            setStep("identifier");
            setIsNewUser(false);
            setLoading(false);
            setError("");
            setInfo("");
            setUserFirstName("");
        }
    }, [isOpen]);

    // Calculate redirect targets
    const redirectTarget = useMemo(() => {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://www.energdive.com";
        const rawValue = redirectUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");

        if (!rawValue) return "/";

        try {
            if (rawValue.startsWith("/") && !rawValue.startsWith("//")) {
                return getSafeRedirectPath(rawValue);
            }
            const parsed = new URL(rawValue, origin);
            if (parsed.origin === origin) {
                return getSafeRedirectPath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
            }
        } catch {
            return "/";
        }
        return "/";
    }, [redirectUrl]);

    // Persist redirect target to session storage & cookie so sso-callback can read it
    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;

        persistPostAuthRedirect(redirectTarget);
    }, [isOpen, redirectTarget]);

    const handleGoogleAuth = useCallback(async () => {
        if (!signInLoaded) return;
        if (posthog) {
            posthog.capture("login_clicked", {
                timestamp: new Date().toISOString(),
                path: window.location.pathname,
                provider: "google",
            });
        }
        try {
            const target = persistPostAuthRedirect(redirectTarget);
            const callbackUrl = getSsoCallbackUrl(target);
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: callbackUrl,
                redirectUrlComplete: callbackUrl,
            });
        } catch (err) {
            console.error("Google SSO Error:", err);
            setError("Google sign-in failed. Please try again.");
        }
    }, [redirectTarget, signIn, signInLoaded, posthog]);

    const handleLinkedInAuth = useCallback(async () => {
        if (!signInLoaded) return;
        if (posthog) {
            posthog.capture("login_clicked", {
                timestamp: new Date().toISOString(),
                path: window.location.pathname,
                provider: "linkedin",
            });
        }
        try {
            const target = persistPostAuthRedirect(redirectTarget);
            const callbackUrl = getSsoCallbackUrl(target);
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_linkedin_oidc",
                redirectUrl: callbackUrl,
                redirectUrlComplete: callbackUrl,
            });
        } catch (err) {
            console.error("LinkedIn SSO Error:", err);
            setError("LinkedIn sign-in failed. Please try again.");
        }
    }, [redirectTarget, signIn, signInLoaded, posthog]);

    const handleSubmit = useCallback(async () => {
        if (!signInLoaded || !signUpLoaded || !identifier.trim()) return;
        setLoading(true);
        setError("");
        setInfo("");

        if (posthog) {
            posthog.capture("registration_step1_completed", {
                timestamp: new Date().toISOString(),
                path: window.location.pathname,
            });
        }

        try {
            // Check DB to see if user exists & fetch first name
            let exists = false;
            let dbFirstName = "";
            try {
                const checkRes = await fetch("/api/auth/check-user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: identifier.trim() }),
                });
                const checkData = await checkRes.json();
                if (checkData.exists) {
                    exists = true;
                    dbFirstName = checkData.firstName || "";
                }
            } catch (err) {
                console.error("[AUTH] DB check-user failed:", err);
            }

            setIsNewUser(!exists);
            setUserFirstName(dbFirstName);

            const emailValue = identifier.trim();
            try {
                const result = await signIn!.create({
                    identifier: emailValue,
                });

                if (result.status === "needs_first_factor") {
                    const emailFactor = findEmailCodeFactor(result.supportedFirstFactors);
                    if (emailFactor?.emailAddressId) {
                        await signIn!.prepareFirstFactor({
                            strategy: "email_code",
                            emailAddressId: emailFactor.emailAddressId,
                        });
                        setInfo("We sent a verification code to your email.");
                    }
                    setIsNewUser(false);
                    setStep("otp-signin");
                } else if (result.status === "complete") {
                    if (result.createdSessionId) {
                        if (posthog) {
                            posthog.capture("login_completed", {
                                timestamp: new Date().toISOString(),
                                path: window.location.pathname,
                            });
                        }
                        await setActive!({ session: result.createdSessionId });
                        closeAuthModal();
                        window.location.reload();
                        return;
                    }
                    setStep("complete");
                    closeAuthModal();
                    window.location.reload();
                }
            } catch (err: unknown) {
                const clerkError = getClerkError(err);
                const clerkCode = clerkError.code;
                const clerkMessage =
                    clerkError.message ||
                    "Something went wrong. Please try again.";

                if (clerkCode === "form_identifier_not_found" || clerkCode === "identifier_not_found") {
                    setIsNewUser(true);
                    try {
                        await signUp!.create({ emailAddress: emailValue });
                        await signUp!.prepareEmailAddressVerification({
                            strategy: "email_code",
                        });
                        setStep("otp-signup");
                        setInfo("We sent a verification code to your email.");
                        return;
                    } catch (signUpErr: unknown) {
                        const signUpError = getClerkError(signUpErr);
                        const signUpCode = signUpError.code;
                        if (signUpCode === "form_identifier_exists") {
                            setIsNewUser(false);
                            setError("This account already exists. Please try signing in again.");
                            return;
                        }
                        setError(
                            signUpError.message ||
                            "Could not create account. Please try again."
                        );
                        return;
                    }
                }

                if (clerkCode === "form_identifier_exists") {
                    setIsNewUser(false);
                    setError("Account found. Please complete sign in with the verification code.");
                    return;
                }

                setError(clerkMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [identifier, signIn, signUp, signInLoaded, signUpLoaded, setActive, posthog, closeAuthModal]);

    const handleEmailOTPSubmit = useCallback(async () => {
        if (!signInLoaded || !signUpLoaded || !code.trim()) return;
        setLoading(true);
        setError("");

        try {
            if (isNewUser) {
                const result = await signUp!.attemptEmailAddressVerification({
                    code: code.trim(),
                });

                if (result.status === "complete") {
                    const sessionId = result.createdSessionId || signUp!.createdSessionId;
                    if (sessionId) {
                        if (posthog) {
                            posthog.capture("registration_completed", {
                                timestamp: new Date().toISOString(),
                                path: window.location.pathname,
                            });
                        }
                        await setActive!({ session: sessionId });
                        closeAuthModal();
                        // Trigger reload/navigation to same page
                        window.location.href = redirectTarget;
                        return;
                    }
                    setStep("complete");
                    closeAuthModal();
                    window.location.href = redirectTarget;
                } else if (result.status === "missing_requirements") {
                    // Fallback to email-verify API bypass for captcha issue
                    const emailValue = identifier.trim();
                    const res = await fetch("/api/auth/email-verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: emailValue }),
                    });
                    const data = await res.json();

                    if (data.success && data.token) {
                        const ticketResult = await signIn!.create({
                            strategy: "ticket",
                            ticket: data.token,
                        });
                        if (ticketResult.createdSessionId) {
                            if (posthog) {
                                posthog.capture("registration_completed", {
                                    timestamp: new Date().toISOString(),
                                    path: window.location.pathname,
                                });
                            }
                            await setActive!({ session: ticketResult.createdSessionId });
                            closeAuthModal();
                            window.location.href = redirectTarget;
                            return;
                        }
                        setStep("complete");
                        closeAuthModal();
                        window.location.href = redirectTarget;
                    } else {
                        setError(data.error || "Could not complete sign-up. Please try again.");
                    }
                } else {
                    setError(`Verification status: ${result.status}. Please try again.`);
                }
            } else {
                const result = await signIn!.attemptFirstFactor({
                    strategy: "email_code",
                    code: code.trim(),
                });

                if (result.status === "complete") {
                    const sessionId = result.createdSessionId || signIn!.createdSessionId;
                    if (sessionId) {
                        if (posthog) {
                            posthog.capture("login_completed", {
                                timestamp: new Date().toISOString(),
                                path: window.location.pathname,
                            });
                        }
                        await setActive!({ session: sessionId });
                        closeAuthModal();
                        window.location.href = redirectTarget;
                        return;
                    }
                    setStep("complete");
                    closeAuthModal();
                    window.location.href = redirectTarget;
                } else {
                    setError(`Verification status: ${result.status}. Please try again.`);
                }
            }
        } catch (err: unknown) {
            console.error("Verification error:", err);
            const errMsg = getClerkError(err).message || "";

            if (isNewUser && errMsg.toLowerCase().includes("already been verified")) {
                try {
                    const emailValue = identifier.trim();
                    const res = await fetch("/api/auth/email-verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: emailValue }),
                    });
                    const data = await res.json();

                    if (data.success && data.token) {
                        const ticketResult = await signIn!.create({
                            strategy: "ticket",
                            ticket: data.token,
                        });
                        if (ticketResult.createdSessionId) {
                            if (posthog) {
                                posthog.capture("registration_completed", {
                                    timestamp: new Date().toISOString(),
                                    path: window.location.pathname,
                                });
                            }
                            await setActive!({ session: ticketResult.createdSessionId });
                            closeAuthModal();
                            window.location.href = redirectTarget;
                            return;
                        }
                    }
                } catch (backendErr) {
                    console.error("Backend verification fallback failed:", backendErr);
                }
            }
            setError(errMsg || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [code, identifier, isNewUser, redirectTarget, signIn, signUp, signInLoaded, signUpLoaded, setActive, posthog, closeAuthModal]);

    const handleResend = useCallback(async () => {
        setError("");
        setInfo("");
        try {
            if (isNewUser) {
                await signUp!.prepareEmailAddressVerification({
                    strategy: "email_code",
                });
            } else {
                const emailFactor = findEmailCodeFactor(signIn!.supportedFirstFactors);
                if (emailFactor?.emailAddressId) {
                    await signIn!.prepareFirstFactor({
                        strategy: "email_code",
                        emailAddressId: emailFactor.emailAddressId,
                    });
                }
            }
            setInfo("A new code has been sent.");
        } catch {
            setError("Failed to resend code.");
        }
    }, [isNewUser, signIn, signUp]);

    const handleBack = () => {
        setStep("identifier");
        setCode("");
        setError("");
        setInfo("");
        setIsNewUser(false);
    };

    if (!isOpen) return null;

    const isOTPStep = step === "otp-signin" || step === "otp-signup";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
                {/* Backdrop Dismissal */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeAuthModal}
                    className="absolute inset-0 cursor-pointer"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                    className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-zinc-200/60 overflow-hidden z-10"
                >
                    {/* Close Button */}
                    <button
                        onClick={closeAuthModal}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Pad */}
                    <div className="p-8">
                        {/* Header Box */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="flex items-center justify-center mb-4">
                                <Image
                                    src="/logo - energclub-energdive.png"
                                    alt="Logo"
                                    width={280}
                                    height={56}
                                    style={{ objectFit: "contain" }}
                                    priority
                                    className="h-14 w-auto"
                                />
                            </div>
                            <h2 className="text-2xl font-bold font-serif text-zinc-900 leading-tight">
                                Access Premium Industry Resources
                            </h2>
                            <p className="text-xs text-zinc-500 mt-2.5 max-w-[280px]">
                                Sign in or register to unlock analysis, insights, and exclusive content.
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {/* Step 1: Email & Social Logins */}
                            {step === "identifier" && (
                                <motion.div
                                    key="identifier"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Email Field */}
                                    <div className="space-y-2 mb-4">
                                        <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                                            Work Email
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={identifier}
                                                onChange={(e) => {
                                                    setIdentifier(e.target.value);
                                                    setError("");
                                                }}
                                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                                placeholder="name@company.com"
                                                className="w-full h-11 px-4 pr-10 rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
                                                autoFocus
                                            />
                                            {identifier.trim() && (
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                    <Mail className="w-4 h-4 text-emerald-500 animate-fade-in" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-xs font-medium text-red-500 mb-3 animate-shake">
                                            {error}
                                        </p>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !identifier.trim()}
                                        className="w-full h-11 rounded-xl bg-[#00A651] hover:bg-[#009347] text-white text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3 my-5">
                                        <div className="flex-1 h-px bg-zinc-200/80" />
                                        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                                            Social Login
                                        </span>
                                        <div className="flex-1 h-px bg-zinc-200/80" />
                                    </div>

                                    {/* Social Logins */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={handleGoogleAuth}
                                            className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-xs font-bold text-zinc-700"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" className="shrink-0">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Google
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLinkedInAuth}
                                            className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-xs font-bold text-zinc-700"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2" className="shrink-0">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                            </svg>
                                            LinkedIn
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: OTP Entry */}
                            {isOTPStep && (
                                <motion.div
                                    key="otp"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {!isNewUser ? (
                                        <div className="p-3.5 rounded-xl text-xs mb-4 bg-emerald-50 text-emerald-800 border border-emerald-100/60 font-semibold leading-relaxed">
                                            Welcome {userFirstName || "back"}! 👋 Enter your 6-digit OTP code to log in:
                                        </div>
                                    ) : (
                                        info && (
                                            <div className="p-3.5 rounded-xl text-xs mb-4 bg-emerald-50 text-emerald-800 border border-emerald-100/60 font-semibold leading-relaxed">
                                                {info}
                                            </div>
                                        )
                                    )}

                                    {/* Sending details & Change link */}
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <span className="text-xs text-zinc-500">
                                            Sending to <span className="font-bold text-zinc-700">{identifier}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Code Input */}
                                    <div className="space-y-2 mb-4">
                                        <label className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                                            Verification Code
                                        </label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => {
                                                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                                                setError("");
                                            }}
                                            onKeyDown={(e) => e.key === "Enter" && handleEmailOTPSubmit()}
                                            placeholder="Enter 6-digit code"
                                            className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm text-zinc-900 text-center tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150"
                                            autoFocus
                                            maxLength={6}
                                            inputMode="numeric"
                                        />
                                    </div>

                                    {error && (
                                        <p className="text-xs font-medium text-red-500 mb-3 animate-shake">
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        onClick={handleEmailOTPSubmit}
                                        disabled={loading || code.length < 6}
                                        className="w-full h-11 rounded-xl bg-[#00A651] hover:bg-[#009347] text-white text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            "Verify & Continue"
                                        )}
                                    </button>

                                    {/* Resend Button */}
                                    <p className="text-center mt-5 text-xs text-zinc-400">
                                        Didn&apos;t receive the code?{" "}
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            className="text-emerald-600 hover:text-emerald-700 font-bold"
                                        >
                                            Resend
                                        </button>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Security Footer */}
                    <div className="border-t border-zinc-100 bg-zinc-50/50 py-3.5 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-bold">
                            Encrypted &amp; Secure
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
