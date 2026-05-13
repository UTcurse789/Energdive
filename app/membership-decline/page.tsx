"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function DeclineContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const token = searchParams.get("token") || "";

    const [status, setStatus] = useState<"confirm" | "loading" | "success" | "error">("confirm");
    const [message, setMessage] = useState("");

    const handleDecline = async () => {
        setStatus("loading");

        try {
            const res = await fetch("/api/membership/decline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(data.message || "You have been opted out successfully.");
            } else {
                setStatus("error");
                setMessage(data.error || "Something went wrong. Please try again.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    if (!email || !token) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.heading}>Invalid Link</h1>
                    <p style={styles.text}>
                        This link appears to be invalid or incomplete. If you want to opt out,
                        please use the link from your email.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoContainer}>
                    <Image
                        src="/logo2-removebg-preview.png"
                        alt="EnergDive"
                        width={160}
                        height={50}
                        style={styles.logo}
                    />
                </div>

                {status === "confirm" && (
                    <>
                        <h1 style={styles.heading}>Opt Out of EnergClub</h1>
                        <p style={styles.text}>
                            Are you sure you don&apos;t want to proceed with your{" "}
                            <strong>free EnergClub membership</strong>?
                        </p>
                        <div style={styles.infoBox}>
                            <p style={styles.infoText}>
                                By opting out, you will no longer receive reminder emails
                                about completing your EnergClub registration. You can always
                                sign up again later at{" "}
                                <a href="https://www.energdive.com" style={styles.link}>
                                    energdive.com
                                </a>
                                .
                            </p>
                        </div>
                        <div style={styles.buttonGroup}>
                            <button onClick={handleDecline} style={styles.declineButton}>
                                Yes, I don&apos;t want to proceed
                            </button>
                            <a href="/" style={styles.keepButton}>
                                No, keep my membership
                            </a>
                        </div>
                    </>
                )}

                {status === "loading" && (
                    <>
                        <div style={styles.spinner} />
                        <p style={styles.text}>Processing your request...</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div style={styles.successIcon}>✓</div>
                        <h1 style={styles.heading}>You&apos;ve been opted out</h1>
                        <p style={styles.text}>{message}</p>
                        <p style={styles.subText}>
                            You can always join again by visiting{" "}
                            <a href="https://www.energdive.com" style={styles.link}>
                                energdive.com
                            </a>
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div style={styles.errorIcon}>✕</div>
                        <h1 style={styles.heading}>Something went wrong</h1>
                        <p style={styles.text}>{message}</p>
                        <button onClick={handleDecline} style={styles.retryButton}>
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function MembershipDeclinePage() {
    return (
        <Suspense
            fallback={
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.spinner} />
                        <p style={styles.text}>Loading...</p>
                    </div>
                </div>
            }
        >
            <DeclineContent />
        </Suspense>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0B0F19",
        padding: "20px",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "48px 40px",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center" as const,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    },
    logoContainer: {
        marginBottom: "32px",
    },
    logo: {
        maxWidth: "160px",
        height: "auto",
    },
    heading: {
        margin: "0 0 16px",
        color: "#111827",
        fontSize: "24px",
        fontWeight: 800,
    },
    text: {
        margin: "0 0 24px",
        color: "#4B5563",
        fontSize: "16px",
        lineHeight: "1.7",
    },
    subText: {
        margin: "0",
        color: "#9CA3AF",
        fontSize: "14px",
    },
    infoBox: {
        backgroundColor: "#FEF9EC",
        border: "1px solid #FDE68A",
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: "24px",
    },
    infoText: {
        margin: 0,
        color: "#92400E",
        fontSize: "13px",
        lineHeight: "1.6",
    },
    link: {
        color: "#09B697",
        textDecoration: "underline",
    },
    buttonGroup: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "12px",
        alignItems: "center",
    },
    declineButton: {
        background: "#EF4444",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        padding: "14px 32px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        width: "100%",
    },
    keepButton: {
        display: "inline-block",
        background: "#09B697",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        textDecoration: "none",
        padding: "14px 32px",
        borderRadius: "10px",
        width: "100%",
        boxSizing: "border-box" as const,
    },
    retryButton: {
        background: "#374151",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        padding: "14px 32px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
    },
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #E5E7EB",
        borderTop: "4px solid #09B697",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 24px",
    },
    successIcon: {
        width: "64px",
        height: "64px",
        lineHeight: "64px",
        borderRadius: "50%",
        backgroundColor: "#D1FAE5",
        color: "#059669",
        fontSize: "32px",
        fontWeight: 900,
        margin: "0 auto 24px",
    },
    errorIcon: {
        width: "64px",
        height: "64px",
        lineHeight: "64px",
        borderRadius: "50%",
        backgroundColor: "#FEE2E2",
        color: "#DC2626",
        fontSize: "32px",
        fontWeight: 900,
        margin: "0 auto 24px",
    },
};
