"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useSession } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import StepPersonal from "./step-personal";
import StepProfessional from "./step-professional";
import StepInterests from "./step-interests";

export default function OnboardingWizard() {
    const router = useRouter();
    const { user } = useUser();
    const { session } = useSession();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Centralized State
    const [formData, setFormData] = useState({
        // Step 1
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: "",
        country: "",
        state: "",
        // Step 2
        jobTitle: "",
        organization: "",
        // Step 3
        industryId: 0,
        subIndustryId: 0,
        communitySelections: [] as { communityId: number; subCommunityId: number }[],
    });

    const handleNext = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
    };

    const handleFinalSubmit = async (finalStepData: Record<string, unknown>) => {
        setIsSubmitting(true);
        const completeData = {
            ...formData,
            ...finalStepData,
            email: user?.emailAddresses?.[0]?.emailAddress || "",
        };

        try {
            const res = await fetch("/api/onboarding/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(completeData),
            });

            if (!res.ok) throw new Error("Failed to save profile");

            // Refresh Clerk session so middleware sees updated metadata
            await user?.reload();
            await session?.reload();

            // Navigate to dashboard (session now has onboardingComplete=true)
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
                    initial={{ width: "33%" }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <div className="p-8 md:p-12">
                <div className="mb-8">
                    <span className="text-xs font-bold tracking-wider text-[#0AB996] uppercase">
                        Step {step} of 3
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
                        <StepProfessional
                            key="step2"
                            defaultValues={formData}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    )}
                    {step === 3 && (
                        <StepInterests
                            key="step3"
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
