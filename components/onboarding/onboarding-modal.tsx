"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import OnboardingWizard from "@/components/onboarding/wizard";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    getSafeRedirectFromClient,
    getSafeRedirectPath,
} from "@/lib/post-auth-redirect";

// Pages where the modal should NOT appear
const EXCLUDED_PATHS = ["/auth", "/onboarding", "/print/"];

export default function OnboardingModal() {
    const { isLoaded, isSignedIn } = useAuth();
    const pathname = usePathname();
    const [showModal, setShowModal] = useState(false);
    const [checkedPathname, setCheckedPathname] = useState<string | null>(null);
    const [returnTo, setReturnTo] = useState(DEFAULT_POST_AUTH_REDIRECT);
    const checked = checkedPathname === pathname;

    // Check if the current path is excluded
    const isExcluded = EXCLUDED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + "/") || pathname.startsWith(path + "?")
    );

    useEffect(() => {
        if (!isLoaded || !isSignedIn || isExcluded || checked) return;

        let cancelled = false;

        async function checkOnboardingStatus() {
            try {
                const res = await fetch("/api/onboarding/status");
                if (!res.ok) {
                    setCheckedPathname(pathname);
                    return;
                }
                const data = await res.json();
                if (!cancelled) {
                    setCheckedPathname(pathname);
                    if (data.signedIn && !data.onboardingCompleted) {
                        const target = getSafeRedirectFromClient();
                        const currentTarget = typeof window !== "undefined"
                            ? getSafeRedirectPath(`${window.location.pathname}${window.location.search}${window.location.hash}`)
                            : DEFAULT_POST_AUTH_REDIRECT;
                        setReturnTo(target !== DEFAULT_POST_AUTH_REDIRECT ? target : currentTarget);
                        setShowModal(true);
                    }
                }
            } catch (err) {
                console.error("[OnboardingModal] Status check failed:", err);
                if (!cancelled) {
                    setCheckedPathname(pathname);
                }
            }
        }

        checkOnboardingStatus();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, isExcluded, checked, pathname]);

    const handleComplete = useCallback(() => {
        setShowModal(false);
    }, []);

    return (
        <AnimatePresence>
            {showModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] flex items-start justify-center bg-zinc-900/60 backdrop-blur-sm overflow-y-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                        className="relative w-full max-w-3xl mx-4 my-8 sm:my-12"
                    >
                        {/* Modal Card */}
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            {/* Logo */}
                            <div className="flex justify-center px-6 pt-5 pb-2">
                                <Image
                                    src="/logo - energclub-energdive.png"
                                    alt="ENERGDIVE"
                                    width={250}
                                    height={70}
                                    className="w-auto h-14 sm:h-16 object-contain"
                                    priority
                                />
                            </div>

                            {/* Wizard Form */}
                            <div className="px-0">
                                <OnboardingWizard returnTo={returnTo} mode="modal" onComplete={handleComplete} />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
