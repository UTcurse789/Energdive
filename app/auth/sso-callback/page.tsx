"use client";

import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { usePostHog } from "@posthog/react";
import { useEffect, useRef, useState } from "react";
import {
    POST_AUTH_REDIRECT_STORAGE_KEY,
    getSafeRedirectFromStoredValue,
} from "@/lib/post-auth-redirect";

export default function SSOCallbackPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const posthog = usePostHog();
    const hasCapturedLogin = useRef(false);
    const [redirectUrl] = useState<string>(() => {
        if (typeof window === "undefined") {
            return "/dashboard";
        }

        return getSafeRedirectFromStoredValue(
            sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY)
        );
    });

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !posthog || hasCapturedLogin.current) {
            return;
        }

        hasCapturedLogin.current = true;
        posthog.capture("login_completed", {
            timestamp: new Date().toISOString(),
            path: window.location.pathname,
        });
    }, [isLoaded, isSignedIn, posthog]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
            {/* Subtle radial gradient backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.06)_0%,transparent_70%)]" />

            {/* Loader card */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Animated spinner ring */}
                <div className="relative w-16 h-16">
                    {/* Outer ring */}
                    <div
                        className="absolute inset-0 rounded-full border-[2.5px] border-zinc-100"
                    />
                    {/* Spinning arc */}
                    <div
                        className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-emerald-500 animate-spin"
                        style={{ animationDuration: "0.9s" }}
                    />
                    {/* Inner dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                {/* Text */}
                <div className="text-center space-y-1.5">
                    <p className="text-[15px] font-semibold text-zinc-800 tracking-tight">
                        Signing you in…
                    </p>
                    <p className="text-[13px] text-zinc-400">
                        Please wait while we verify your credentials
                    </p>
                </div>
            </div>

            {/* Security badge */}
            <div className="absolute bottom-8 flex items-center gap-2 z-10">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-semibold">
                    Encrypted &amp; Secure
                </span>
            </div>

            {/* Hidden Clerk callback handler */}
            <div className="sr-only">
                <AuthenticateWithRedirectCallback
                    signInForceRedirectUrl={redirectUrl}
                    signUpForceRedirectUrl={redirectUrl}
                />
            </div>
        </div>
    );
}
