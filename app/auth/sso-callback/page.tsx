"use client";

import { useClerk, useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import {
    POST_AUTH_REDIRECT_STORAGE_KEY,
    getSafeRedirectFromStoredValue,
} from "@/lib/post-auth-redirect";

/**
 * Ultra-fast SSO callback page.
 * 
 * Approach:
 * 1. Resolve the redirect URL immediately (from sessionStorage)
 * 2. Let Clerk process the OAuth exchange via handleRedirectCallback
 * 3. Redirect immediately once auth is ready — no extra page loads
 */
export default function SSOCallbackPage() {
    const { handleRedirectCallback } = useClerk();
    const { isLoaded, isSignedIn } = useAuth();
    const hasHandled = useRef(false);

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

            // Navigate immediately
            window.location.replace(redirectUrl.current);
        }
    }, [isLoaded, isSignedIn]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            {/* Minimal spinner — no extra DOM, no animations library */}
            <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-[2px] border-zinc-100" />
                <div
                    className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-emerald-500 animate-spin"
                    style={{ animationDuration: "0.8s" }}
                />
            </div>
            <p className="text-sm font-medium text-zinc-600">Signing you in…</p>
        </div>
    );
}
