"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "@posthog/react";

type Status = "loading" | "verifying" | "signing-in" | "redirecting" | "error";

function MembershipAccessContent() {
    const posthog = usePostHog();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, setActive } = useSignIn();
    const { isLoaded, isSignedIn } = useAuth();
    const attempted = useRef(false);

    const [status, setStatus] = useState<Status>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !signIn) {
            return;
        }

        if (isSignedIn) {
            router.replace("/dashboard");
            return;
        }

        if (attempted.current) {
            return;
        }
        attempted.current = true;

        const token = searchParams.get("token");
        if (!token) {
            setStatus("error");
            setError("The membership access link is incomplete.");
            return;
        }

        const authenticate = async () => {
            try {
                setStatus("verifying");
                const verifyRes = await fetch(
                    `/api/auth/membership-access?token=${encodeURIComponent(token)}`
                );
                const data = await verifyRes.json().catch(() => ({}));

                if (!verifyRes.ok) {
                    throw new Error(data.error || `Verification failed (${verifyRes.status})`);
                }

                if (!data.ticket) {
                    throw new Error("No sign-in ticket was returned.");
                }

                setStatus("signing-in");
                const result = await signIn.create({
                    strategy: "ticket",
                    ticket: data.ticket,
                });

                if (result.status !== "complete" || !result.createdSessionId) {
                    throw new Error("The sign-in session could not be created.");
                }

                await setActive({ session: result.createdSessionId });
                if (posthog) {
                    posthog.capture("login_completed", {
                        timestamp: new Date().toISOString(),
                        path: window.location.pathname,
                    });
                }
                setStatus("redirecting");

                setTimeout(() => {
                    window.location.replace(`/dashboard?reload=${Date.now()}`);
                }, 300);
            } catch (err: unknown) {
                console.error("[MEMBERSHIP_ACCESS_PAGE]", err);
                const message =
                    err && typeof err === "object" && "message" in err && typeof err.message === "string"
                        ? err.message
                        : "";

                if (message.toLowerCase().includes("already signed in")) {
                    router.replace("/dashboard");
                    return;
                }

                setStatus("error");
                setError(message || "We could not sign you in with this membership access link.");
            }
        };

        authenticate();
    }, [isLoaded, isSignedIn, posthog, router, searchParams, setActive, signIn]);

    if (status === "error") {
        return (
            <div className="min-h-screen bg-[#faf7f0] px-4 py-12">
                <div className="mx-auto max-w-md rounded-[28px] border border-[#e6d8bf] bg-white p-8 text-center shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff3df] text-[#b47c1e]">
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-2.5L13.73 4.5c-.77-.83-2.69-.83-3.46 0L3.2 16.5c-.77.83.19 2.5 1.73 2.5z" />
                        </svg>
                    </div>
                    <h1 className="mb-2 text-2xl font-semibold text-[#111111]">Membership Access Issue</h1>
                    <p className="mb-4 text-sm leading-6 text-[#5c5548]">{error}</p>
                    <p className="mb-6 text-xs leading-5 text-[#8b8375]">
                        This link may have expired. Use the regular sign-in page or request a fresh membership email.
                    </p>
                    <Link
                        href="/auth"
                        onClick={() => {
                            if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
                        }}
                        className="inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-[#f1c46f] transition-colors hover:bg-[#1d1d1d]"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const statusMessages: Record<Exclude<Status, "error">, string> = {
        loading: "Loading your membership access...",
        verifying: "Validating your card link...",
        "signing-in": "Signing you in securely...",
        redirecting: "Opening your dashboard...",
    };

    return (
        <div className="min-h-screen bg-[#faf7f0] px-4 py-12">
            <div className="mx-auto max-w-md rounded-[28px] border border-[#e6d8bf] bg-white p-8 text-center shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
                <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#f4dfb5] border-t-[#c68d2b]" />
                <p className="text-sm font-semibold text-[#111111]">{statusMessages[status]}</p>
                <p className="mt-2 text-xs text-[#8b8375]">Please keep this tab open for a moment.</p>
            </div>
        </div>
    );
}

export default function MembershipAccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#faf7f0] px-4 py-12">
                    <div className="mx-auto max-w-md rounded-[28px] border border-[#e6d8bf] bg-white p-8 text-center shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
                        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#f4dfb5] border-t-[#c68d2b]" />
                        <p className="text-sm font-semibold text-[#111111]">Loading your membership access...</p>
                    </div>
                </div>
            }
        >
            <MembershipAccessContent />
        </Suspense>
    );
}
