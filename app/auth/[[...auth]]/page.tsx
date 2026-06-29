"use client";

import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import DotGrid from "@/components/DotGrid";
import { usePostHog } from "@posthog/react";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    POST_AUTH_REDIRECT_COOKIE,
    POST_AUTH_REDIRECT_STORAGE_KEY,
    getSafeRedirectPath,
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

// ── Helpers ──

const getBrowserRedirectParam = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return new URLSearchParams(window.location.search).get("redirect_url");
};

const getPostLoginFallbackPath = (target: string): string => {
    const safeTarget = getSafeRedirectPath(target);

    if (safeTarget === "/onboarding") {
        return "/";
    }

    return safeTarget;
};

export default function UnifiedAuthPage() {
    const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
    const { signUp, isLoaded: signUpLoaded } = useSignUp();
    const { isSignedIn } = useAuth();
    const searchParams = useSearchParams();

    const [identifier, setIdentifier] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<AuthStep>("identifier");
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [resolvedPostAuthRedirect, setResolvedPostAuthRedirect] = useState<string | null>(null);
    const [userFirstName, setUserFirstName] = useState("");
    const [mounted, setMounted] = useState(false);

    const posthog = usePostHog();
    const postAuthRedirect = resolvedPostAuthRedirect ?? DEFAULT_POST_AUTH_REDIRECT;

    const resolvePostAuthRedirect = useCallback(
        () => {
            const fromUrl = getBrowserRedirectParam() ?? searchParams.get("redirect_url");
            const fromStorage = typeof window !== "undefined"
                ? sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY)
                : null;
            return getSafeRedirectPath(fromUrl ?? fromStorage);
        },
        [searchParams]
    );

    useEffect(() => {
        const resolved = resolvePostAuthRedirect();
        setResolvedPostAuthRedirect(resolved);
        if (typeof window === "undefined") {
            return;
        }

        // Persist to sessionStorage and a regular cookie so the server can
        // recover the intended return path if Clerk lands on /dashboard first.
        sessionStorage.setItem(POST_AUTH_REDIRECT_STORAGE_KEY, resolved);
        document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=${encodeURIComponent(resolved)}; path=/; max-age=86400; SameSite=Lax`;
        setMounted(true);
    }, [resolvePostAuthRedirect]);

    // Track registration started when the auth page mounts
    useEffect(() => {
        if (posthog) {
            posthog.capture("registration_started", {
                timestamp: new Date().toISOString(),
                path: window.location.pathname,
            });
        }
    }, [posthog]);

    const resolveFinalAuthRedirect = useCallback(
        () => getPostLoginFallbackPath(resolvePostAuthRedirect()),
        [resolvePostAuthRedirect]
    );

    /** Route user through onboarding if needed, otherwise go directly to target */
    /** Always redirect to target — the OnboardingModal in root layout
     *  will show the onboarding form as a popup if needed. */
    const navigatePostAuth = useCallback(
        (target: string, _forceOnboarding?: boolean) => {
            void _forceOnboarding;
            window.location.href = target;
        },
        [],
    );



    // If already signed in, redirect away from /auth.
    // Don't use navigatePostAuth here. The target page's
    // layout (e.g. dashboard/layout.tsx) will enforce onboarding if needed.
    useEffect(() => {
        if (mounted && isSignedIn) {
            window.location.replace(getPostLoginFallbackPath(postAuthRedirect));
        }
    }, [mounted, isSignedIn, postAuthRedirect]);

    // ── Step 1: Submit identifier ──
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
            // Query our local database to check if user exists and get their first name
            let exists = false;
            let dbFirstName = "";
            try {
                console.log("[AUTH] Checking user in DB for identifier:", identifier.trim());
                const checkRes = await fetch("/api/auth/check-user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: identifier.trim() }),
                });
                const checkData = await checkRes.json();
                console.log("[AUTH] DB check-user response:", checkData);
                if (checkData.exists) {
                    exists = true;
                    dbFirstName = checkData.firstName || "";
                }
            } catch (err) {
                console.error("[AUTH] Error in check-user DB query:", err);
            }

            console.log("[AUTH] Setting isNewUser:", !exists, "| userFirstName:", dbFirstName);
            setIsNewUser(!exists);
            setUserFirstName(dbFirstName);

            {
                // ── EMAIL PATH: Use Clerk ──
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
                        console.log("[AUTH] Existing Clerk user found, keeping isNewUser=false, step→otp-signin");
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
                            const target = resolveFinalAuthRedirect();
                            console.log("[AUTH-REDIRECT] handleSubmit complete, navigating to:", target);
                            await setActive!({ session: result.createdSessionId });
                            navigatePostAuth(target);
                            return;
                        }
                        setStep("complete");
                        navigatePostAuth(getPostLoginFallbackPath(postAuthRedirect));
                    }
                } catch (err: unknown) {
                    const clerkError = getClerkError(err);
                    const clerkCode = clerkError.code;
                    const clerkMessage =
                        clerkError.message ||
                        "Something went wrong. Please try again.";

                    if (
                        clerkCode === "form_identifier_not_found" ||
                        clerkCode === "identifier_not_found"
                    ) {
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
            }
        } finally {
            setLoading(false);
        }
    }, [identifier, postAuthRedirect, navigatePostAuth, posthog, resolveFinalAuthRedirect, signIn, signUp, signInLoaded, signUpLoaded, setActive]);

    // ── Step 2a: Verify OTP (Email - Clerk) ──
    const handleEmailOTPSubmit = useCallback(async () => {
        if (!signInLoaded || !signUpLoaded || !code.trim()) return;
        setLoading(true);
        setError("");

        try {
            if (isNewUser) {
                const result = await signUp!.attemptEmailAddressVerification({
                    code: code.trim(),
                });
                console.log("[Auth] Sign-up verification result:", result.status, result.createdSessionId);
                console.log("[Auth] Missing fields:", signUp!.missingFields);
                console.log("[Auth] Unverified fields:", signUp!.unverifiedFields);

                if (result.status === "complete") {
                    const sessionId = result.createdSessionId || signUp!.createdSessionId;
                    if (sessionId) {
                        if (posthog) {
                            posthog.capture("registration_completed", {
                                timestamp: new Date().toISOString(),
                                path: window.location.pathname,
                            });
                        }
                        const target = resolveFinalAuthRedirect();
                        console.log("[AUTH-REDIRECT] signup complete, navigating to:", target);
                        await setActive!({ session: sessionId });
                        navigatePostAuth(target, true);
                        return;
                    }
                    setStep("complete");
                    setTimeout(() => navigatePostAuth(getPostLoginFallbackPath(postAuthRedirect), true), 300);
                } else if (result.status === "missing_requirements") {
                    // Email verified but CAPTCHA/other requirement blocked completion
                    // Fallback: use backend to create user + sign-in token (bypasses CAPTCHA)
                    console.log("[Auth] Falling back to backend user creation...");
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
                            const target = resolveFinalAuthRedirect();
                            console.log("[AUTH-REDIRECT] signup-ticket complete, navigating to:", target);
                            await setActive!({ session: ticketResult.createdSessionId });
                            navigatePostAuth(target, true);
                            return;
                        }
                        setStep("complete");
                        setTimeout(() => navigatePostAuth(getPostLoginFallbackPath(postAuthRedirect), true), 300);
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
                console.log("[Auth] Sign-in verification result:", result.status, result.createdSessionId);

                if (result.status === "complete") {
                    const sessionId = result.createdSessionId || signIn!.createdSessionId;
                    if (sessionId) {
                        if (posthog) {
                            posthog.capture("login_completed", {
                                timestamp: new Date().toISOString(),
                                path: window.location.pathname,
                            });
                        }
                        const target = resolveFinalAuthRedirect();
                        console.log("[AUTH-REDIRECT] signin complete, navigating to:", target);
                        await setActive!({ session: sessionId });
                        navigatePostAuth(target);
                        return;
                    }
                    setStep("complete");
                    setTimeout(() => navigatePostAuth(getPostLoginFallbackPath(postAuthRedirect)), 300);
                } else {
                    setError(`Verification status: ${result.status}. Please try again.`);
                }
            }
        } catch (err: unknown) {
            console.error("[Auth] Verification error:", err);
            const errMsg = getClerkError(err).message || "";

            // If verification was already done (retry scenario), fall back to backend
            if (isNewUser && errMsg.toLowerCase().includes("already been verified")) {
                console.log("[Auth] Already verified — falling back to backend...");
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
                            const target = resolveFinalAuthRedirect();
                            console.log("[AUTH-REDIRECT] signin-ticket complete, navigating to:", target);
                            await setActive!({ session: ticketResult.createdSessionId });
                            navigatePostAuth(target);
                            return;
                        }
                        setStep("complete");
                        setTimeout(() => navigatePostAuth(getPostLoginFallbackPath(postAuthRedirect)), 300);
                        return;
                    }
                } catch (backendErr) {
                    console.error("[Auth] Backend fallback error:", backendErr);
                }
            }

            setError(errMsg || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [code, identifier, isNewUser, postAuthRedirect, navigatePostAuth, posthog, resolveFinalAuthRedirect, signIn, signUp, signInLoaded, signUpLoaded, setActive]);



    // ── Google OAuth ──
    const handleGoogleAuth = useCallback(async () => {
        if (!signInLoaded) return;
        if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
        try {
            const target = persistPostAuthRedirect(resolveFinalAuthRedirect());
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: target,
            });
        } catch {
            setError("Google sign-in failed. Please try again.");
        }
    }, [posthog, resolveFinalAuthRedirect, signIn, signInLoaded]);

    // ── LinkedIn OAuth ──
    const handleLinkedInAuth = useCallback(async () => {
        if (!signInLoaded) return;
        if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
        try {
            const target = persistPostAuthRedirect(resolveFinalAuthRedirect());
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_linkedin_oidc",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: target,
            });
        } catch {
            setError("LinkedIn sign-in failed. Please try again.");
        }
    }, [posthog, resolveFinalAuthRedirect, signIn, signInLoaded]);

    // ── Resend OTP ──
    const handleResend = useCallback(async () => {
        setError("");
        setInfo("");

        // Resend via Clerk
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

    // ── Go back ──
    const handleBack = () => {
        setStep("identifier");
        setCode("");
        setError("");
        setInfo("");
        setIsNewUser(false);
    };

    const isOTPStep = step === "otp-signin" || step === "otp-signup";

    // Early return if signed in (must be after all hooks)
    if (isSignedIn) return null;

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
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/6 border border-zinc-200/60 p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <Image
                                src="/logo - energclub-energdive.png"
                                alt="Energdive"
                                width={250}
                                height={60}
                                priority
                            />
                        </div>
                        <p className="text-sm text-zinc-500 mt-1">
                            {step === "identifier"
                                ? "Sign in or create your account"
                                : "Enter the verification code"}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* ── STEP: Identifier Input ── */}
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
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={identifier}
                                            onChange={(e) => {
                                                setIdentifier(e.target.value);
                                                setError("");
                                            }}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && handleSubmit()
                                            }
                                            placeholder="Enter your email address"
                                            className="w-full h-11 px-4 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                            autoFocus
                                        />
                                        {/* Email icon indicator */}
                                        {identifier.trim() && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
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

                                {/* Clerk mounts Smart CAPTCHA here for custom sign-up flows. */}
                                <div
                                    id="clerk-captcha"
                                    className="mb-4 flex justify-center overflow-hidden"
                                />

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !identifier.trim()}
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
                        {isOTPStep && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* Info Banner / Welcome Message */}
                                {!isNewUser ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl text-sm mb-4 bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium"
                                    >
                                        Hey, welcome {userFirstName || "back"}! 👋 Here is your OTP for login:
                                    </motion.div>
                                ) : (
                                    info && (
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
                                    )
                                )}

                                {/* Identifier display */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <span className="text-sm text-zinc-500">
                                        Sending to{" "}
                                        <span className="font-medium text-zinc-700">
                                            {identifier}
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
                                            e.key === "Enter" && handleEmailOTPSubmit()
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
                                    onClick={handleEmailOTPSubmit}
                                    disabled={
                                        loading ||
                                        code.length < 6
                                    }
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
