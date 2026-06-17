"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { COUNTRIES } from "@/data/countries";
import { STATES_BY_COUNTRY } from "@/data/states";
import {
    POST_AUTH_REDIRECT_STORAGE_KEY,
    POST_AUTH_REDIRECT_COOKIE,
    getSafeRedirectPath,
} from "@/lib/post-auth-redirect";

/* ─────────────────────────────────────────────────────────────── */
/*  Constants                                                     */
/* ─────────────────────────────────────────────────────────────── */

const SALUTATION_OPTIONS = [
    "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.",
    "Capt.", "Col.", "Admiral", "Vice Admiral", "Brig.",
    "Shri.", "Smt.", "H.E. Mr.", "H.E. Ms.", "H.E. Dr.",
];

const FREQUENCIES = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
] as const;

const DEFAULT_FREQUENCY = "daily";

const FORMATS = [
    "Insights",
    "Opinion",
    "News Briefing",
    "Upcoming Events",
    "Case Study & Technical Papers",
] as const;

function normalizeFrequency(value?: string): string {
    return FREQUENCIES.some((f) => f.value === value) ? value! : DEFAULT_FREQUENCY;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Taxonomy types                                                */
/* ─────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────── */
/*  Zod schema – single unified form                              */
/* ─────────────────────────────────────────────────────────────── */

const onboardingSchema = z.object({
    salutation: z.string().optional(),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    phone: z.string().optional(),
    email: z.string().optional(),
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State / Region is required"),
    jobTitle: z.string().min(2, "Job title is required"),
    organization: z.string().min(2, "Organisation name is required"),
    industryId: z.number().min(1, "Please select an industry"),
    subIndustryId: z.number().min(1, "Please select a sub-industry"),
    communitySelections: z
        .array(z.object({ communityId: z.number(), subCommunityId: z.number() }))
        .min(1, "Select at least one community + sub-community"),
    preferredFrequency: z.string().min(1, "Please select a frequency"),
    preferredFormats: z.array(z.string()).min(1, "Select at least one format"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

/* ─────────────────────────────────────────────────────────────── */
/*  Component                                                     */
/* ─────────────────────────────────────────────────────────────── */

interface OnboardingWizardProps {
    returnTo?: string;
    mode?: "page" | "modal";
    onComplete?: () => void;
}

export default function OnboardingWizard({ returnTo = "/", mode = "page", onComplete }: OnboardingWizardProps) {
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* Taxonomy state */
    const [communities, setCommunities] = useState<Community[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);

    /* Selection state (not directly in RHF for toggle UX) */
    const [selectedCommunities, setSelectedCommunities] = useState<Map<number, Set<number>>>(new Map());
    const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(FORMATS));

    /* Consent – pre-ticked */
    const [consentAccepted, setConsentAccepted] = useState(true);

    /* Geo loading indicator */
    const [geoLoading, setGeoLoading] = useState(true);

    /* Country calling code for phone */
    const [dialCode, setDialCode] = useState("+91");

    const didMountIndustry = useRef(false);

    /* Derived user info */
    const primaryEmail = user?.emailAddresses?.[0]?.emailAddress || "";
    const hasRealEmail = Boolean(primaryEmail && !primaryEmail.endsWith("@phone.energdive.com"));
    const userPhone = typeof user?.publicMetadata?.phone === "string" ? user.publicMetadata.phone : "";

    /* ── React Hook Form ─────────────────────────────────────── */
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        clearErrors,
        formState: { errors },
    } = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            salutation: "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            phone: "",
            email: hasRealEmail ? primaryEmail : "",
            country: "India",
            state: "",
            jobTitle: "",
            organization: "",
            industryId: 0,
            subIndustryId: 0,
            communitySelections: [],
            preferredFrequency: DEFAULT_FREQUENCY,
            preferredFormats: Array.from(FORMATS),
        },
    });

    const selectedCountry = useWatch({ control, name: "country" });
    const selectedState = useWatch({ control, name: "state" });
    const selectedIndustryId = watch("industryId");
    const selectedSubIndustryId = watch("subIndustryId");
    const currentFrequency = normalizeFrequency(watch("preferredFrequency"));

    const states = useMemo(() => STATES_BY_COUNTRY[selectedCountry] || [], [selectedCountry]);
    const currentSubIndustries = useMemo(
        () => industries.find((i) => i.id === selectedIndustryId)?.sub_industries || [],
        [industries, selectedIndustryId],
    );

    /* ── Sync Clerk user data into form ──────────────────────── */
    useEffect(() => {
        if (!user) return;
        setValue("firstName", user.firstName || "");
        setValue("lastName", user.lastName || "");
        if (hasRealEmail) setValue("email", primaryEmail);
    }, [user, hasRealEmail, primaryEmail, setValue]);

    /* ── Reset state when country changes ────────────────────── */
    useEffect(() => {
        if (!states.length || !selectedState) return;
        if (!states.includes(selectedState)) {
            setValue("state", "");
        }
    }, [selectedState, setValue, states]);

    /* ── Reset sub-industry when industry changes ────────────── */
    useEffect(() => {
        if (!didMountIndustry.current) {
            didMountIndustry.current = true;
            return;
        }
        setValue("subIndustryId", 0, { shouldDirty: true, shouldValidate: false });
        clearErrors("subIndustryId");
    }, [clearErrors, selectedIndustryId, setValue]);

    useEffect(() => {
        if (Number(selectedSubIndustryId) > 0) clearErrors("subIndustryId");
    }, [clearErrors, selectedSubIndustryId]);

    /* ── Pre-set consent timestamp (pre-ticked) ──────────────── */
    useEffect(() => {
        const now = new Date();
        const istTime = new Date(now.getTime() + 330 * 60000);
        const istString = istTime.toISOString().replace("Z", "+05:30");
        localStorage.setItem("consent_timestamp", istString);
    }, []);

    /* ── Fetch IP geolocation for country + state ────────────── */
    useEffect(() => {
        async function fetchGeo() {
            try {
                const res = await fetch("https://ipapi.co/json/");
                if (!res.ok) throw new Error("Geo fetch failed");
                const data = await res.json();

                const countryName: string = data.country_name || "";
                const region: string = data.region || "";

                const matchedCountry = COUNTRIES.find(
                    (c) => c.name.toLowerCase() === countryName.toLowerCase(),
                );
                if (matchedCountry) {
                    setValue("country", matchedCountry.name);
                    setDialCode(matchedCountry.dial_code);

                    const countryStates = STATES_BY_COUNTRY[matchedCountry.name] || [];
                    if (region && countryStates.length > 0) {
                        const regionLower = region.toLowerCase();
                        // Try exact match first
                        let matchedState = countryStates.find(
                            (s) => s.toLowerCase() === regionLower,
                        );
                        // Fuzzy: check if ipapi region contains our state name or vice versa
                        if (!matchedState) {
                            matchedState = countryStates.find(
                                (s) => regionLower.includes(s.toLowerCase()) || s.toLowerCase().includes(regionLower),
                            );
                        }
                        if (matchedState) setValue("state", matchedState);
                    }
                } else if (data.country_calling_code) {
                    setDialCode(data.country_calling_code);
                }
            } catch (err) {
                console.warn("[ONBOARDING] GeoIP fetch failed:", err);
            } finally {
                setGeoLoading(false);
            }
        }
        fetchGeo();
    }, [setValue]);

    /* ── Fetch taxonomy data (communities + industries) ──────── */
    useEffect(() => {
        async function loadTaxonomy() {
            try {
                const [communityRes, industryRes] = await Promise.all([
                    fetch("/api/master/communities"),
                    fetch("/api/master/industries"),
                ]);
                if (!communityRes.ok || !industryRes.ok) throw new Error("API error");
                setCommunities(await communityRes.json());
                setIndustries(await industryRes.json());
            } catch (err) {
                console.error("Taxonomy load error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadTaxonomy();
    }, []);

    /* ── Helpers: sync community selections → RHF ────────────── */
    const syncCommunitySelections = useCallback(
        (map: Map<number, Set<number>>) => {
            const selections: { communityId: number; subCommunityId: number }[] = [];
            map.forEach((subIds, communityId) => {
                subIds.forEach((subCommunityId) => {
                    selections.push({ communityId, subCommunityId });
                });
            });
            setValue("communitySelections", selections, { shouldValidate: true });
        },
        [setValue],
    );

    const toggleCommunity = (communityId: number) => {
        setSelectedCommunities((prev) => {
            const next = new Map(prev);
            if (next.has(communityId)) {
                next.delete(communityId);
            } else {
                next.set(communityId, new Set());
            }
            syncCommunitySelections(next);
            return next;
        });
    };

    const toggleSubCommunity = (communityId: number, subCommunityId: number) => {
        setSelectedCommunities((prev) => {
            const next = new Map(prev);
            const current = next.get(communityId) || new Set<number>();
            const updated = new Set(current);
            if (updated.has(subCommunityId)) {
                updated.delete(subCommunityId);
            } else {
                updated.add(subCommunityId);
            }
            next.set(communityId, updated);
            syncCommunitySelections(next);
            return next;
        });
    };

    const toggleFormat = (format: string) => {
        setSelectedFormats((prev) => {
            const next = new Set(prev);
            if (next.has(format)) {
                next.delete(format);
            } else {
                next.add(format);
            }
            setValue("preferredFormats", Array.from(next), { shouldValidate: true });
            return next;
        });
    };

    const selectFrequency = (value: string) => {
        if (!FREQUENCIES.some((f) => f.value === value)) return;
        setValue("preferredFrequency", value, { shouldValidate: true });
    };

    const industrySelectProps = register("industryId", {
        valueAsNumber: true,
        onChange: () => clearErrors(["industryId", "subIndustryId"]),
    });

    const subIndustrySelectProps = register("subIndustryId", {
        valueAsNumber: true,
        onChange: (event) => {
            if (Number(event.target.value) > 0) clearErrors("subIndustryId");
        },
    });

    /* ── Submit handler ──────────────────────────────────────── */
    const onFormSubmit = async (data: OnboardingFormData) => {
        setIsSubmitting(true);

        const utmData = {
            utm_source: localStorage.getItem("utm_source"),
            utm_medium: localStorage.getItem("utm_medium"),
            utm_campaign: localStorage.getItem("utm_campaign"),
            utm_term: localStorage.getItem("utm_term"),
            utm_content: localStorage.getItem("utm_content"),
        };

        // Use form email if provided, otherwise Clerk email
        const emailToSubmit = data.email?.trim() || primaryEmail;

        // Combine dial code + phone number
        const rawPhone = data.phone?.trim() || "";
        const fullPhone = rawPhone ? `${dialCode}${rawPhone.replace(/^0+/, '')}` : "";

        const completeData = {
            ...data,
            ...utmData,
            phone: fullPhone,
            email: emailToSubmit,
            consentTimestamp: localStorage.getItem("consent_timestamp"),
        };

        try {
            const res = await fetch("/api/onboarding/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(completeData),
            });

            if (!res.ok) throw new Error("Failed to save profile");

            // Update Clerk's user profile with the name so it shows in menus
            try {
                await user?.update({
                    firstName: data.firstName,
                    lastName: data.lastName,
                });
            } catch (e) {
                console.warn("Could not update Clerk profile name:", e);
            }

            // Clean up stored redirect
            sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
            document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

            if (mode === "modal" && onComplete) {
                // In modal mode, just close the modal — user stays on current page
                onComplete();
                return;
            }

            // Page mode: redirect to the target
            let finalRedirect = getSafeRedirectPath(returnTo || "/");
            if (finalRedirect === "/") {
                const storedRedirect = sessionStorage.getItem(POST_AUTH_REDIRECT_STORAGE_KEY);
                const safeStoredRedirect = getSafeRedirectPath(storedRedirect);
                if (safeStoredRedirect !== "/") {
                    finalRedirect = safeStoredRedirect;
                }
            }

            window.location.href = finalRedirect;
        } catch (error) {
            console.error("Onboarding error:", error);
            alert("Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    /* ── Loading state ───────────────────────────────────────── */
    if (loading) {
        return (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-20"
                >
                    <Loader2 className="w-8 h-8 animate-spin text-[#0AB996]" />
                    <span className="ml-3 text-zinc-500">Loading…</span>
                </motion.div>
            </div>
        );
    }

    if (!communities.length || !industries.length) {
        return (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100 text-center py-20 text-zinc-500">
                <p>Failed to load data. Please refresh the page.</p>
            </div>
        );
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className={mode === "modal" ? "w-full bg-white overflow-hidden" : "w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100"}>
            {/* Progress Bar – always full */}
            <div className="h-1.5 bg-zinc-100 w-full">
                <div className="h-full bg-[#0AB996] w-full" />
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className={mode === "modal" ? "p-5 md:p-6 space-y-4" : "p-8 md:p-12 space-y-8"}>
                {/* ── Header ── */}
                {mode !== "modal" && (
                <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
                        Hey! Let us Know You well
                    </h2>
                    <p className="text-sm md:text-base text-zinc-500">
                        Confirm your identity and professional details.
                    </p>
                </div>
                )}

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 1 – Name Details                              */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "rounded-lg border border-zinc-200 bg-zinc-50/50 p-3" : "rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"}>
                    <div className={mode === "modal" ? "mb-2" : "mb-3"}>
                        <h3 className="text-sm font-semibold text-zinc-900">Name details</h3>
                        <p className="text-xs text-zinc-500">
                            This name will appear on your ENERGClub profile.
                        </p>
                    </div>
                    <div className={mode === "modal" ? "grid gap-3 sm:grid-cols-3 xl:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)]" : "grid gap-4 sm:grid-cols-3 xl:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)]"}>
                        <div className="min-w-0 space-y-1 sm:col-span-2 xl:col-span-1">
                            <label className="block text-sm font-medium text-zinc-700">Salutation</label>
                            <select
                                {...register("salutation")}
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20`}
                            >
                                <option value="">Select</option>
                                {SALUTATION_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-0 space-y-1">
                            <label className="block text-sm font-medium text-zinc-700">First Name</label>
                            <input
                                {...register("firstName")}
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20`}
                                placeholder="First name"
                            />
                            {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                        </div>
                        <div className="min-w-0 space-y-1">
                            <label className="block text-sm font-medium text-zinc-700">Last Name</label>
                            <input
                                {...register("lastName")}
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20`}
                                placeholder="Last name"
                            />
                            {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 2 – Contact (simple inputs, no verification)  */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "grid gap-3 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Email</label>
                        <input
                            {...register("email")}
                            type="email"
                            readOnly={hasRealEmail}
                            className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20 ${
                                hasRealEmail
                                    ? "bg-zinc-100 text-zinc-500 cursor-not-allowed"
                                    : "bg-white"
                            }`}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Phone Number</label>
                        <div className="flex">
                            <select
                                value={dialCode}
                                onChange={(e) => setDialCode(e.target.value)}
                                aria-label="Country dial code"
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-[90px] shrink-0 rounded-l-lg border border-r-0 border-zinc-200 bg-zinc-50 px-2 text-sm font-medium text-zinc-700 outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20`}
                            >
                                {COUNTRIES.map((c) => (
                                    <option key={c.code} value={c.dial_code}>
                                        {c.dial_code}
                                    </option>
                                ))}
                            </select>
                            <input
                                {...register("phone")}
                                type="tel"
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-r-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:border-[#0AB996] focus:ring-2 focus:ring-[#0AB996]/20`}
                                placeholder="9876543210"
                            />
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 3 – Location (auto-detected via IP)           */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "grid gap-3 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Country</label>
                        <select
                            {...register("country")}
                            className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:ring-2 focus:ring-[#0AB996]`}
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        {geoLoading && (
                            <p className="text-xs text-zinc-400 flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Detecting location…
                            </p>
                        )}
                        {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">State / Region</label>
                        {states.length > 0 ? (
                            <select
                                {...register("state")}
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 bg-white px-4 text-base outline-none transition-all focus:ring-2 focus:ring-[#0AB996]`}
                            >
                                <option value="">Select state / region</option>
                                {states.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                {...register("state")}
                                className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:ring-2 focus:ring-[#0AB996]`}
                                placeholder="State / region"
                            />
                        )}
                        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 4 – Professional Details                      */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "grid gap-3 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Job Title</label>
                        <input
                            {...register("jobTitle")}
                            className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0AB996]`}
                            placeholder="e.g. Senior Analyst"
                        />
                        {errors.jobTitle && <p className="text-red-500 text-xs">{errors.jobTitle.message}</p>}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Organisation</label>
                        <input
                            {...register("organization")}
                            className={`${mode === "modal" ? "h-10" : "h-12"} w-full rounded-lg border border-zinc-200 px-4 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0AB996]`}
                            placeholder="Organisation name"
                        />
                        {errors.organization && <p className="text-red-500 text-xs">{errors.organization.message}</p>}
                    </div>
                </div>

                {/* ── Visual divider ── */}
                <hr className="border-zinc-100" />

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 5 – Your Interests                            */}
                {/* ════════════════════════════════════════════════════════ */}
                <div>
                    <h2 className={mode === "modal" ? "text-lg font-bold text-zinc-900" : "text-2xl font-bold text-zinc-900"}>Your interests</h2>
                    <p className={mode === "modal" ? "text-zinc-500 text-sm mt-0.5" : "text-zinc-500 mt-1"}>
                        Pick the communities and briefings that should shape your ENERGClub feed.
                    </p>
                </div>

                {/* Communities & Sub-communities (Dropdowns) */}
                <div className={mode === "modal" ? "space-y-3" : "space-y-4"}>
                    {/* Community Dropdown */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Community</label>
                        <div className="relative">
                            <select
                                aria-label="Select a community"
                                value=""
                                onChange={(e) => {
                                    const communityId = Number(e.target.value);
                                    if (communityId && !selectedCommunities.has(communityId)) {
                                        toggleCommunity(communityId);
                                    }
                                }}
                                className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all bg-white appearance-none pr-10"
                            >
                                <option value="">Select a community</option>
                                {communities.map((c) => (
                                    <option key={c.id} value={c.id} disabled={selectedCommunities.has(c.id)}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Selected Communities Tags */}
                    {selectedCommunities.size > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {Array.from(selectedCommunities.keys()).map((communityId) => {
                                const community = communities.find((c) => c.id === communityId);
                                if (!community) return null;
                                return (
                                    <span
                                        key={communityId}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-[#0AB996]/10 border border-[#0AB996] text-[#0AB996]"
                                    >
                                        {community.name}
                                        <button
                                            type="button"
                                            onClick={() => toggleCommunity(communityId)}
                                            className="hover:text-red-500 transition-colors"
                                            aria-label={`Remove ${community.name}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Sub-Community Dropdowns for each selected community */}
                    {Array.from(selectedCommunities.entries()).map(([communityId, subCommunitySet]) => {
                        const community = communities.find((c) => c.id === communityId);
                        if (!community || community.sub_communities.length === 0) return null;

                        return (
                            <motion.div
                                key={communityId}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                            >
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-zinc-500">
                                        Sub-community for{" "}
                                        <span className="text-[#0AB996]">{community.name}</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            aria-label={`Select sub-community for ${community.name}`}
                                            value=""
                                            onChange={(e) => {
                                                const subId = Number(e.target.value);
                                                if (subId) {
                                                    toggleSubCommunity(communityId, subId);
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all bg-white appearance-none pr-10"
                                        >
                                            <option value="">Select sub-community</option>
                                            {community.sub_communities.map((sub) => (
                                                <option key={sub.id} value={sub.id} disabled={subCommunitySet.has(sub.id)}>
                                                    {sub.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Selected sub-community tags */}
                                {subCommunitySet.size > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-1">
                                        {Array.from(subCommunitySet).map((subId) => {
                                            const sub = community.sub_communities.find((s) => s.id === subId);
                                            if (!sub) return null;
                                            return (
                                                <span
                                                    key={subId}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#0AB996]/10 border border-[#0AB996]/40 text-[#0AB996]"
                                                >
                                                    {sub.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSubCommunity(communityId, subId)}
                                                        className="hover:text-red-500 transition-colors"
                                                        aria-label={`Remove ${sub.name}`}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    {errors.communitySelections && (
                        <p className="text-red-500 text-xs">{errors.communitySelections.message}</p>
                    )}
                </div>

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 6 – Industry                                  */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "grid gap-3 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Industry</label>
                        <div className="relative">
                            <select
                                {...industrySelectProps}
                                className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all bg-white appearance-none pr-10"
                            >
                                <option value={0}>Select your industry</option>
                                {industries.map((ind) => (
                                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                        {errors.industryId && (
                            <p className="text-red-500 text-xs">{errors.industryId.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">Sub-Industry</label>
                        <div className="relative">
                            <select
                                {...subIndustrySelectProps}
                                disabled={!selectedIndustryId}
                                className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-[#0AB996] focus:border-transparent outline-none transition-all bg-white disabled:bg-zinc-100 disabled:text-zinc-400 appearance-none pr-10"
                            >
                                <option value={0}>Select sub-industry</option>
                                {currentSubIndustries.map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                        {errors.subIndustryId && (
                            <p className="text-red-500 text-xs">{errors.subIndustryId.message}</p>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Section 7 – Frequency & Formats                       */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "grid gap-3 md:grid-cols-[0.8fr_1.2fr]" : "grid gap-5 md:grid-cols-[0.8fr_1.2fr]"}>
                    <div className={mode === "modal" ? "space-y-2" : "space-y-3"}>
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
                                        className={`relative px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                                            isActive
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
                            <p className="text-red-500 text-xs">{errors.preferredFrequency.message}</p>
                        )}
                    </div>

                    <div className={mode === "modal" ? "space-y-2" : "space-y-3"}>
                        <label className="block text-sm font-medium text-zinc-700 uppercase tracking-wider">
                            Preferences
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FORMATS.map((format) => {
                                const isActive = selectedFormats.has(format);
                                return (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => toggleFormat(format)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                                            isActive
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
                            <p className="text-red-500 text-xs">{errors.preferredFormats.message}</p>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Consent (pre-ticked)                                  */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "flex items-start gap-2 pt-1" : "flex items-start gap-2.5 pt-2"}>
                    <Checkbox
                        id="consent-checkbox"
                        checked={consentAccepted}
                        onCheckedChange={(checked) => {
                            const accepted = checked === true;
                            setConsentAccepted(accepted);
                            if (accepted) {
                                const now = new Date();
                                const istTime = new Date(now.getTime() + 330 * 60000);
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

                {/* ════════════════════════════════════════════════════════ */}
                {/*  Submit                                                */}
                {/* ════════════════════════════════════════════════════════ */}
                <div className={mode === "modal" ? "flex justify-end pt-4 border-t border-zinc-100" : "flex justify-end pt-6 border-t border-zinc-100"}>
                    <button
                        type="submit"
                        disabled={isSubmitting || !consentAccepted}
                        className="px-8 py-2.5 bg-[#0AB996] text-white font-semibold rounded-lg shadow-lg shadow-[#0AB996]/20 hover:bg-[#099c82] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : (
                            "Complete Setup"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
