"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface StepVerifyProps {
    /** Which method needs to be verified: 'email' or 'phone' */
    verifyType: "email" | "phone";
    onBack: () => void;
    onVerified: () => void;
    compact?: boolean;
    hideBack?: boolean;
}

/**
 * Step 2 of onboarding — verifies the second contact method via OTP.
 * If user registered with phone → verify email (OTP sent via Brevo email).
 * If user registered with email → verify phone (OTP sent via MSG91 SMS).
 */
export default function StepVerify({
    verifyType,
    onBack,
    onVerified,
    compact = false,
    hideBack = false,
}: StepVerifyProps) {
    const [value, setValue] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const isPhone = verifyType === "phone";

    // ── Send OTP (works for both phone and email) ───────────
    const handleSendOtp = async () => {
        if (!value.trim()) {
            setError(
                isPhone
                    ? "Please enter your phone number"
                    : "Please enter your email address"
            );
            return;
        }

        // Basic email validation
        if (!isPhone) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                setError("Please enter a valid email address");
                return;
            }
            if (value.trim().toLowerCase().endsWith("@phone.energdive.com")) {
                setError("Please use a real email address");
                return;
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            const endpoint = isPhone
                ? "/api/otp/send"
                : "/api/auth/email-otp-send";

            // MSG91 needs country code prefix (91XXXXXXXXXX)
            const cleanPhone = value.replace(/[^0-9]/g, "");
            const body = isPhone
                ? { phone: cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}` }
                : { email: value.trim().toLowerCase() };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send OTP");
            setOtpSent(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Verify OTP (works for both phone and email) ─────────
    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length < 4) {
            setError("Please enter the OTP");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const verifyValue = isPhone
                ? (() => {
                    const clean = value.replace(/[^0-9]/g, "");
                    return clean.startsWith("91") ? clean : `91${clean}`;
                })()
                : value.trim().toLowerCase();

            const res = await fetch("/api/auth/verify-second", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: verifyType,
                    value: verifyValue,
                    otp,
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Verification failed");
            setSuccess(true);
            setTimeout(() => onVerified(), 800);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────
    const title = isPhone
        ? "Verify Your Phone Number"
        : "Verify Your Email Address";
    const subtitle = isPhone
        ? "We'll send an OTP to verify your phone number."
        : "We'll send a verification code to your email address.";

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={compact ? "space-y-4" : "space-y-6"}
        >
            <div className={compact ? "space-y-3" : "space-y-4"}>
                <div>
                    <h2 className={compact ? "text-lg font-bold text-zinc-900" : "text-2xl font-bold text-zinc-900"}>
                        {title}
                    </h2>
                    <p className={compact ? "text-sm text-zinc-500 mt-1" : "text-zinc-500"}>{subtitle}</p>
                </div>

                {/* Success state */}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">
                            Verified successfully!
                        </span>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Input + OTP flow (same pattern for both phone and email) */}
                {!success && (
                    <>
                        {/* Value input (phone number or email) */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-zinc-700">
                                {isPhone ? "Phone Number" : "Email Address"}
                            </label>
                            {isPhone ? (
                                <div className="flex gap-2">
                                    <span className="flex items-center px-3 bg-zinc-100 border border-zinc-200 rounded-lg text-sm text-zinc-600">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        value={value}
                                        onChange={(e) =>
                                            setValue(
                                                e.target.value.replace(
                                                    /[^0-9]/g,
                                                    ""
                                                )
                                            )
                                        }
                                        className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                                        placeholder="9876543210"
                                        maxLength={10}
                                        disabled={otpSent}
                                    />
                                </div>
                            ) : (
                                <input
                                    type="email"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                                    placeholder="you@example.com"
                                    disabled={otpSent}
                                />
                            )}
                        </div>

                        {!otpSent ? (
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isLoading || !value.trim()}
                                className="w-full px-4 py-2.5 bg-[#0AB996] text-white font-semibold rounded-lg hover:bg-[#099c82] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? "Sending..."
                                    : `Send Verification Code`}
                            </button>
                        ) : (
                            <>
                                {/* OTP sent confirmation */}
                                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-sm text-blue-700">
                                        {isPhone
                                            ? "OTP sent to your phone"
                                            : "Verification code sent to your email"}
                                    </span>
                                </div>

                                {/* OTP input */}
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-zinc-700">
                                        Enter Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(
                                                e.target.value.replace(
                                                    /[^0-9]/g,
                                                    ""
                                                )
                                            )
                                        }
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all text-center text-lg tracking-widest"
                                        placeholder="• • • •"
                                        maxLength={4}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={isLoading || otp.length < 4}
                                    className="w-full px-4 py-2.5 bg-[#0AB996] text-white font-semibold rounded-lg hover:bg-[#099c82] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? "Verifying..."
                                        : "Verify & Continue"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                        setError(null);
                                    }}
                                    className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                                >
                                    Resend Code
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>

            {!hideBack && !success && !otpSent && (
                <div className="flex justify-between pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-2.5 bg-zinc-100 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-200 transition-all"
                    >
                        Back
                    </button>
                </div>
            )}
        </motion.div>
    );
}
