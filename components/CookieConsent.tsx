"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConsentWindow = Window & {
    dataLayer?: Array<Record<string, string>>;
};

/**
 * Returns the current consent status from localStorage.
 * "accepted" | "rejected" | null
 */
export function getConsentStatus(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cookie_consent");
}

/**
 * Sets a cookie with the given name, value, and expiry in days.
 */
function setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Dynamically inject the Google AdSense script.
 * Call this only after consent is granted.
 */
export function loadAdSenseScript(publisherId?: string) {
    if (!publisherId) return;
    if (document.querySelector(`script[src*="adsbygoogle"]`)) return; // already loaded

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("cookie_consent");
        if (!consent) {
            // Small delay so it doesn't flash on page load
            const timer = setTimeout(() => {
                setVisible(true);
                // Trigger slide-up animation after mount
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => setAnimateIn(true));
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    function handleAccept() {
        localStorage.setItem("cookie_consent", "accepted");
        setCookie("cookie_consent", "accepted", 365);
        dismiss();

        // Fire GTM consent update so tags can fire
        if (typeof window !== "undefined" && (window as ConsentWindow).dataLayer) {
            (window as ConsentWindow).dataLayer?.push({
                event: "cookie_consent_update",
                cookie_consent: "accepted",
            });
        }
    }

    function handleReject() {
        localStorage.setItem("cookie_consent", "rejected");
        setCookie("cookie_consent", "rejected", 365);
        dismiss();

        if (typeof window !== "undefined" && (window as ConsentWindow).dataLayer) {
            (window as ConsentWindow).dataLayer?.push({
                event: "cookie_consent_update",
                cookie_consent: "rejected",
            });
        }
    }

    function dismiss() {
        setAnimateIn(false);
        // Wait for animation to finish before removing from DOM
        setTimeout(() => setVisible(false), 350);
    }

    if (!visible) return null;

    return (
        <div
            id="cookie-consent-banner"
            role="dialog"
            aria-label="Cookie consent"
            className="fixed inset-x-0 bottom-0 z-[9999]"
            style={{
                transform: animateIn ? "translateY(0)" : "translateY(100%)",
                opacity: animateIn ? 1 : 0,
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
            }}
        >
            <div className="border-t border-zinc-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-4 md:py-4">
                    {/* Cookie icon + text */}
                    <div className="min-w-0 flex-1">
                        <p className="m-0 text-xs leading-5 text-zinc-700 sm:text-sm sm:leading-6">
                            We use cookies to improve your experience, serve personalised ads, and analyse traffic. By
                            clicking &lsquo;Accept All&rsquo;, you consent to our use of cookies.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-2 md:flex md:flex-shrink-0 md:flex-wrap md:gap-2.5">
                        {/* Accept All */}
                        <button
                            id="cookie-accept-all"
                            onClick={handleAccept}
                            className="h-10 rounded-lg border-0 bg-teal-700 px-4 text-xs font-bold tracking-[0.02em] text-white transition hover:-translate-y-px hover:bg-teal-800 sm:text-sm md:px-5"
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.background = "#0f766e";
                                (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.background = "#0d9488";
                                (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                            }}
                        >
                            Accept All
                        </button>

                        {/* Reject Non-Essential */}
                        <button
                            id="cookie-reject-nonessential"
                            onClick={handleReject}
                            className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-xs font-semibold tracking-[0.01em] text-zinc-700 transition hover:-translate-y-px hover:border-zinc-400 hover:bg-zinc-50 sm:text-sm md:px-5"
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.background = "#f9fafb";
                                (e.target as HTMLButtonElement).style.borderColor = "#9ca3af";
                                (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.background = "#ffffff";
                                (e.target as HTMLButtonElement).style.borderColor = "#d1d5db";
                                (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                            }}
                        >
                            Reject Non-Essential
                        </button>

                        {/* Cookie Settings */}
                        <Link
                            id="cookie-settings-link"
                            href="/cookies"
                            className="col-span-2 inline-flex h-9 items-center justify-center rounded-lg border border-transparent px-4 text-xs font-semibold tracking-[0.01em] text-zinc-500 no-underline transition hover:bg-zinc-100 hover:text-zinc-950 sm:text-sm md:col-span-1 md:h-10 md:px-5"
                            onMouseEnter={(e) => {
                                (e.target as HTMLAnchorElement).style.color = "#111827";
                                (e.target as HTMLAnchorElement).style.background = "#f3f4f6";
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLAnchorElement).style.color = "#6b7280";
                                (e.target as HTMLAnchorElement).style.background = "transparent";
                            }}
                        >
                            Cookie Settings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
