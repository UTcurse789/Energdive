"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import {
    getSafeRedirectFromClient,
    POST_AUTH_REDIRECT_STORAGE_KEY,
    POST_AUTH_REDIRECT_COOKIE,
} from "@/lib/post-auth-redirect";

type WindowWithPostHog = Window & {
    posthog?: {
        capture?: (event: string, properties?: Record<string, unknown>) => void;
    };
};

/**
 * SSO Callback fallback page.
 *
 * In the optimized flow, users never land here — they go directly to the
 * target page via Clerk's `redirectUrlComplete`. This page exists only as
 * a safety net for edge cases (bookmarks, direct navigation, Clerk fallback).
 *
 * If the user does land here:
 * 1. Check if already signed in → redirect immediately
 * 2. If not yet signed in, wait for Clerk to finish processing → then redirect
 * 3. After 5s timeout, redirect anyway (the target page will handle auth state)
 */
export default function SSOCallbackPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const hasRedirected = useRef(false);

    // Resolve redirect URL from sessionStorage/cookie/URL params
    const getTargetUrl = (): string => {
        if (typeof window === "undefined") return "/";
        const res = getSafeRedirectFromClient();
        console.log("[SSO CALLBACK] Resolved target URL:", res, "from search:", window.location.search);
        return res;
    };

    // Navigate immediately — call once only
    const navigateAway = () => {
        if (hasRedirected.current) return;
        hasRedirected.current = true;

        const target = getTargetUrl();
        console.log("[SSO CALLBACK] navigateAway() redirecting to:", target);

        // Fire PostHog event asynchronously (don't block redirect)
        try {
            const posthog = (window as WindowWithPostHog).posthog;
            if (posthog?.capture) {
                posthog.capture("login_completed", {
                    timestamp: new Date().toISOString(),
                    path: "/auth/sso-callback",
                });
            }
        } catch {}

        // Clean up stored redirect
        sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
        document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

        // Navigate immediately — replace so user can't go "back" to callback
        window.location.replace(target);
    };

    useEffect(() => {
        // If auth is loaded and user is signed in, redirect immediately
        if (isLoaded && isSignedIn) {
            navigateAway();
            return;
        }

        // If auth is loaded but NOT signed in, Clerk may still be processing
        // the OAuth exchange. Give it a short timeout, then redirect anyway —
        // the target page's middleware/layout will handle the auth state.
        if (isLoaded && !isSignedIn) {
            const timer = setTimeout(() => {
                console.log("[SSO CALLBACK] Timeout: redirecting to target even though not signed in");
                navigateAway();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, isSignedIn]);

    // Minimal loading UI — just a spinner and nothing else
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* Simple fast spinner */}
                <div className="w-8 h-8 rounded-full border-[2.5px] border-zinc-100 border-t-[#00A651] animate-spin" />
                <p className="text-sm text-zinc-400">Signing you in…</p>
            </div>
        </div>
    );
}
