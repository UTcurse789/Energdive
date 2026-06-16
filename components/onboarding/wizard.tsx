"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import StepProfile, { type ProfileData } from "./step-profile";
import StepInterestsPreferences, { type InterestsPreferencesData } from "./step-interests-preferences";

import {
    POST_AUTH_REDIRECT_STORAGE_KEY,
    POST_AUTH_REDIRECT_COOKIE,
    getSafeRedirectPath,
} from "@/lib/post-auth-redirect";

const TOTAL_STEPS = 2;

interface OnboardingWizardProps {
    returnTo?: string;
}

export default function OnboardingWizard({ returnTo = "/dashboard" }: OnboardingWizardProps) {
    const { user } = useUser();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine which second contact method must be verified before CRM sync.
    const registrationMethod =
        (user?.publicMetadata?.isPhoneUser ? "phone" : null) ||
        (user?.publicMetadata?.registrationMethod as string) ||
        "email";

    const needsVerification: "email" | "phone" =
        registrationMethod === "phone" ? "email" : "phone";

    const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
    const primaryEmail = user?.emailAddresses?.[0]?.emailAddress || "";
    const hasRealEmail = Boolean(primaryEmail && !primaryEmail.endsWith("@phone.energdive.com"));
    const verificationComplete =
        needsVerification === "phone"
            ? Boolean(metadata?.phoneVerified || metadata?.phone)
            : Boolean(metadata?.emailVerified || metadata?.verifiedEmail || hasRealEmail);

    // Centralized State
    const [formData, setFormData] = useState({
        salutation: "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: typeof metadata?.phone === "string" ? metadata.phone : "",
        country: "",
        state: "",
        jobTitle: "",
        organization: "",
        industryId: 0,
        subIndustryId: 0,
        communitySelections: [] as { communityId: number; subCommunityId: number }[],
        preferredFrequency: "daily",
        preferredFormats: [] as string[],
    });

    useEffect(() => {
        if (!user) return;

        setFormData((prev) => ({
            ...prev,
            firstName: prev.firstName || user.firstName || "",
            lastName: prev.lastName || user.lastName || "",
            phone: prev.phone || (typeof user.publicMetadata?.phone === "string" ? user.publicMetadata.phone : ""),
        }));
    }, [user]);

    const handleNext = (data: ProfileData) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleFinalSubmit = async (finalStepData: InterestsPreferencesData) => {
        setIsSubmitting(true);

        // Retrieve UTM parameters stored by <UtmTracker />
        const utmData = {
            utm_source: localStorage.getItem("utm_source"),
            utm_medium: localStorage.getItem("utm_medium"),
            utm_campaign: localStorage.getItem("utm_campaign"),
            utm_term: localStorage.getItem("utm_term"),
            utm_content: localStorage.getItem("utm_content"),
        };

        const completeData = {
            ...formData,
            ...finalStepData,
            ...utmData,
            email: user?.emailAddresses?.[0]?.emailAddress || "",
            consentTimestamp: localStorage.getItem("consent_timestamp"),
        };

        try {
            const res = await fetch("/api/onboarding/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(completeData),
            });

            if (!res.ok) throw new Error("Failed to save profile");

            // Determine final redirect: use returnTo from server, or fall back to
            // the redirect stored in sessionStorage by the auth page (survives OAuth
            // roundtrips where the URL param gets lost through /dashboard → /onboarding).
            let finalRedirect = getSafeRedirectPath(returnTo || "/dashboard");
            if (finalRedirect === "/dashboard") {
                const storedRedirect = sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY);
                const safeStoredRedirect = getSafeRedirectPath(storedRedirect);
                if (safeStoredRedirect !== "/dashboard") {
                    finalRedirect = safeStoredRedirect;
                }
            }

            // Clean up the stored redirect
            sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
            document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

            // Full page reload ensures the server-side
            // currentUser() in dashboard layout fetches fresh metadata.
            window.location.href = finalRedirect;
        } catch (error) {
            console.error("Onboarding error:", error);
            alert("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
            {/* Progress Bar */}
            <div className="h-1.5 bg-zinc-100 w-full">
                <motion.div
                    className="h-full bg-[#0AB996]"
                    initial={{ width: "50%" }}
                    animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <div className="p-8 md:p-12">
                <div className="mb-8">
                    <span className="text-xs font-bold tracking-wider text-[#0AB996] uppercase">
                        Step {step} of {TOTAL_STEPS}
                    </span>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <StepProfile
                            key="profile"
                            defaultValues={formData}
                            verifyType={needsVerification}
                            verificationComplete={verificationComplete}
                            onNext={handleNext}
                        />
                    )}
                    {step === 2 && (
                        <StepInterestsPreferences
                            key="interests-preferences"
                            defaultValues={formData}
                            onBack={handleBack}
                            onSubmit={handleFinalSubmit}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
