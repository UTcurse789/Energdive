"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// ── Types (mirrors DB schema) ─────────────────────────────────────
interface SubCommunity {
    id: number;
    community_id: number;
    name: string;
}

interface Community {
    id: number;
    name: string;
    sub_communities: SubCommunity[];
}

interface SubIndustry {
    id: number;
    industry_id: number;
    name: string;
}

interface Industry {
    id: number;
    name: string;
    sub_industries: SubIndustry[];
}

// ── Schema ────────────────────────────────────────────────────────
const interestsSchema = z.object({
    industryId: z.number().min(1, "Please select an industry"),
    subIndustryId: z.number().min(1, "Please select a sub-industry"),
    communitySelections: z
        .array(
            z.object({
                communityId: z.number(),
                subCommunityId: z.number(),
            })
        )
        .min(1, "Select at least one community + sub-community"),
});

type InterestsData = z.infer<typeof interestsSchema>;

interface StepInterestsProps {
    defaultValues: Partial<InterestsData>;
    onBack: () => void;
    onSubmit: (data: InterestsData) => void;
    isSubmitting: boolean;
}

export default function StepInterests({
    defaultValues,
    onBack,
    onSubmit,
    isSubmitting,
}: StepInterestsProps) {
    // ── State ─────────────────────────────────────────────────────
    const [communities, setCommunities] = useState<Community[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);

    // Per-community sub-community selections:
    // Map<communityId, Set<number>>
    const [selectedCommunities, setSelectedCommunities] = useState<
        Map<number, Set<number>>
    >(new Map());

    const {
        register,
        watch,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<InterestsData>({
        resolver: zodResolver(interestsSchema),
        defaultValues: {
            industryId: defaultValues.industryId || 0,
            subIndustryId: defaultValues.subIndustryId || 0,
            communitySelections: defaultValues.communitySelections || [],
        },
    });

    // ── Load master data ──────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const [commRes, indRes] = await Promise.all([
                    fetch("/api/master/communities"),
                    fetch("/api/master/industries"),
                ]);
                if (!commRes.ok || !indRes.ok) throw new Error("API error");
                setCommunities(await commRes.json());
                setIndustries(await indRes.json());
            } catch (err) {
                console.error("Taxonomy load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // ── Industry cascade ──────────────────────────────────────────
    const selectedIndustryId = watch("industryId");

    const currentSubIndustries = useMemo(
        () =>
            industries.find((ind) => ind.id === selectedIndustryId)
                ?.sub_industries || [],
        [industries, selectedIndustryId]
    );

    // Reset sub-industry when industry changes
    useEffect(() => {
        setValue("subIndustryId", 0);
    }, [selectedIndustryId, setValue]);

    // ── Community toggle ──────────────────────────────────────────
    const toggleCommunity = (communityId: number) => {
        setSelectedCommunities((prev) => {
            const next = new Map(prev);
            if (next.has(communityId)) {
                next.delete(communityId);
            } else {
                next.set(communityId, new Set());
            }
            // Sync to form
            syncCommunitySelections(next);
            return next;
        });
    };

    const toggleSubCommunity = (communityId: number, subCommunityId: number) => {
        setSelectedCommunities((prev) => {
            const next = new Map(prev);
            const currentSet = next.get(communityId) || new Set();
            const newSet = new Set(currentSet);

            if (newSet.has(subCommunityId)) {
                newSet.delete(subCommunityId);
            } else {
                newSet.add(subCommunityId);
            }

            next.set(communityId, newSet);
            syncCommunitySelections(next);
            return next;
        });
    };

    const syncCommunitySelections = (map: Map<number, Set<number>>) => {
        const selections: { communityId: number; subCommunityId: number }[] = [];
        map.forEach((subSet, commId) => {
            subSet.forEach((subId) => {
                selections.push({ communityId: commId, subCommunityId: subId });
            });
        });
        setValue("communitySelections", selections);
    };

    // ── Loading / error states ────────────────────────────────────
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-20"
            >
                <Loader2 className="w-8 h-8 animate-spin text-[#0AB996]" />
                <span className="ml-3 text-zinc-500">Loading data...</span>
            </motion.div>
        );
    }

    if (!communities.length || !industries.length) {
        return (
            <div className="text-center py-20 text-zinc-500">
                <p>Failed to load taxonomy data. Please refresh the page.</p>
            </div>
        );
    }

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
                        Industry & Interests
                    </h2>
                    <p className="text-zinc-500 mt-1">
                        Personalize your feed with relevant content.
                    </p>
                </div>

                {/* ── Industry Select ──────────────────────────────── */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">
                        Industry
                    </label>
                    <div className="relative">
                        <select
                            {...register("industryId", { valueAsNumber: true })}
                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all bg-white appearance-none pr-10"
                        >
                            <option value={0}>Select your industry</option>
                            {industries.map((ind) => (
                                <option key={ind.id} value={ind.id}>
                                    {ind.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                    {errors.industryId && (
                        <p className="text-red-500 text-xs">{errors.industryId.message}</p>
                    )}
                </div>

                {/* ── Sub-Industry (cascaded) ──────────────────────── */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700">
                        Sub-Industry
                    </label>
                    <div className="relative">
                        <select
                            {...register("subIndustryId", { valueAsNumber: true })}
                            disabled={!selectedIndustryId}
                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all bg-white disabled:bg-zinc-100 disabled:text-zinc-400 appearance-none pr-10"
                        >
                            <option value={0}>Select sub-industry</option>
                            {currentSubIndustries.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                    {errors.subIndustryId && (
                        <p className="text-red-500 text-xs">{errors.subIndustryId.message}</p>
                    )}
                </div>

                {/* ── Communities Multi-Select ─────────────────────── */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-zinc-700">
                        Communities of Interest
                    </label>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2">
                        {communities.map((community) => {
                            const isActive = selectedCommunities.has(community.id);
                            return (
                                <button
                                    key={community.id}
                                    type="button"
                                    onClick={() => toggleCommunity(community.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${isActive
                                        ? "bg-[#0AB996]/10 border-[#0AB996] text-[#0AB996]"
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                        }`}
                                >
                                    {isActive && <Check className="w-3.5 h-3.5" />}
                                    {community.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub-community cascaded selects (shown for each selected community) */}
                    {Array.from(selectedCommunities.entries()).map(
                        ([communityId, subCommunitySet]) => {
                            const community = communities.find(
                                (c) => c.id === communityId
                            );
                            if (!community) return null;

                            return (
                                <motion.div
                                    key={communityId}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pl-4 border-l-2 border-[#0AB996]/30"
                                >
                                    <label className="block text-xs font-medium text-zinc-500 mb-2">
                                        Sub-communities for{" "}
                                        <span className="text-[#0AB996]">{community.name}</span> (Select multiple)
                                    </label>

                                    <div className="flex flex-wrap gap-2">
                                        {community.sub_communities.map((sc) => {
                                            const isSelected = subCommunitySet.has(sc.id);
                                            return (
                                                <button
                                                    key={sc.id}
                                                    type="button"
                                                    onClick={() => toggleSubCommunity(communityId, sc.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${isSelected
                                                            ? "bg-[#0AB996]/10 border-[#0AB996] text-[#0AB996]"
                                                            : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                    {sc.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        }
                    )}

                    {errors.communitySelections && (
                        <p className="text-red-500 text-xs">
                            {errors.communitySelections.message}
                        </p>
                    )}
                </div>
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
                    disabled={isSubmitting}
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
