"use client";

import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import DotGrid from "@/components/DotGrid";
import { usePostHog } from "@posthog/react";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    POST_AUTH_REDIRECT_COOKIE,
    POST_AUTH_REDIRECT_STORAGE_KEY,
    getSafeRedirectPath,
} from "@/lib/post-auth-redirect";

type AuthStep = "identifier" | "otp-signin" | "otp-signup" | "otp-phone" | "complete";
type InputMode = "email" | "phone";

// ── Helpers ──
const isPhoneInput = (value: string): boolean => {
    const cleaned = value.replace(/[\s\-()]/g, "");
    return /^\+?\d{7,15}$/.test(cleaned);
};

const formatPhoneForAPI = (phone: string): string => {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    // Default to +91 (India) if no country code
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("91") && cleaned.length >= 12) return `+${cleaned}`;
    return `+91${cleaned}`;
};

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
    const [existingUserOnboarded, setExistingUserOnboarded] = useState(false);

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

    const redirectTarget = useMemo(() => {
        const rawValue = searchParams.get("redirect_url");
        const origin =
            typeof window !== "undefined" ? window.location.origin : "https://www.energdive.com";

        if (!rawValue) {
            return DEFAULT_POST_AUTH_REDIRECT;
        }

        try {
            if (rawValue.startsWith("/") && !rawValue.startsWith("//")) {
                return getSafeRedirectPath(rawValue);
            }

            const parsed = new URL(rawValue, origin);
            if (parsed.origin === origin) {
                return getSafeRedirectPath(`${parsed.pathname}${parsed.search}${parsed.hash}`);
            }
        } catch {
            return DEFAULT_POST_AUTH_REDIRECT;
        }

        return DEFAULT_POST_AUTH_REDIRECT;
    }, [searchParams]);

    const resolveFinalAuthRedirect = useCallback(
        () => getPostLoginFallbackPath(resolvePostAuthRedirect()),
        [resolvePostAuthRedirect]
    );

    /** Route user through onboarding if needed, otherwise go directly to target */
    /** Always redirect to target — the OnboardingModal in root layout
     *  will show the onboarding form as a popup if needed. */
    const navigatePostAuth = useCallback(
        (target: string, _forceOnboarding?: boolean) => {
            window.location.href = target;
        },
        [],
    );

    // Auto-detect input type
    const inputMode: InputMode = useMemo(() => {
        const trimmed = identifier.trim();
        if (!trimmed) return "email";
        const cleaned = trimmed.replace(/[\s\-()]/g, "");
        if (/^\+?\d+$/.test(cleaned) && cleaned.length >= 4) return "phone";
        return "email";
    }, [identifier]);

    // If already signed in, redirect away from /auth.
    // Don't use navigatePostAuth here — existingUserOnboarded might still be
    // at its default (false) since handleSubmit never ran. The target page's
    // layout (e.g. dashboard/layout.tsx) will enforce onboarding if needed.
    useEffect(() => {
        if (isSignedIn) {
            window.location.replace(getPostLoginFallbackPath(postAuthRedirect));
        }
    }, [isSignedIn, postAuthRedirect]);

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
                    setExistingUserOnboarded(checkData.onboardingCompleted === true);
                }
            } catch (err) {
                console.error("[AUTH] Error in check-user DB query:", err);
            }

            console.log("[AUTH] Setting isNewUser:", !exists, "| userFirstName:", dbFirstName);
            setIsNewUser(!exists);
            setUserFirstName(dbFirstName);

            const isPhone = isPhoneInput(identifier.trim());

            if (isPhone) {
                // ── PHONE PATH: Use MSG91 ──
                const phone = formatPhoneForAPI(identifier.trim());
                try {
                    const res = await fetch("/api/otp/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone }),
                    });
                    const data = await res.json();

                    if (data.success) {
                        setStep("otp-phone");
                        setInfo(`We sent a verification code to ${phone}`);
                    } else {
                        setError(data.error || "Failed to send OTP. Please try again.");
                    }
                } catch {
                    setError("Network error. Please try again.");
                }
            } else {
                // ── EMAIL PATH: Use Clerk ──
                const emailValue = identifier.trim();
                try {
                    const result = await signIn!.create({
                        identifier: emailValue,
                    });

                    if (result.status === "needs_first_factor") {
                        const emailFactor = (result.supportedFirstFactors as any[])?.find(
                            (f) => f.strategy === "email_code"
                        );
                        if (emailFactor) {
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
                } catch (err: any) {
                    const clerkError = err?.errors?.[0];
                    const clerkCode = clerkError?.code;
                    const clerkMessage =
                        clerkError?.longMessage ||
                        clerkError?.message ||
                        err?.message ||
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
                        } catch (signUpErr: any) {
                            const signUpCode = signUpErr?.errors?.[0]?.code;

                            if (signUpCode === "form_identifier_exists") {
                                setIsNewUser(false);
                                setError("This account already exists. Please try signing in again.");
                                return;
                            }

                            setError(
                                signUpErr?.errors?.[0]?.longMessage ||
                                signUpErr?.errors?.[0]?.message ||
                                signUpErr?.message ||
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
    }, [identifier, postAuthRedirect, navigatePostAuth, resolveFinalAuthRedirect, signIn, signUp, signInLoaded, signUpLoaded, setActive]);

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
        } catch (err: any) {
            console.error("[Auth] Verification error:", err);
            const errMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "";

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
    }, [code, identifier, isNewUser, postAuthRedirect, navigatePostAuth, resolveFinalAuthRedirect, signIn, signUp, signInLoaded, signUpLoaded, setActive]);

    // ── Step 2b: Verify OTP (Phone - MSG91 → Clerk sign-in token) ──
    const handlePhoneOTPSubmit = useCallback(async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError("");

        const phone = formatPhoneForAPI(identifier.trim());

        try {
            // Call our backend that verifies MSG91 OTP + creates/finds Clerk user + returns sign-in token
            const res = await fetch("/api/auth/phone-verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp: code.trim() }),
            });
            const data = await res.json();

            if (data.success && data.token) {
                // Use the sign-in token to complete Clerk session
                const result = await signIn!.create({
                    strategy: "ticket",
                    ticket: data.token,
                });

                if (result.status === "complete") {
                    if (result.createdSessionId) {
                        if (posthog) {
                            if (data.isNewUser) {
                                posthog.capture("registration_completed", {
                                    timestamp: new Date().toISOString(),
                                    path: window.location.pathname,
                                });
                            } else {
                                posthog.capture("login_completed", {
                                    timestamp: new Date().toISOString(),
                                    path: window.location.pathname,
                                });
                            }
                        }
                        const target = resolveFinalAuthRedirect();
                        console.log("[AUTH-REDIRECT] phone-verify complete, navigating to:", target);
                        await setActive!({ session: result.createdSessionId });
                        navigatePostAuth(target, data.isNewUser);
                        return;
                    }
                    setIsNewUser(data.isNewUser);
                    setStep("complete");
                    setTimeout(() => navigatePostAuth(getPostLoginFallbackPath(postAuthRedirect), data.isNewUser), 300);
                }
            } else {
                setError(data.error || "Verification failed. Please try again.");
            }
        } catch (err: any) {
            setError("Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [code, identifier, postAuthRedirect, navigatePostAuth, resolveFinalAuthRedirect, signIn, setActive]);

    // ── Google OAuth ──
    const handleGoogleAuth = useCallback(async () => {
        if (!signInLoaded) return;
        if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
        try {
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: redirectTarget,
            });
        } catch {
            setError("Google sign-in failed. Please try again.");
        }
    }, [redirectTarget, signIn, signInLoaded]);

    // ── LinkedIn OAuth ──
    const handleLinkedInAuth = useCallback(async () => {
        if (!signInLoaded) return;
        if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
        try {
            await signIn!.authenticateWithRedirect({
                strategy: "oauth_linkedin_oidc",
                redirectUrl: "/auth/sso-callback",
                redirectUrlComplete: redirectTarget,
            });
        } catch {
            setError("LinkedIn sign-in failed. Please try again.");
        }
    }, [redirectTarget, signIn, signInLoaded]);

    // ── Resend OTP ──
    const handleResend = useCallback(async () => {
        setError("");
        setInfo("");

        if (step === "otp-phone") {
            // Resend via MSG91
            const phone = formatPhoneForAPI(identifier.trim());
            try {
                const res = await fetch("/api/otp/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone }),
                });
                const data = await res.json();
                if (data.success) {
                    setInfo("A new code has been sent.");
                } else {
                    setError("Failed to resend code.");
                }
            } catch {
                setError("Failed to resend code.");
            }
        } else {
            // Resend via Clerk
            try {
                if (isNewUser) {
                    await signUp!.prepareEmailAddressVerification({
                        strategy: "email_code",
                    });
                } else {
                    const emailFactor = (signIn!.supportedFirstFactors as any[])?.find(
                        (f) => f.strategy === "email_code"
                    );
                    await signIn!.prepareFirstFactor({
                        strategy: "email_code",
                        emailAddressId: emailFactor?.emailAddressId,
                    });
                }
                setInfo("A new code has been sent.");
            } catch {
                setError("Failed to resend code.");
            }
        }
    }, [step, identifier, isNewUser, signIn, signUp]);

    // ── Go back ──
    const handleBack = () => {
        setStep("identifier");
        setCode("");
        setError("");
        setInfo("");
        setIsNewUser(false);
    };

    const isOTPStep = step === "otp-signin" || step === "otp-signup" || step === "otp-phone";

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

                                {/* Email / Phone Input */}
                                <div className="space-y-1.5 mb-4">
                                    <label className="text-[13px] font-medium text-zinc-600">
                                        Email or phone number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => {
                                                setIdentifier(e.target.value);
                                                setError("");
                                            }}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && handleSubmit()
                                            }
                                            placeholder="Enter email ID or mobile number"
                                            className="w-full h-11 px-4 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                            autoFocus
                                        />
                                        {/* Input type indicator */}
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {inputMode === "phone" ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                                </svg>
                                            ) : identifier.trim() ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                                                </svg>
                                            ) : null}
                                        </div>
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
                                            className={`p-3 rounded-xl text-sm mb-4 ${isNewUser || step === "otp-phone"
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
                                            {step === "otp-phone"
                                                ? formatPhoneForAPI(identifier.trim())
                                                : identifier}
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
                                            e.key === "Enter" &&
                                            (step === "otp-phone"
                                                ? handlePhoneOTPSubmit()
                                                : handleEmailOTPSubmit())
                                        }
                                        placeholder={step === "otp-phone" ? "Enter 4-digit code" : "Enter 6-digit code"}
                                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 text-center tracking-[0.5em] font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                        autoFocus
                                        maxLength={step === "otp-phone" ? 4 : 6}
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
                                    onClick={
                                        step === "otp-phone"
                                            ? handlePhoneOTPSubmit
                                            : handleEmailOTPSubmit
                                    }
                                    disabled={
                                        loading ||
                                        code.length < (step === "otp-phone" ? 4 : 6)
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
