"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

const professionalSchema = z.object({
    jobTitle: z.string().min(2, "Job title is required"),
    organization: z.string().min(2, "Organization name is required"),
});

type ProfessionalData = z.infer<typeof professionalSchema>;

interface StepProfessionalProps {
    defaultValues: Partial<ProfessionalData>;
    onBack: () => void;
    onNext: (data: ProfessionalData) => void;
}

export default function StepProfessional({ defaultValues, onBack, onNext }: StepProfessionalProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<ProfessionalData>({
        resolver: zodResolver(professionalSchema),
        defaultValues: {
            jobTitle: defaultValues.jobTitle || "",
            organization: defaultValues.organization || "",
        }
    });

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(onNext)}
            className="space-y-6"
        >
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-zinc-900">Professional Details</h2>
                <p className="text-zinc-500">Tell us about your current role and organization.</p>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">Job Title</label>
                    <input
                        {...register("jobTitle")}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                        placeholder="e.g. Senior Analyst"
                    />
                    {errors.jobTitle && <p className="text-red-500 text-xs">{errors.jobTitle.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">Organization Name</label>
                    <input
                        {...register("organization")}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                        placeholder="e.g. organisation name"
                    />
                    {errors.organization && <p className="text-red-500 text-xs">{errors.organization.message}</p>}
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2.5 text-zinc-600 font-semibold hover:text-zinc-900 transition-colors"
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0AB996] text-white font-semibold rounded-lg shadow-lg shadow-[#0AB996]/20 hover:bg-[#099c82] transition-all active:scale-95"
                >
                    Continue
                </button>
            </div>
        </motion.form>
    );
}
