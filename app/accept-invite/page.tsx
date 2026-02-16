"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";

function AcceptInviteContent() {
    const { signIn, setActive } = useSignIn();
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Wait for Clerk to fully load before doing anything
        if (!isLoaded) return;

        // If already signed in, go straight to dashboard
        if (isSignedIn) {
            router.push("/dashboard");
            return;
        }

        const ticket = searchParams.get("ticket");

        if (!ticket) {
            setError("Invalid invite link — no ticket found.");
            return;
        }

        if (!signIn) return; // Clerk signIn not ready yet

        const consumeTicket = async () => {
            try {
                const result = await signIn.create({
                    strategy: "ticket",
                    ticket,
                });

                if (result.status === "complete" && result.createdSessionId) {
                    await setActive({ session: result.createdSessionId });
                    router.push("/dashboard");
                } else {
                    setError("Sign-in could not be completed.");
                }
            } catch (err: any) {
                console.error("[ACCEPT_INVITE]", err);
                const msg = err?.errors?.[0]?.message || err?.message || "";
                if (msg.toLowerCase().includes("already signed in")) {
                    router.push("/dashboard");
                    return;
                }
                setError(msg || "Failed to sign in.");
            }
        };

        consumeTicket();
    }, [isLoaded, isSignedIn, signIn, setActive, router, searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center border border-red-100">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <a
                        href="/sign-in"
                        className="inline-block bg-[#0AB996] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#099e82] transition-colors"
                    >
                        Go to Sign In
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
            <div className="w-8 h-8 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-500 font-medium animate-pulse">
                Signing you in...
            </p>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA]">
                <div className="w-8 h-8 border-4 border-[#0AB996]/30 border-t-[#0AB996] rounded-full animate-spin mb-4" />
                <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading...</p>
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}
