"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

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
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PersonalData>({
        resolver: zodResolver(personalSchema),
        defaultValues: {
            firstName: defaultValues.firstName || "",
            lastName: defaultValues.lastName || "",
            phone: defaultValues.phone || "",
            country: defaultValues.country || "India",
            state: defaultValues.state || "",
        }
    });

    const selectedCountry = watch("country");
    // Find selected country dial code
    const countryData = COUNTRIES.find(c => c.name === selectedCountry) || COUNTRIES.find(c => c.name === "India");
    const dialCode = countryData?.dial_code || "+91";

    // OTP State
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [isLoadingOtp, setIsLoadingOtp] = useState(false);
    const [otpError, setOtpError] = useState("");

    const handleSendOtp = async () => {
        const phone = watch("phone");
        if (!phone || phone.length < 5) {
            setOtpError("Please enter a valid phone number first.");
            return;
        }

        setIsLoadingOtp(true);
        setOtpError("");

        try {
            const fullPhone = `${dialCode}${phone.replace(/^0+/, '')}`; // Remove leading zeros
            const res = await fetch("/api/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setIsOtpSent(true);
            setOtpError("");
        } catch (err: any) {
            setOtpError(err.message || "Failed to send OTP.");
        } finally {
            setIsLoadingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setIsLoadingOtp(true);
        setOtpError("");

        try {
            const phone = watch("phone");
            const fullPhone = `${dialCode}${phone.replace(/^0+/, '')}`;

            const res = await fetch("/api/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: fullPhone, otp }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setIsOtpVerified(true);
            setIsOtpSent(false); // Hide OTP input after success
        } catch (err: any) {
            setOtpError(err.message || "Invalid OTP.");
        } finally {
            setIsLoadingOtp(false);
        }
    };

    const onSubmit = (data: PersonalData) => {
        if (!isOtpVerified) {
            setOtpError("Please verify your phone number to continue.");
            return;
        }
        // Save full phone with country code? Or just as is. 
        // For now, let's pass it as is (or typically you save E.164 format)
        // Let's modify the phone in data to include code
        const fullData = {
            ...data,
            phone: `${dialCode} ${data.phone}`
        };
        onNext(fullData);
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">First Name</label>
                        <input
                            {...register("firstName")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                            placeholder="John"
                        />
                        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Last Name</label>
                        <input
                            {...register("lastName")}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                            placeholder="Doe"
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
                    <label className="block text-sm font-medium text-zinc-700">Phone Number</label>
                    <div className="flex gap-2">
                        <div className="flex items-center justify-center px-3 border border-zinc-200 bg-zinc-50 rounded-lg text-zinc-600 font-medium min-w-[60px]">
                            {dialCode}
                        </div>
                        <input
                            {...register("phone")}
                            disabled={isOtpVerified}
                            className={`flex-1 px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all ${isOtpVerified ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                            placeholder="9876543210"
                        />

                        {!isOtpVerified && !isOtpSent && (
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isLoadingOtp}
                                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap"
                            >
                                {isLoadingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                            </button>
                        )}

                        {isOtpVerified && (
                            <div className="flex items-center justify-center px-4 text-green-600 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="ml-2 text-sm font-medium">Verified</span>
                            </div>
                        )}
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                    {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
                </div>

                {/* OTP Input Section */}
                {isOtpSent && !isOtpVerified && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-3"
                    >
                        <label className="block text-sm font-medium text-zinc-700">Enter Verification Code</label>
                        <div className="flex gap-2">
                            <input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none tracking-widest text-center font-bold text-lg"
                                placeholder="XXXX"
                                maxLength={6}
                            />
                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={isLoadingOtp || otp.length < 4}
                                className="px-6 py-2 bg-[#0AB996] text-white rounded-lg text-sm font-bold hover:bg-[#099c82] disabled:opacity-50"
                            >
                                {isLoadingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                            </button>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                            <span>Sent to {dialCode} {watch("phone")}</span>
                            <button onClick={() => setIsOtpSent(false)} className="text-red-500 hover:underline flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Change Number
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">State / Region</label>
                    <input
                        {...register("state")}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] outline-none transition-all"
                        placeholder="California"
                    />
                    {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={!isOtpVerified}
                    className="px-6 py-2.5 bg-[#0AB996] text-white font-semibold rounded-lg shadow-lg shadow-[#0AB996]/20 hover:bg-[#099c82] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Continue
                </button>
            </div>
        </motion.form>
    );
}
