"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { BookmarkPlus, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SaveLoginPrompt } from "@/components/onboarding/save-login-prompt";
import { useArticleSave } from "@/hooks/use-article-save";
import { ONBOARDING_KEYS, isArticlePath, isSessionFlagSet, setSessionFlag } from "@/lib/onboarding-storage";

interface SaveArticleButtonProps {
    title: string;
    url: string;
}

export function SaveArticleButton({ title, url }: SaveArticleButtonProps) {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const pathname = usePathname();
    const {
        handleSave,
        isGuest,
        isSaving,
        isSaved,
        loginHref,
        showLoginPrompt,
        showToast,
        setShowLoginPrompt,
    } = useArticleSave({ title, url });

    const handleSaveClick = () => {
        handleSave();
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleSaveClick}
                disabled={isSaving}
                className={`group relative flex items-center gap-1.5 font-medium text-sm border px-4 py-2 rounded-full shadow-sm transition-all duration-200 ${
                    isSaved
                        ? "text-[#00A651] border-[#00A651]/30 bg-[#00A651]/5 hover:bg-[#00A651]/10"
                        : "text-gray-600 hover:text-gray-900 border-gray-200 bg-white hover:bg-gray-50 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
                title={isSaved ? "Saved" : "Save for later"}
            >
                <span className="relative flex h-4 w-4 items-center justify-center">
                    {isGuest && !isSaved && (
                        <span className="absolute inset-[-4px] rounded-full bg-emerald-500/15 animate-pulse" />
                    )}
                    <BookmarkPlus className={`relative z-10 w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                </span>
                {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
            </button>

            <SaveLoginPrompt
                anchorRef={buttonRef}
                loginHref={loginHref}
                open={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5"
                    >
                        <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                        <span className="font-medium text-sm">Your article is saved</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
