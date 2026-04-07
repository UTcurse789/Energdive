"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: "cookie_consent_update",
                cookie_consent: "accepted",
            });
        }
    }

    function handleReject() {
        localStorage.setItem("cookie_consent", "rejected");
        setCookie("cookie_consent", "rejected", 365);
        dismiss();

        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
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
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                transform: animateIn ? "translateY(0)" : "translateY(100%)",
                opacity: animateIn ? 1 : 0,
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
            }}
        >
            <div
                style={{
                    background: "#ffffff",
                    borderTop: "1px solid #e5e7eb",
                    boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.08)",
                }}
            >
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        padding: "20px 24px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    {/* Cookie icon + text */}
                    <div style={{ flex: "1 1 400px", minWidth: 0 }}>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 14,
                                lineHeight: 1.6,
                                color: "#374151",
                                fontFamily: "var(--font-sans), system-ui, sans-serif",
                            }}
                        >
                            We use cookies to improve your experience, serve personalised ads, and analyse traffic. By
                            clicking &lsquo;Accept All&rsquo;, you consent to our use of cookies.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            flexShrink: 0,
                        }}
                    >
                        {/* Accept All */}
                        <button
                            id="cookie-accept-all"
                            onClick={handleAccept}
                            style={{
                                padding: "10px 22px",
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#ffffff",
                                background: "#0d9488",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                letterSpacing: "0.02em",
                                transition: "background 0.2s ease, transform 0.15s ease",
                                fontFamily: "var(--font-sans), system-ui, sans-serif",
                            }}
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
                            style={{
                                padding: "10px 22px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#374151",
                                background: "#ffffff",
                                border: "1px solid #d1d5db",
                                borderRadius: 8,
                                cursor: "pointer",
                                letterSpacing: "0.01em",
                                transition: "background 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
                                fontFamily: "var(--font-sans), system-ui, sans-serif",
                            }}
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
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "10px 22px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#6b7280",
                                background: "transparent",
                                border: "1px solid transparent",
                                borderRadius: 8,
                                cursor: "pointer",
                                letterSpacing: "0.01em",
                                textDecoration: "none",
                                transition: "color 0.2s ease, background 0.2s ease",
                                fontFamily: "var(--font-sans), system-ui, sans-serif",
                            }}
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
