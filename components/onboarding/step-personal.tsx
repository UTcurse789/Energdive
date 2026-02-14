"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

const personalSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State is required"),
});

type PersonalData = z.infer<typeof personalSchema>;

interface StepPersonalProps {
    defaultValues: Partial<PersonalData>;
    onNext: (data: PersonalData) => void;
}

export default function StepPersonal({ defaultValues, onNext }: StepPersonalProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<PersonalData>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            firstName: defaultValues.firstName || "",
            lastName: defaultValues.lastName || "",
            phone: defaultValues.phone || "",
            country: defaultValues.country || "",
            state: defaultValues.state || "",
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
                <h2 className="text-2xl font-bold text-zinc-900">Personal Details</h2>
                <p className="text-zinc-500">Let's start with the basics to set up your profile.</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">First Name</label>
                        <input
                            {...register("firstName")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                            placeholder="John"
                        />
                        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Last Name</label>
                        <input
                            {...register("lastName")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                            placeholder="Doe"
                        />
                        {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">Phone Number</label>
                    <input
                        {...register("phone")}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                        placeholder="+1 (555) 000-0000"
                    />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Country</label>
                        <input
                            {...register("country")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                            placeholder="United States"
                        />
                        {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">State / Region</label>
                        <input
                            {...register("state")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all"
                            placeholder="California"
                        />
                        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
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
