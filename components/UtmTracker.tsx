"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function UtmTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!searchParams) return;

        const utmSource = searchParams.get("utm_source");
        const utmMedium = searchParams.get("utm_medium");
        const utmCampaign = searchParams.get("utm_campaign");
        const utmTerm = searchParams.get("utm_term");
        const utmContent = searchParams.get("utm_content");

        let utmsUpdated = false;

        if (utmSource) {
            localStorage.setItem("utm_source", utmSource);
            utmsUpdated = true;
        }
        if (utmMedium) {
            localStorage.setItem("utm_medium", utmMedium);
            utmsUpdated = true;
        }
        if (utmCampaign) {
            localStorage.setItem("utm_campaign", utmCampaign);
            utmsUpdated = true;
        }
        if (utmTerm) {
            localStorage.setItem("utm_term", utmTerm);
            utmsUpdated = true;
        }
        if (utmContent) {
            localStorage.setItem("utm_content", utmContent);
            utmsUpdated = true;
        }

        // Optional: Save timestamp of when UTMs were captured
        if (utmsUpdated) {
            localStorage.setItem("utm_timestamp", new Date().toISOString());
        }
    }, [searchParams]);

    return null; // Silent component
}
