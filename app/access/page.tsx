"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { usePostHog } from "@posthog/react";

type Status = "loading" | "verifying" | "redirecting" | "signing-in" | "error";

function AccessContent() {
    const posthog = usePostHog();
    const { signIn, setActive } = useSignIn();
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState<string | null>(null);
    const attempted = useRef(false);

    useEffect(() => {
        if (!isLoaded) return;

        // Already signed in → go to dashboard
        if (isSignedIn) {
            router.push("/dashboard");
            return;
        }

        // Prevent double-execution in React strict mode
        if (attempted.current) return;
        attempted.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setError("Invalid access link — no token found.");
            return;
        }

        const authenticate = async () => {
            try {
                // Step 1: Verify token server-side
                setStatus("verifying");
                const verifyRes = await fetch(
                    `/api/auth/access-verify?token=${encodeURIComponent(token)}`
                );

                if (!verifyRes.ok) {
                    const data = await verifyRes.json().catch(() => ({}));
                    throw new Error(
                        data.error || `Verification failed (${verifyRes.status})`
                    );
                }

                const data = await verifyRes.json();

                if (!data.userId) {
                    throw new Error("No user found for this token");
                }

                // ── CRM-Invite Fast Path: Auto-login ──────────────────
                if (data.isCrmInvite && data.ticket && signIn) {
                    setStatus("signing-in");

                    const result = await signIn.create({
                        strategy: "ticket",
                        ticket: data.ticket,
                    });

                    if (result.status === "complete" && result.createdSessionId) {
                        await setActive({ session: result.createdSessionId });
                        if (posthog) {
                            posthog.capture("login_completed", {
                                timestamp: new Date().toISOString(),
                                path: window.location.pathname,
                                source: "crm_invite",
                            });
                        }

                        // Force a full navigation to get fresh server state
                        setTimeout(() => {
                            window.location.replace(`/dashboard?reload=${Date.now()}`);
                        }, 300);
                        return;
                    } else {
                        throw new Error("Sign-in could not be completed");
                    }
                }

                // ── Standard Path: Redirect to OTP verification ───────
                setStatus("redirecting");
                const params = new URLSearchParams();
                params.set("userId", String(data.userId));
                if (data.email) params.set("email", data.email);
                if (data.firstName) params.set("name", data.firstName);
                if (data.phone) {
                    // Mask phone for display: show last 4 digits only
                    const cleanPhone = data.phone.replace(/[^0-9]/g, "");
                    const masked =
                        "•".repeat(Math.max(0, cleanPhone.length - 4)) +
                        cleanPhone.slice(-4);
                    params.set("maskedPhone", masked);
                    params.set("phone", cleanPhone);
                }

                router.push(`/verify-access?${params.toString()}`);
            } catch (err: any) {
                console.error("[ACCESS]", err);

                const msg = err?.errors?.[0]?.message || err?.message || "";

                // Handle "already signed in" edge case
                if (msg.toLowerCase().includes("already signed in")) {
                    router.push("/dashboard");
                    return;
                }

                setStatus("error");
                setError(msg || "Failed to sign in. Please contact support.");
            }
        };

        authenticate();
    }, [isLoaded, isSignedIn, router, searchParams]);

    // ── Error State ──
    if (status === "error") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-red-100">
                    <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <svg
                            className="w-7 h-7 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        Access Link Issue
                    </h1>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        {error}
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                        This link may have expired or already been used. Please
                        contact your account manager for a new access link.
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

    // ── Loading / Progress States ──
    const statusMessages: Record<Exclude<Status, "error">, string> = {
        loading: "Preparing your access...",
        verifying: "Verifying your access link...",
        redirecting: "Preparing identity verification...",
        "signing-in": "Signing you in...",
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mx-auto mb-5" />
                <p className="text-sm text-zinc-600 font-semibold mb-1">
                    {statusMessages[status]}
                </p>
                <p className="text-xs text-zinc-400">
                    Please don&apos;t close this tab
                </p>
            </div>
        </div>
    );
}

export default function AccessPage() {
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
            <AccessContent />
        </Suspense>
    );
}
