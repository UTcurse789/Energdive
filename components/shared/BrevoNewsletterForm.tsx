"use client";

import { useEffect, useRef } from "react";

type Confetti = (
    idOrOptions: string | Record<string, unknown>,
    options?: Record<string, unknown>
) => void;

declare global {
    interface Window {
        confetti?: Confetti;
        __energdiveConfettiPromise?: Promise<Confetti | null>;
    }
}

async function fireSubscriptionConfetti() {
    if (!window.__energdiveConfettiPromise) {
        window.__energdiveConfettiPromise = new Promise((resolve) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-energdive-confetti="true"]');
            if (existing) {
                existing.addEventListener("load", () => resolve(window.confetti ?? null), { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@tsparticles/confetti@4.2.1/tsparticles.confetti.bundle.min.js";
            script.async = true;
            script.dataset.energdiveConfetti = "true";
            script.onload = () => resolve(window.confetti ?? null);
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        });
    }

    const confetti = window.confetti ?? await window.__energdiveConfettiPromise;
    if (!confetti) return;

    confetti({
        particleCount: 120,
        spread: 75,
        startVelocity: 42,
        origin: { y: 0.65 },
        colors: ["#00A651", "#00C853", "#ffffff", "#f4c430"],
    });
}

/**
 * Shared Brevo embedded newsletter form.
 *
 * Renders the Brevo form for GDPR-compliant email capture, and fires a
 * background request to /api/subscribe so the email is also persisted
 * to the database.
 *
 * @param variant  "dark" (dark background, e.g. footer / article CTA) or
 *                 "light" (white background, e.g. sidebar / newsletter page).
 * @param source   Value sent as `source` to /api/subscribe for analytics.
 * @param formId   Unique suffix so multiple Brevo forms on the same page
 *                 don't clash on DOM ids. Defaults to "default".
 */
export function BrevoNewsletterForm({
    variant = "dark",
    source = "Brevo Form",
    formId = "default",
}: {
    variant?: "dark" | "light";
    source?: string;
    formId?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastEmailRef = useRef<string>("");

    const isDark = variant === "dark";

    // Scoped IDs to avoid DOM clashes when multiple forms exist on a page
    const emailId = `EMAIL-${formId}`;
    const sibFormId = `sib-form-${formId}`;
    const sibContainerId = `sib-container-${formId}`;
    const successId = `success-message-${formId}`;
    const errorId = `error-message-${formId}`;

    useEffect(() => {
        // Load Brevo form styles (once)
        if (!document.querySelector('link[href*="sibforms.com"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://sibforms.com/forms/end-form/build/sib-styles.css";
            document.head.appendChild(link);
        }

        // Set Brevo globals
        const w = window as unknown as Record<string, unknown>;
        w.REQUIRED_CODE_ERROR_MESSAGE = "Please choose a country code";
        w.LOCALE = "en";
        w.EMAIL_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
        w.REQUIRED_ERROR_MESSAGE = "This field cannot be left blank. ";
        w.GENERIC_INVALID_MESSAGE = "The information provided is invalid. Please review the field format and try again.";
        w.INVALID_NUMBER = "The information provided is invalid. Please review the field format and try again.";
        w.INVALID_DATE = "Please enter a valid date";
        w.REQUIRED_MULTISELECT_MESSAGE = "Please select at least 1 option";
        w.translation = {
            common: {
                selectedList: "{quantity} list selected",
                selectedLists: "{quantity} lists selected",
                selectedOption: "{quantity} selected",
                selectedOptions: "{quantity} selected",
            },
        };
        w.AUTOHIDE = false;

        // Load Brevo main script (once)
        if (!document.querySelector('script[src*="sibforms.com"]')) {
            const script = document.createElement("script");
            script.src = "https://sibforms.com/forms/end-form/build/main.js";
            script.defer = true;
            document.body.appendChild(script);
        }

        const container = containerRef.current;
        if (!container) return;

        // Capture email on submit
        const captureEmail = async (event: Event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            const emailInput = container.querySelector<HTMLInputElement>(`#${emailId}`);
            const email = emailInput?.value.trim().toLowerCase();
            if (!email) return;

            lastEmailRef.current = email;
            const nativeForm = event.currentTarget as HTMLFormElement;
            const submitButton = nativeForm.querySelector<HTMLButtonElement>('button[type="submit"]');
            const errorPanel = container.querySelector<HTMLElement>(`#${errorId}`);
            const successPanel = container.querySelector<HTMLElement>(`#${successId}`);
            submitButton?.setAttribute("disabled", "true");
            if (errorPanel) errorPanel.style.display = "none";

            try {
                const response = await fetch("/api/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        frequency: "Daily x1",
                        preferences: ["News Briefing"],
                        communities: [],
                        subCommunities: [],
                        source,
                        subscribedFromUrl: window.location.href,
                        subscribedFromTitle: document.title,
                    }),
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || result.success === false) throw new Error("Brevo subscription failed");

                lastEmailRef.current = "";
                nativeForm.style.display = "none";
                if (successPanel) successPanel.style.display = "block";
                void fireSubscriptionConfetti();
            } catch {
                if (errorPanel) errorPanel.style.display = "block";
                submitButton?.removeAttribute("disabled");
            }
        };

        const form = container.querySelector(`#${sibFormId}`);
        if (form) {
            form.addEventListener("submit", captureEmail);
        }

        // Watch for Brevo success message → also save to our DB
        const observer = new MutationObserver(() => {
            const successPanel = container.querySelector(`#${successId}`);
            if (successPanel && getComputedStyle(successPanel).display !== "none") {
                const email = lastEmailRef.current;
                if (email) {
                    fetch("/api/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email,
                            frequency: "Daily x1",
                            preferences: ["News Briefing"],
                            communities: [],
                            subCommunities: [],
                            source,
                            subscribedFromUrl: window.location.href,
                            subscribedFromTitle: document.title,
                        }),
                    }).catch(() => {
                        // Silently ignore — Brevo already handled the subscription
                    });
                    lastEmailRef.current = "";
                }
            }
        });

        observer.observe(container, { subtree: true, attributes: true, attributeFilter: ["style", "class"] });

        return () => {
            observer.disconnect();
            if (form) {
                form.removeEventListener("submit", captureEmail);
            }
        };
    }, [emailId, sibFormId, successId, source]);

    const wrapperClass = isDark ? "brevo-form-dark" : "brevo-form-light";

    return (
        <>
            <style jsx global>{`
                /* ─── Dark variant (footer, article CTA) ─── */
                .brevo-form-dark .sib-form {
                    background-color: transparent !important;
                }
                .brevo-form-dark .sib-container--large {
                    max-width: 100% !important;
                    background-color: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                }
                .brevo-form-dark .sib-form-block p,
                .brevo-form-dark .sib-text-form-block p,
                .brevo-form-dark .entry__label,
                .brevo-form-dark .entry__specification {
                    display: none !important;
                }
                .brevo-form-dark .sib-form input.input {
                    width: 100% !important;
                    background-color: rgba(255,255,255,0.04) !important;
                    color: #000 !important;
                    border: 1px solid rgba(255,255,255,0.06) !important;
                    border-radius: 8px !important;
                    padding: 10px 16px !important;
                    font-size: 13px !important;
                    font-family: inherit !important;
                    outline: none !important;
                    box-sizing: border-box !important;
                }
                .brevo-form-dark .sib-form input.input::placeholder {
                    color: #6b7280 !important;
                }
                .brevo-form-dark .sib-form input.input:focus {
                    border-color: #00A651 !important;
                }
                .brevo-form-dark .sib-form-block__button {
                    width: 100% !important;
                    background-color: #00A651 !important;
                    color: #fff !important;
                    font-weight: 700 !important;
                    font-size: 13px !important;
                    padding: 10px 0 !important;
                    border-radius: 8px !important;
                    border: none !important;
                    cursor: pointer !important;
                    font-family: inherit !important;
                    text-align: center !important;
                    transition: background-color 0.2s !important;
                }
                .brevo-form-dark .sib-form-block__button:hover {
                    background-color: #008F46 !important;
                }
                .brevo-form-dark .sib-form-message-panel {
                    max-width: 100% !important;
                    border-radius: 8px !important;
                    font-size: 12px !important;
                }
                .brevo-form-dark .input--hidden {
                    display: none !important;
                }

                /* ─── Light variant (sidebar, newsletter page) ─── */
                .brevo-form-light .sib-form {
                    background-color: transparent !important;
                }
                .brevo-form-light .sib-container--large {
                    max-width: 100% !important;
                    background-color: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                }
                .brevo-form-light .sib-form-block p,
                .brevo-form-light .sib-text-form-block p,
                .brevo-form-light .entry__label,
                .brevo-form-light .entry__specification {
                    display: none !important;
                }
                .brevo-form-light .sib-form input.input {
                    width: 100% !important;
                    background-color: #f8fafc !important;
                    color: #0f172a !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 12px !important;
                    padding: 14px 16px !important;
                    font-size: 14px !important;
                    font-family: inherit !important;
                    outline: none !important;
                    box-sizing: border-box !important;
                }
                .brevo-form-light .sib-form input.input::placeholder {
                    color: #94a3b8 !important;
                }
                .brevo-form-light .sib-form input.input:focus {
                    border-color: #00C853 !important;
                    background-color: #fff !important;
                    box-shadow: 0 0 0 2px rgba(0,200,83,0.15) !important;
                }
                .brevo-form-light .sib-form-block__button {
                    width: 100% !important;
                    background-color: #00C853 !important;
                    color: #fff !important;
                    font-weight: 700 !important;
                    font-size: 14px !important;
                    padding: 14px 0 !important;
                    border-radius: 12px !important;
                    border: none !important;
                    cursor: pointer !important;
                    font-family: inherit !important;
                    text-align: center !important;
                    transition: background-color 0.2s !important;
                }
                .brevo-form-light .sib-form-block__button:hover {
                    background-color: #00b347 !important;
                }
                .brevo-form-light .sib-form-message-panel {
                    max-width: 100% !important;
                    border-radius: 12px !important;
                    font-size: 13px !important;
                }
                .brevo-form-light .input--hidden {
                    display: none !important;
                }
            `}</style>
            <div ref={containerRef} className={wrapperClass}>
                <div className="sib-form" style={{ textAlign: "center", backgroundColor: "transparent" }}>
                    <div className="sib-form-container">
                        {/* Error panel */}
                        <div
                            id={errorId}
                            className="sib-form-message-panel"
                            style={{
                                fontFamily: "Helvetica, sans-serif",
                                fontSize: "12px",
                                textAlign: "left",
                                color: isDark ? "#ff6b6b" : "#dc2626",
                                backgroundColor: isDark ? "rgba(255,77,77,0.1)" : "#fef2f2",
                                borderColor: isDark ? "#ff4949" : "#fca5a5",
                                borderRadius: isDark ? "8px" : "12px",
                                maxWidth: "100%",
                            }}
                        >
                            <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
                                <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon">
                                    <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-11.49 120h22.979c6.823 0 12.274 5.682 11.99 12.5l-7 168c-.268 6.428-5.556 11.5-11.99 11.5h-8.979c-6.433 0-11.722-5.073-11.99-11.5l-7-168c-.283-6.818 5.167-12.5 11.99-12.5zM256 340c-15.464 0-28 12.536-28 28s12.536 28 28 28 28-12.536 28-28-12.536-28-28-28z" />
                                </svg>
                                <span className="sib-form-message-panel__inner-text">
                                    Your subscription could not be saved. Please try again.
                                </span>
                            </div>
                        </div>
                        <div></div>
                        {/* Success panel */}
                        <div
                            id={successId}
                            className="sib-form-message-panel"
                            style={{
                                fontFamily: "Helvetica, sans-serif",
                                fontSize: "12px",
                                textAlign: "left",
                                color: isDark ? "#00A651" : "#15803d",
                                backgroundColor: isDark ? "rgba(0,166,81,0.1)" : "#f0fdf4",
                                borderColor: isDark ? "#00A651" : "#86efac",
                                borderRadius: isDark ? "8px" : "12px",
                                maxWidth: "100%",
                            }}
                        >
                            <div className="sib-form-message-panel__text sib-form-message-panel__text--center">
                                <svg viewBox="0 0 512 512" className="sib-icon sib-notification__icon">
                                    <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 464c-118.664 0-216-96.055-216-216 0-118.663 96.055-216 216-216 118.664 0 216 96.055 216 216 0 118.663-96.055 216-216 216zm141.63-274.961L217.15 376.071c-4.705 4.667-12.303 4.637-16.97-.068l-85.878-86.572c-4.667-4.705-4.637-12.303.068-16.97l8.52-8.451c4.705-4.667 12.303-4.637 16.97.068l68.976 69.533 163.441-162.13c4.705-4.667 12.303-4.637 16.97.068l8.451 8.52c4.668 4.705 4.637 12.303-.068 16.97z" />
                                </svg>
                                <span className="sib-form-message-panel__inner-text">
                                    Your subscription has been successful.
                                </span>
                            </div>
                        </div>
                        <div></div>
                        {/* Form */}
                        <div
                            id={sibContainerId}
                            className="sib-container--large sib-container--vertical"
                            style={{
                                maxWidth: "100%",
                                textAlign: "center",
                                backgroundColor: "transparent",
                                borderWidth: 0,
                                direction: "ltr" as const,
                            }}
                        >
                            <form
                                id={sibFormId}
                                method="POST"
                                action="https://63d65877.sibforms.com/serve/MUIFABw5eHxm0qfUed3anLPs18I3KPCKQLm2Tx9QEcsVf2lPxuiW3ytqDoG8f3hiLzdNCFE8MfC3LKWck9lc_ke-KhiowPkh1qlDcpghr92v-X9aK7VYBtPmc8ndVl9kgEnOwFRelgeJSnQFvSY4IbQE4lRFoQ6BEpOkhzPs4NmWyYgivRp8G3D_hBNlBE7r8mg2e_KMrGurT5TH_A=="
                                data-type="subscription"
                            >
                                <div style={{ padding: "4px 0" }}>
                                    <div className="sib-input sib-form-block">
                                        <div className="form__entry entry_block">
                                            <div className="form__label-row">
                                                <div className="entry__field">
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        id={emailId}
                                                        name="EMAIL"
                                                        autoComplete="off"
                                                        placeholder={isDark ? "Enter your email" : "you@company.com"}
                                                        data-required="true"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <label
                                                className="entry__error entry__error--primary"
                                                style={{
                                                    fontFamily: "Helvetica, sans-serif",
                                                    fontSize: "11px",
                                                    textAlign: "left",
                                                    color: isDark ? "#ff6b6b" : "#dc2626",
                                                    backgroundColor: isDark ? "rgba(255,77,77,0.1)" : "#fef2f2",
                                                    borderColor: isDark ? "#ff4949" : "#fca5a5",
                                                    borderRadius: "6px",
                                                }}
                                            >
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: "4px 0" }}>
                                    <div className="sib-form-block" style={{ textAlign: "left" }}>
                                        <button
                                            className="sib-form-block__button sib-form-block__button-with-loader"
                                            style={{
                                                fontFamily: "inherit",
                                                fontSize: isDark ? "13px" : "14px",
                                                fontWeight: 700,
                                                textAlign: "center",
                                                color: "#FFFFFF",
                                                backgroundColor: isDark ? "#00A651" : "#00C853",
                                                borderWidth: 0,
                                                borderRadius: isDark ? "8px" : "12px",
                                            }}
                                            form={sibFormId}
                                            type="submit"
                                        >
                                            <svg
                                                className="icon clickable__icon progress-indicator__icon sib-hide-loader-icon"
                                                viewBox="0 0 512 512"
                                            >
                                                <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
                                            </svg>
                                            SUBSCRIBE
                                        </button>
                                    </div>
                                </div>
                                <input type="text" name="email_address_check" value="" readOnly className="input--hidden" />
                                <input type="hidden" name="locale" value="en" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
