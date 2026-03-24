"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";

const SALUTATION_OPTIONS = [
    "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Capt.", "Col.", 
    "Admiral", "Vice Admiral", "Brig.", "Shri.", "Smt.", 
    "H.E. Mr.", "H.E. Ms.", "H.E. Dr."
];

const personalSchema = z.object({
    salutation: z.string().optional(),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
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
            salutation: defaultValues.salutation || "",
            firstName: defaultValues.firstName || "",
            lastName: defaultValues.lastName || "",
            country: defaultValues.country || "India",
            state: defaultValues.state || "",
        }
    });

    const onSubmit = (data: PersonalData) => {
        onNext(data);
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
        >
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-zinc-900">Personal Details</h2>
                <p className="text-zinc-500">Let's start with the basics to set up your profile.</p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Title</label>
                        <select
                            {...register("salutation")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all bg-white"
                        >
                            <option value="">--</option>
                            {SALUTATION_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-4 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">First Name</label>
                        <input
                            {...register("firstName")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                            placeholder="First Name"
                        />
                        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                    </div>
                    <div className="md:col-span-5 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Last Name</label>
                        <input
                            {...register("lastName")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                            placeholder="Last Name"
                        />
                        {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                    </div>
                </div>

                {/* Country Selection */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">Country</label>
                    <select
                        {...register("country")}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all bg-white"
                    >
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">State / Region</label>
                    <input
                        {...register("state")}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                        placeholder="State"
                    />
                    {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
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
