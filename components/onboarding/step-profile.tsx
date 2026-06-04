"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { STATES_BY_COUNTRY } from "@/data/states";
import StepVerify from "./step-verify";

const SALUTATION_OPTIONS = [
    "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.",
    "Capt.", "Col.", "Admiral", "Vice Admiral", "Brig.",
    "Shri.", "Smt.", "H.E. Mr.", "H.E. Ms.", "H.E. Dr.",
];

const profileSchema = z.object({
    salutation: z.string().optional(),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State is required"),
    jobTitle: z.string().min(2, "Job title is required"),
    organization: z.string().min(2, "Organization name is required"),
});

export type ProfileData = z.infer<typeof profileSchema>;

interface StepProfileProps {
    defaultValues: Partial<ProfileData>;
    verifyType: "email" | "phone";
    verificationComplete: boolean;
    onNext: (data: ProfileData) => void;
}

export default function StepProfile({
    defaultValues,
    verifyType,
    verificationComplete,
    onNext,
}: StepProfileProps) {
    const [secondContactVerified, setSecondContactVerified] = useState(verificationComplete);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            salutation: defaultValues.salutation || "",
            firstName: defaultValues.firstName || "",
            lastName: defaultValues.lastName || "",
            country: defaultValues.country || "India",
            state: defaultValues.state || "",
            jobTitle: defaultValues.jobTitle || "",
            organization: defaultValues.organization || "",
        },
    });

    const selectedCountry = useWatch({ control, name: "country" });
    const selectedState = useWatch({ control, name: "state" });
    const states = useMemo(
        () => STATES_BY_COUNTRY[selectedCountry] || [],
        [selectedCountry]
    );

    useEffect(() => {
        if (!states.length || !selectedState) return;
        if (!states.includes(selectedState)) {
            setValue("state", "");
        }
    }, [selectedState, setValue, states]);

    const verificationLabel = useMemo(
        () => verifyType === "phone" ? "phone number" : "email address",
        [verifyType]
    );

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(onNext)}
            className="space-y-7"
        >
            <div className="space-y-1 mt-2">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Hey! Let us Know You well</h2>
                <p className="text-sm md:text-base text-zinc-500">
                    Confirm your identity and professional details.
                </p>
            </div>

            {!secondContactVerified && (
                <div className=" mt-2 rounded-xl border border-[#0AB996]/20 bg-gradient-to-br from-[#0AB996]/[0.06] to-white p-4 shadow-sm">
                    <StepVerify
                        verifyType={verifyType}
                        onBack={() => undefined}
                        onVerified={() => setSecondContactVerified(true)}
                        compact
                        hideBack
                    />
                </div>
            )}

            {secondContactVerified && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    Your {verificationLabel} is verified.
                </div>
            )}

            <div className="space-y-5 m-5">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900">Name details</h3>
                            <p className="text-xs text-zinc-500">This name will appear on your ENERGClub profile.</p>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="min-w-0 space-y-1 sm:col-span-2 xl:col-span-1">
                            <label className="block text-sm font-medium text-zinc-700">Salutation</label>
                            <select
                                {...register("salutation")}
                                className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20"
                            >
                                <option value="">Select</option>
                                {SALUTATION_OPTIONS.map((salutation) => (
                                    <option key={salutation} value={salutation}>{salutation}</option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-0 space-y-1">
                            <label className="block text-sm font-medium text-zinc-700">First Name</label>
                            <input
                                {...register("firstName")}
                                className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20"
                                placeholder="First name"
                            />
                            {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                        </div>
                        <div className="min-w-0 space-y-1">
                            <label className="block text-sm font-medium text-zinc-700">Last Name</label>
                            <input
                                {...register("lastName")}
                                className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20"
                                placeholder="Last name"
                            />
                            {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Country</label>
                        <select
                            {...register("country")}
                            className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:ring-2 focus:ring-[#0AB996]"
                        >
                            {COUNTRIES.map((country) => (
                                <option key={country.code} value={country.name}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                        {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">State / Region</label>
                        {states.length > 0 ? (
                            <select
                                {...register("state")}
                                className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:ring-2 focus:ring-[#0AB996]"
                            >
                                <option value="">Select state / region</option>
                                {states.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                {...register("state")}
                                className="h-12 w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:ring-2 focus:ring-[#0AB996]"
                                placeholder="State / region"
                            />
                        )}
                        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Job Title</label>
                        <input
                            {...register("jobTitle")}
                            className="h-12 w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0AB996]"
                            placeholder="e.g. Senior Analyst"
                        />
                        {errors.jobTitle && <p className="text-red-500 text-xs">{errors.jobTitle.message}</p>}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Organisation</label>
                        <input
                            {...register("organization")}
                            className="h-12 w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0AB996]"
                            placeholder="Organisation name"
                        />
                        {errors.organization && <p className="text-red-500 text-xs">{errors.organization.message}</p>}
                    </div>
                </div>
            </div>

            <div className="sticky bottom-0 -mx-8 -mb-8 border-t border-zinc-100 bg-white/95 px-8 py-4 backdrop-blur md:-mx-12 md:-mb-12 md:px-12">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {!secondContactVerified ? (
                    <p className="text-xs font-medium text-zinc-500">
                        Verify your {verificationLabel} to continue.
                    </p>
                ) : (
                    <span />
                )}
                <button
                    type="submit"
                    disabled={!secondContactVerified}
                    className="h-12 w-full rounded-lg bg-[#0AB996] px-8 text-base font-semibold text-white shadow-lg shadow-[#0AB996]/20 transition-all hover:bg-[#099c82] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none sm:w-auto"
                >
                    Continue
                </button>
                </div>
            </div>
        </motion.form>
    );
}
