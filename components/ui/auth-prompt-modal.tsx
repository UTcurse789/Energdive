"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { usePathname } from "next/navigation";

const DISMISSAL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const POPUP_DELAY_MS = 7 * 1000; // 7 seconds

export default function AuthPromptModal() {
    const { isLoaded, isSignedIn } = useAuth();
    const [show, setShow] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Only run on the client, and only if auth is loaded and user is NOT signed in
        if (!isLoaded || isSignedIn) return;

        // Don't show modal on auth pages
        if (pathname?.startsWith("/auth")) return;

        // Check if previously dismissed within the cooldown period
        const dismissedAt = localStorage.getItem("auth_prompt_dismissed_at");
        if (dismissedAt) {
            const timeSinceDismissal = Date.now() - parseInt(dismissedAt, 10);
            if (timeSinceDismissal < DISMISSAL_COOLDOWN_MS) {
                return; // Still in cooldown, do not show
            }
        }

        // Set a timer to show the popup after 7 seconds
        const timer = setTimeout(() => {
            setShow(true);
        }, POPUP_DELAY_MS);

        return () => clearTimeout(timer);
    }, [isLoaded, isSignedIn, pathname]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("auth_prompt_dismissed_at", Date.now().toString());
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm">
                    {/* Backdrop click to dismiss */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                        className="relative z-10 w-full max-w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Close Button (X) */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 z-20 p-2 bg-white/50 backdrop-blur-md rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shadow-sm"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image Section (Left on Desktop, Top on Mobile) */}
                        <div className="relative w-full h-48 md:h-auto md:w-5/12 shrink-0 bg-zinc-900">
                            <Image
                                src="/image.png"
                                alt="Energy Insights"
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width: 768px) 100vw, 400px"
                                priority
                            />
                            {/* Gradient overlay to blend image into text a bit */}
                            <div className="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-zinc-900/40 to-transparent" />
                        </div>

                        {/* Content Section (Right on Desktop, Bottom on Mobile) */}
                        <div className="p-8 md:p-12 flex flex-col justify-center flex-1 bg-white">
                            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 font-serif leading-tight mb-4">
                                Unlock Premium Energy Insights
                            </h2>
                            <p className="text-zinc-600 leading-relaxed mb-8">
                                Connect with the strategic energy intelligence platform. Register or log in to access exclusive articles, data analysis, and reports from ENERGDIVE.
                            </p>

                            <div className="flex flex-col gap-4">
                                {/* Primary CTA */}
                                <Link
                                    href="/auth"
                                    onClick={handleDismiss}
                                    className="w-full h-12 rounded-xl bg-[#0AB996] hover:bg-[#099c82] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0AB996]/20 active:scale-[0.98]"
                                >
                                    REGISTER / LOGIN
                                    <span className="text-lg">→</span>
                                </Link>

                                {/* Secondary Action */}
                                <button
                                    onClick={handleDismiss}
                                    className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-800"
                                >
                                    No, Thanks
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
