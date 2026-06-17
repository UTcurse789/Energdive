"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePostHog } from "@posthog/react";

const DISMISSAL_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const POPUP_DELAY_MS = 5 * 1000; // 5 seconds
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

interface CurrentIssue {
    title: string;
    subTitle: string;
    month: string;
    year: string;
    volume: string;
    issueNumber: string;
    coverImage: string;
    slug: string;
}

export default function AuthPromptModal() {
    const { isLoaded, isSignedIn } = useAuth();
    const [show, setShow] = useState(false);
    const [currentIssue, setCurrentIssue] = useState<CurrentIssue | null>(null);
    const pathname = usePathname();
    const posthog = usePostHog();

    // Fetch current/latest issue
    useEffect(() => {
        async function fetchCurrentIssue() {
            try {
                const res = await fetch(
                    `${STRAPI_URL}/api/issues?populate=CoverImage&pagination[pageSize]=100`,
                    { cache: "no-store" }
                );
                if (!res.ok) return;
                const json = await res.json();
                if (!json.data || !Array.isArray(json.data)) return;

                const monthOrder: Record<string, number> = {
                    january: 1, february: 2, fbruary: 2, march: 3, april: 4, may: 5, june: 6,
                    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
                };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mapped = json.data.map((item: any) => {
                    const d = item.attributes || item;
                    const month = String(d.Month || d.month || "").trim();
                    const year = String(d.Year || d.year || "").trim();
                    const coverImg = d.CoverImage?.[0]?.url || d.CoverImage?.url || "/Energdive-Logo.png";
                    const finalCoverImage = coverImg.startsWith("http") ? coverImg : `${STRAPI_URL}${coverImg}`;
                    const isCurrent = d.is_current_issue === true || d.is_current_issue === "true";

                    return {
                        title: d.Title || `${month} ${year}`,
                        subTitle: String(d.sub_title || d.subTitle || ""),
                        month,
                        year,
                        volume: String(d.Volume || ""),
                        issueNumber: String(d.IssueNumber || d.Number || ""),
                        coverImage: finalCoverImage,
                        slug: d.slug || `${month.toLowerCase()}-${year}`,
                        isCurrent,
                        monthIdx: monthOrder[month.toLowerCase()] || 0,
                        yearNum: parseInt(year, 10) || 0,
                    };
                });

                // Sort: current issue first, then latest by year/month
                mapped.sort((a: { isCurrent: boolean; yearNum: number; monthIdx: number }, b: { isCurrent: boolean; yearNum: number; monthIdx: number }) => {
                    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
                    if (a.yearNum !== b.yearNum) return b.yearNum - a.yearNum;
                    return b.monthIdx - a.monthIdx;
                });

                if (mapped.length > 0) {
                    const top = mapped[0];
                    setCurrentIssue({
                        title: top.title,
                        subTitle: top.subTitle,
                        month: top.month,
                        year: top.year,
                        volume: top.volume,
                        issueNumber: top.issueNumber,
                        coverImage: top.coverImage,
                        slug: top.slug,
                    });
                }
            } catch (err) {
                console.error("[AuthPromptModal] Failed to fetch current issue", err);
            }
        }

        fetchCurrentIssue();
    }, []);

    useEffect(() => {
        // Only run on the client, and only if auth is loaded and user is NOT signed in
        if (!isLoaded || isSignedIn) return;

        // Don't show modal on auth pages
        if (pathname?.startsWith("/auth")) return;

        // Check if previously dismissed within the cooldown period
        const dismissedAt = localStorage.getItem("auth_prompt_dismissed_at");
        if (dismissedAt) {
            const timeSinceDismissal = Date.now() - parseInt(dismissedAt, 10);
            if (timeSinceDismissal < DISMISSAL_COOLDOWN_MS) {
                return; // Still in cooldown, do not show
            }
        }

        // Set a timer to show the popup after 5 seconds
        const timer = setTimeout(() => {
            setShow(true);
        }, POPUP_DELAY_MS);

        return () => clearTimeout(timer);
    }, [isLoaded, isSignedIn, pathname]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("auth_prompt_dismissed_at", Date.now().toString());
    };

    const coverImage = currentIssue?.coverImage || "/image.png";
    const issueLabel = currentIssue
        ? `${currentIssue.month} ${currentIssue.year}`
        : "";
    const volumeLabel = currentIssue?.volume && currentIssue?.issueNumber
        ? `Volume ${currentIssue.volume}, Issue ${currentIssue.issueNumber.replace(/number/i, "").trim()}`
        : "";

    return (
        <AnimatePresence>
            {show && (
                <div className="hidden md:flex fixed inset-0 z-100 items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm">
                    {/* Backdrop click to dismiss */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                        className="relative z-10 w-full max-w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Close Button (X) */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 z-20 p-2 bg-white/50 backdrop-blur-md rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shadow-sm"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image Section — Current Issue Cover */}
                        <div className="relative w-full h-56 md:h-auto md:w-5/12 shrink-0 bg-zinc-100 flex items-center justify-center p-4 md:p-6">
                            <div className="relative w-full h-full max-w-[240px] md:max-w-none aspect-[3/4]">
                                <Image
                                    src={coverImage}
                                    alt={currentIssue ? `${issueLabel} Cover` : "Energy Insights"}
                                    fill
                                    style={{ objectFit: "contain" }}
                                    sizes="(max-width: 768px) 240px, 320px"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-8 md:p-12 flex flex-col justify-center flex-1 bg-white">
                            {/* Dynamic issue info */}
                            {currentIssue ? (
                                <>
                                    {volumeLabel && (
                                        <p className="text-xs uppercase tracking-widest text-zinc-400 font-sans mb-2">
                                            {volumeLabel}
                                        </p>
                                    )}
                                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 font-serif leading-tight mb-2">
                                        {issueLabel}
                                    </h2>
                                    {currentIssue.subTitle && (
                                        <p className="text-lg md:text-xl text-zinc-700 font-serif italic leading-snug mb-4">
                                            {currentIssue.subTitle}
                                        </p>
                                    )}
                                    <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                                        Sign in to read full articles, download the issue PDF, and access exclusive energy intelligence from ENERGDIVE.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 font-serif leading-tight mb-4">
                                        Unlock Premium Energy Insights
                                    </h2>
                                    <p className="text-zinc-600 leading-relaxed mb-8">
                                        Connect with the strategic energy intelligence platform. Register or log in to access exclusive articles, data analysis, and reports from ENERGDIVE.
                                    </p>
                                </>
                            )}

                            <div className="flex flex-col gap-4">
                                {/* Primary CTA */}
                                <Link
                                    href="/auth"
                                    onClick={() => {
                                        handleDismiss();
                                        if (posthog) {
                                            posthog.capture("signup_button_clicked", {
                                                timestamp: new Date().toISOString(),
                                                path: window.location.pathname,
                                            });
                                        }
                                    }}
                                    className="w-full h-12 rounded-xl bg-[#0AB996] hover:bg-[#099c82] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0AB996]/20 active:scale-[0.98]"
                                >
                                    REGISTER / LOGIN
                                    <span className="text-lg">→</span>
                                </Link>

                                {/* Secondary Action */}
                                <button
                                    onClick={handleDismiss}
                                    className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-800"
                                >
                                    No, Thanks
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
