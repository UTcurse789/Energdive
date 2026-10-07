"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { hasCompletedOnboarding, rememberOnboardingCompletion } from "@/lib/onboarding-completion";
import OnboardingWizard from "@/components/onboarding/wizard";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    getSafeRedirectFromClient,
    getSafeRedirectPath,
} from "@/lib/post-auth-redirect";

// Pages where the modal should NOT appear
const EXCLUDED_PATHS = ["/auth", "/onboarding"];

export default function OnboardingModal() {
    const { isLoaded, isSignedIn, userId } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const completedInClerk = user?.publicMetadata?.onboarding_completed === true;
    const wizardStartedFor = useRef<string | null>(null);
    const pathname = usePathname();
    const [modalUserId, setModalUserId] = useState<string | null>(null);
    const [checkedPathname, setCheckedPathname] = useState<string | null>(null);
    const [returnTo, setReturnTo] = useState(DEFAULT_POST_AUTH_REDIRECT);
    const [completedUserId, setCompletedUserId] = useState<string | null>(null);
    const checkKey = `${userId}:${pathname}`;
    const checked = checkedPathname === checkKey;
    const hasCompleted = Boolean(userId && completedUserId === userId);

    // Check if the current path is excluded
    const isExcluded = EXCLUDED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + "/") || pathname.startsWith(path + "?")
    );

    useEffect(() => {
        // If already completed (from sessionStorage), never show again this session
        if (!isLoaded || !userLoaded || !isSignedIn || !userId || isExcluded || checked || hasCompleted) return;
        // Once opened, the wizard owns its success screen until Continue is clicked.
        if (wizardStartedFor.current === userId) return;
        const checkingUserId = userId;

        let cancelled = false;

        async function checkOnboardingStatus() {
            try {
                if (hasCompletedOnboarding(checkingUserId) || completedInClerk) {
                    setCompletedUserId(checkingUserId);
                    return;
                }

                // Email/OTP verification is enough to start an incomplete profile.
                // Reconcile saved completion in the background; an unavailable status
                // service must not silently suppress the joining form.
                const target = getSafeRedirectFromClient();
                const currentTarget = typeof window !== "undefined"
                    ? getSafeRedirectPath(`${window.location.pathname}${window.location.search}${window.location.hash}`)
                    : DEFAULT_POST_AUTH_REDIRECT;
                setReturnTo(target !== DEFAULT_POST_AUTH_REDIRECT ? target : currentTarget);
                wizardStartedFor.current = checkingUserId;
                setModalUserId(checkingUserId);

                const res = await fetch("/api/onboarding/status", { cache: "no-store" });
                if (!res.ok) {
                    if (!cancelled) setCheckedPathname(checkKey);
                    return;
                }
                const data = await res.json();
                if (!cancelled) {
                    setCheckedPathname(checkKey);
                    if (data.signedIn && data.onboardingCompleted === true && !hasCompletedOnboarding(checkingUserId)) {
                        // API says complete — save to sessionStorage so we never check again
                        rememberOnboardingCompletion(checkingUserId);
                        setCompletedUserId(checkingUserId);
                        setModalUserId(null);
                        wizardStartedFor.current = null;
                    }
                }
            } catch (err) {
                console.warn("[OnboardingModal] Status check unavailable; profile form remains open:", err);
                if (!cancelled) {
                    setCheckedPathname(checkKey);
                }
            }
        }

        checkOnboardingStatus();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, userLoaded, isSignedIn, userId, isExcluded, checked, pathname, checkKey, hasCompleted, completedInClerk]);

    const handleComplete = useCallback(() => {
        // Persist completion to sessionStorage — survives Clerk JWT refreshes & page reloads
        if (userId) rememberOnboardingCompletion(userId);
        setCompletedUserId(userId ?? null);
        setModalUserId(null);
        wizardStartedFor.current = null;
    }, [userId]);

    return (
        <AnimatePresence>
            {isSignedIn && !isExcluded && !hasCompleted && modalUserId === userId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] flex items-start justify-center bg-zinc-900/60 backdrop-blur-sm overflow-y-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Complete your ENERGClub profile"
                        className="relative w-full max-w-3xl mx-2.5 my-3 sm:mx-4 sm:my-10"
                    >
                        {/* Modal Card */}
                        <div className="bg-white rounded-2xl shadow-2xl overflow-clip">
                            {/* Logo */}
                            <div className="flex justify-center px-4 pt-4 pb-1 sm:px-6 sm:pt-5 sm:pb-2">
                                <Image
                                    src="/logo - energclub-energdive.png"
                                    alt="ENERGDIVE"
                                    width={220}
                                    height={55}
                                    className="w-auto h-9 sm:h-14 object-contain"
                                    priority
                                />
                            </div>

                            {/* Wizard Form */}
                            <div className="px-0">
                                <OnboardingWizard key={userId} returnTo={returnTo} mode="modal" onComplete={handleComplete} />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
