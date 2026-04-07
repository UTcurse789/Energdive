"use client";

import { useEffect, useState } from "react";

interface ConsentAwareGTMProps {
    gtmId: string;
}

/**
 * Loads GTM only after the user has accepted cookies.
 * Listens for localStorage changes (from the CookieConsent banner)
 * and injects the GTM script + noscript iframe dynamically.
 */
export default function ConsentAwareGTM({ gtmId }: ConsentAwareGTMProps) {
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        // Check immediately on mount
        const consent = localStorage.getItem("cookie_consent");
        if (consent === "accepted") {
            setHasConsent(true);
            return;
        }

        // Listen for storage changes (when CookieConsent sets the value)
        function onStorage(e: StorageEvent) {
            if (e.key === "cookie_consent" && e.newValue === "accepted") {
                setHasConsent(true);
            }
        }

        // Also poll briefly in case the change comes from the same tab
        // (StorageEvent only fires across tabs)
        const interval = setInterval(() => {
            if (localStorage.getItem("cookie_consent") === "accepted") {
                setHasConsent(true);
                clearInterval(interval);
            }
        }, 500);

        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("storage", onStorage);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!hasConsent) return;

        // Prevent duplicate injection
        if (document.querySelector(`script[data-gtm-id="${gtmId}"]`)) return;

        // Initialize dataLayer
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
            "gtm.start": new Date().getTime(),
            event: "gtm.js",
        });

        // Inject GTM script
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
        script.setAttribute("data-gtm-id", gtmId);
        document.head.appendChild(script);

        // Inject noscript iframe
        const noscript = document.createElement("noscript");
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
        iframe.height = "0";
        iframe.width = "0";
        iframe.style.display = "none";
        iframe.style.visibility = "hidden";
        noscript.appendChild(iframe);
        document.body.insertBefore(noscript, document.body.firstChild);
    }, [hasConsent, gtmId]);

    return null;
}
