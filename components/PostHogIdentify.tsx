"use client";

import { useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogIdentify() {
    const { user, isLoaded } = useUser();
    const posthog = usePostHog();

    useEffect(() => {
        if (isLoaded && user && posthog) {
            posthog.identify(user.id, {
                email: user.primaryEmailAddress?.emailAddress,
                name: user.fullName
            });
        }
    }, [user, isLoaded, posthog]);

    return null;
}
