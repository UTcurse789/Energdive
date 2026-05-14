"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== "undefined") {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST as string,
                capture_pageview: false // Capture custom pageviews if needed
            });
        }
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
