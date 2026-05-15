"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
        const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        if (typeof window !== "undefined" && projectToken && posthogHost) {
            posthog.init(projectToken, {
                api_host: posthogHost,
                capture_pageview: false,
            });
        }
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
