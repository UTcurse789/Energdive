"use client";

import { useAuth, AuthenticateWithRedirectCallback } from "@clerk/nextjs";
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

        // Navigate immediately — replace so user can't go "back" to callback.
        // We use window.location.replace to force a full hard reload.
        // This is necessary because Next.js App Router aggressively caches the unauthenticated 
        // version of pages during a soft navigation. A hard reload forces the server 
        // to re-evaluate the auth state and fetch fresh data.
        window.location.replace(target);
    };

    useEffect(() => {
        // If auth is loaded and user is signed in, redirect immediately.
        // This triggers after AuthenticateWithRedirectCallback finishes token exchange.
        if (isLoaded && isSignedIn) {
            navigateAway();
            return;
        }
        
        // Removed the 3 second timeout race condition that was causing premature redirects.
    }, [isLoaded, isSignedIn]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* Simple fast spinner */}
                <div className="w-8 h-8 rounded-full border-[2.5px] border-zinc-100 border-t-[#00A651] animate-spin" />
                <p className="text-sm text-zinc-400">Signing you in…</p>
                <AuthenticateWithRedirectCallback />
            </div>
        </div>
    );
}
