"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

// ── Constants ────────────────────────────────────────────────────────
const FREQUENCIES = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
] as const;

const DEFAULT_FREQUENCY = "daily";

function normalizeFrequency(value?: string): string {
    return FREQUENCIES.some((freq) => freq.value === value)
        ? value!
        : DEFAULT_FREQUENCY;
}

const FORMATS = [
    "Insights",
    "Opinion",
    "News Briefing",
    "Upcoming Events",
    "Case Study & Technical Papers",
] as const;

// ── Schema ────────────────────────────────────────────────────────
const preferencesSchema = z.object({
    preferredFrequency: z.string().min(1, "Please select a frequency"),
    preferredFormats: z
        .array(z.string())
        .min(1, "Select at least one format"),
});

type PreferencesData = z.infer<typeof preferencesSchema>;

interface StepPreferencesProps {
    defaultValues: Partial<PreferencesData>;
    onBack: () => void;
    onSubmit: (data: PreferencesData) => void;
    isSubmitting: boolean;
}

export default function StepPreferences({
    defaultValues,
    onBack,
    onSubmit,
    isSubmitting,
}: StepPreferencesProps) {
    const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
        new Set(defaultValues.preferredFormats || [])
    );
    const [consentAccepted, setConsentAccepted] = useState(false);

    const {
        setValue,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PreferencesData>({
        resolver: zodResolver(preferencesSchema),
        defaultValues: {
            preferredFrequency: normalizeFrequency(defaultValues.preferredFrequency),
            preferredFormats: defaultValues.preferredFormats || [],
        },
    });

    const currentFrequency = normalizeFrequency(watch("preferredFrequency"));

    const toggleFormat = (format: string) => {
        setSelectedFormats((prev) => {
            const next = new Set(prev);
            if (next.has(format)) {
                next.delete(format);
            } else {
                next.add(format);
            }
            setValue("preferredFormats", Array.from(next));
            return next;
        });
    };

    const selectFrequency = (value: string) => {
        if (!FREQUENCIES.some((freq) => freq.value === value)) {
            return;
        }
        setValue("preferredFrequency", value);
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
        >
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">
                        Subscription Preferences
                    </h2>
                    <p className="text-zinc-500 mt-1">
                        Choose how often and what type of content you'd like to receive.
                    </p>
                </div>

                {/* ── Frequency ───────────────────────────────────── */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-700 uppercase tracking-wider">
                        Frequency
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {FREQUENCIES.map((freq) => {
                            const isActive = currentFrequency === freq.value;
                            return (
                                <button
                                    key={freq.value}
                                    type="button"
                                    onClick={() => selectFrequency(freq.value)}
                                    className={`relative px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${isActive
                                        ? "bg-[#0AB996]/10 border-[#0AB996] text-[#0AB996] shadow-sm"
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 justify-center">
                                        {isActive && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-4 h-4 rounded-full bg-[#0AB996] flex items-center justify-center"
                                            >
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            </motion.span>
                                        )}
                                        {freq.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {errors.preferredFrequency && (
                        <p className="text-red-500 text-xs">
                            {errors.preferredFrequency.message}
                        </p>
                    )}
                </div>

                {/* ── Formats ────────────────────────────────────── */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-700 uppercase tracking-wider">
                        Formats
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {FORMATS.map((format) => {
                            const isActive = selectedFormats.has(format);
                            return (
                                <button
                                    key={format}
                                    type="button"
                                    onClick={() => toggleFormat(format)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${isActive
                                        ? "bg-[#0AB996]/10 border-[#0AB996] text-[#0AB996]"
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                        }`}
                                >
                                    {isActive && <Check className="w-3.5 h-3.5" />}
                                    {format}
                                </button>
                            );
                        })}
                    </div>
                    {errors.preferredFormats && (
                        <p className="text-red-500 text-xs">
                            {errors.preferredFormats.message}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Consent Checkbox ─────────────────────────────────── */}
            <div className="flex items-start gap-2.5 pt-4">
                <Checkbox
                    id="consent-checkbox"
                    checked={consentAccepted}
                    onCheckedChange={(checked) => {
                        const accepted = checked === true;
                        setConsentAccepted(accepted);
                        if (accepted) {
                            // Generate explicitly formatted IST string (+05:30) for clarity in DB/logs
                            const now = new Date();
                            const istTime = new Date(now.getTime() + 330 * 60000); // Add 5 hours 30 mins
                            const istString = istTime.toISOString().replace("Z", "+05:30");
                            localStorage.setItem("consent_timestamp", istString);
                        } else {
                            localStorage.removeItem("consent_timestamp");
                        }
                    }}
                    className="mt-0.5 border-zinc-300 data-[state=checked]:bg-[#0AB996] data-[state=checked]:border-[#0AB996]"
                />
                <label
                    htmlFor="consent-checkbox"
                    className="text-xs leading-relaxed text-zinc-500 cursor-pointer select-none"
                >
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-[#0AB996] hover:underline font-medium">
                        Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" target="_blank" className="text-[#0AB996] hover:underline font-medium">
                        Privacy Policy
                    </Link>
                </label>
            </div>

            {/* ── Navigation ──────────────────────────────────────── */}
            <div className="flex justify-between pt-6 border-t border-zinc-100">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-zinc-600 font-semibold hover:text-zinc-900 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !consentAccepted}
                    className="px-8 py-2.5 bg-[#0AB996] text-white font-semibold rounded-lg shadow-lg shadow-[#0AB996]/20 hover:bg-[#099c82] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Complete Setup"
                    )}
                </button>
            </div>
        </motion.form>
    );
}
