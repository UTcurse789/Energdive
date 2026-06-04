"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkPlus, MessageSquare, CheckCircle2 } from "lucide-react";
import { ShareButton } from "../ui/share-button";
import { AnimatePresence, motion } from "framer-motion";
import { SaveLoginPrompt } from "@/components/onboarding/save-login-prompt";
import { useArticleSave } from "@/hooks/use-article-save";

interface ArticleStickyShareProps {
    title: string;
    url: string;
}

export function ArticleStickyShare({ title, url }: ArticleStickyShareProps) {
    const [isVisible, setIsVisible] = useState(false);
    const saveButtonRef = useRef<HTMLButtonElement | null>(null);
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

    useEffect(() => {
        const toggleVisibility = () => {
            // Show the floating bar only after scrolling down a bit
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    return (
        <>
            <div 
                className={`fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-zinc-200 p-3 flex items-center justify-center gap-6 sm:hidden transition-transform duration-300 ease-in-out shadow-[0_-4px_12px_rgba(0,0,0,0.05)] ${isVisible ? "translate-y-0" : "translate-y-full"}`}
            >
                <ShareButton
                    title={title}
                    url={url}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-teal-600 transition-colors"
                    iconClassName="w-5 h-5"
                    textClassName="text-[10px] font-medium"
                    dropUp={true}
                />
                
                <button 
                    ref={saveButtonRef}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`relative flex flex-col items-center gap-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isSaved ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'}`} 
                    title={isSaved ? "Saved" : "Save for later"}
                >
                    {!isSaved && isGuest && (
                        <span className="absolute top-0 h-7 w-7 rounded-full bg-emerald-500/15 animate-pulse" />
                    )}
                    {isSaved ? <BookmarkPlus className="relative z-10 w-5 h-5 fill-current" /> : <BookmarkPlus className="relative z-10 w-5 h-5" />}
                    <span className="text-[10px] font-medium">{isSaving ? 'Saving' : isSaved ? 'Saved' : 'Save'}</span>
                </button>
                
                <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-teal-600 transition-colors" title="Comments">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Discuss</span>
                </button>
            </div>

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5 whitespace-nowrap"
                    >
                        <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                        <span className="font-medium text-sm">Your article is saved</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <SaveLoginPrompt
                anchorRef={saveButtonRef}
                loginHref={loginHref}
                open={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />
        </>
    );
}
