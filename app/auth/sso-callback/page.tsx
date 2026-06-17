"use client";

import { useClerk, useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    POST_AUTH_REDIRECT_STORAGE_KEY,
    getSafeRedirectFromStoredValue,
} from "@/lib/post-auth-redirect";

/**
 * Ultra-fast, premium SSO callback page.
 *
 * Approach:
 * 1. Resolve the redirect URL immediately (from sessionStorage)
 * 2. Let Clerk process the OAuth exchange via handleRedirectCallback
 * 3. Redirect immediately once auth is ready — no extra page loads
 * 4. Show a premium branded transition while processing
 */

const STATUS_MESSAGES = [
    "Verifying your credentials…",
    "Preparing your workspace…",
    "Almost there…",
];

export default function SSOCallbackPage() {
    const { handleRedirectCallback } = useClerk();
    const { isLoaded, isSignedIn } = useAuth();
    const hasHandled = useRef(false);
    const [statusIndex, setStatusIndex] = useState(0);

    // Resolve redirect URL once at mount — no state needed
    const redirectUrl = useRef<string>(
        typeof window !== "undefined"
            ? getSafeRedirectFromStoredValue(
                  sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY)
              )
            : "/"
    );

    // Process the OAuth callback as soon as Clerk is loaded
    useEffect(() => {
        if (hasHandled.current) return;
        hasHandled.current = true;

        const processCallback = async () => {
            try {
                await handleRedirectCallback({
                    afterSignInUrl: redirectUrl.current,
                    afterSignUpUrl: redirectUrl.current,
                });
            } catch (err) {
                console.error("[SSO Callback] Error:", err);
                // Fallback: if handleRedirectCallback fails, wait for auth state
            }
        };

        processCallback();
    }, [handleRedirectCallback]);

    // Safety net: if auth completes but handleRedirectCallback didn't navigate
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            // Fire PostHog event asynchronously (don't block redirect)
            try {
                const posthog = (window as any).posthog;
                if (posthog?.capture) {
                    posthog.capture("login_completed", {
                        timestamp: new Date().toISOString(),
                        path: "/auth/sso-callback",
                    });
                }
            } catch {}

            // Clean up stored redirect
            sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);

            // Navigate immediately
            window.location.replace(redirectUrl.current);
        }
    }, [isLoaded, isSignedIn]);

    // Cycle through status messages for visual polish
    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) =>
                prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev
            );
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
            {/* Subtle radial glow background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse 600px 400px at 50% 40%, rgba(0,166,81,0.06) 0%, transparent 70%)",
                }}
            />

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo with pulse */}
                <div className="mb-8 animate-pulse">
                    <Image
                        src="/logo - energclub-energdive.png"
                        alt="Energdive"
                        width={200}
                        height={50}
                        priority
                        className="w-auto h-10 object-contain"
                    />
                </div>

                {/* Progress spinner */}
                <div className="relative w-12 h-12 mb-6">
                    {/* Track */}
                    <div className="absolute inset-0 rounded-full border-[2.5px] border-zinc-100" />
                    {/* Spinning arc */}
                    <div
                        className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-[#00A651] animate-spin"
                        style={{ animationDuration: "0.7s" }}
                    />
                    {/* Inner glow dot */}
                    <div className="absolute inset-[10px] rounded-full bg-[#00A651]/5" />
                </div>

                {/* Status text with crossfade */}
                <div className="h-6 relative flex items-center justify-center">
                    <p
                        key={statusIndex}
                        className="text-sm font-medium text-zinc-500 animate-fade-in-status"
                    >
                        {STATUS_MESSAGES[statusIndex]}
                    </p>
                </div>

                {/* Subtle linear progress bar */}
                <div className="mt-6 w-48 h-[3px] bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{
                            background: "linear-gradient(90deg, #00A651, #0AB996)",
                            animation: "sso-progress 2.5s ease-in-out infinite",
                        }}
                    />
                </div>
            </div>

            {/* Inline keyframes */}
            <style jsx>{`
                @keyframes sso-progress {
                    0% {
                        width: 0%;
                        margin-left: 0%;
                    }
                    50% {
                        width: 70%;
                        margin-left: 15%;
                    }
                    100% {
                        width: 0%;
                        margin-left: 100%;
                    }
                }
                .animate-fade-in-status {
                    animation: fadeInStatus 0.5s ease-out;
                }
                @keyframes fadeInStatus {
                    from {
                        opacity: 0;
                        transform: translateY(4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
