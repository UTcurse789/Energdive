"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useSession } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import StepPersonal from "./step-personal";
import StepVerify from "./step-verify";
import StepProfessional from "./step-professional";
import StepInterests from "./step-interests";
import StepPreferences from "./step-preferences";

const TOTAL_STEPS = 5;

export default function OnboardingWizard() {
    const router = useRouter();
    const { user } = useUser();
    const { session } = useSession();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine which contact method was used for initial registration.
    // If registrationMethod is "phone", user needs email verification at Step 2.
    // If registrationMethod is "email" (or unknown), user needs phone verification at Step 2.
    const registrationMethod =
        (user?.publicMetadata?.isPhoneUser ? "phone" : null) ||
        (user?.publicMetadata?.registrationMethod as string) ||
        "email";

    const needsVerification: "email" | "phone" =
        registrationMethod === "phone" ? "email" : "phone";

    // Centralized State
    const [formData, setFormData] = useState({
        // Step 1
        salutation: "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: "",
        country: "",
        state: "",
        // Step 3
        jobTitle: "",
        organization: "",
        // Step 4
        industryId: 0,
        subIndustryId: 0,
        communitySelections: [] as { communityId: number; subCommunityId: number }[],
        // Step 5
        preferredFrequency: "daily",
        preferredFormats: [] as string[],
    });

    const handleNext = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
    };

    const handleVerified = () => {
        // Move to step 3 after second verification completes
        setStep(3);
    };

    const handleFinalSubmit = async (finalStepData: Record<string, unknown>) => {
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

            // Full page reload to /dashboard ensures the server-side
            // currentUser() in dashboard layout fetches fresh metadata.
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("Onboarding error:", error);
            alert("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
            {/* Progress Bar */}
            <div className="h-1.5 bg-zinc-100 w-full">
                <motion.div
                    className="h-full bg-[#0AB996]"
                    initial={{ width: "20%" }}
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
                        <StepPersonal
                            key="step1"
                            defaultValues={formData}
                            onNext={handleNext}
                        />
                    )}
                    {step === 2 && (
                        <StepVerify
                            key="step2"
                            verifyType={needsVerification}
                            onBack={handleBack}
                            onVerified={handleVerified}
                        />
                    )}
                    {step === 3 && (
                        <StepProfessional
                            key="step3"
                            defaultValues={formData}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    )}
                    {step === 4 && (
                        <StepInterests
                            key="step4"
                            defaultValues={formData}
                            onBack={handleBack}
                            onNext={handleNext}
                            isSubmitting={false}
                        />
                    )}
                    {step === 5 && (
                        <StepPreferences
                            key="step5"
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
