"use client";

import { useEffect, useState } from "react";
import { Share2, BookmarkPlus, MessageSquare, CheckCircle2 } from "lucide-react";
import { ShareButton } from "../ui/share-button";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface ArticleStickyShareProps {
    title: string;
    url: string;
}

export function ArticleStickyShare({ title, url }: ArticleStickyShareProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Check if saved
        try {
            const savedArticles = JSON.parse(localStorage.getItem('saved_articles') || '[]');
            if (savedArticles.some((a: any) => a.url === url)) {
                setIsSaved(true);
            }
        } catch (e) {
            console.error("Error reading saved articles", e);
        }

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
    }, [url]);

    const handleSave = () => {
        if (isLoaded && !isSignedIn) {
            router.push("/auth?redirect_url=" + encodeURIComponent(window.location.href));
            return;
        }

        try {
            const savedArticles = JSON.parse(localStorage.getItem('saved_articles') || '[]');
            if (isSaved) {
                const updated = savedArticles.filter((a: any) => a.url !== url);
                localStorage.setItem('saved_articles', JSON.stringify(updated));
                setIsSaved(false);
            } else {
                savedArticles.push({ title, url, savedAt: new Date().toISOString() });
                localStorage.setItem('saved_articles', JSON.stringify(savedArticles));
                setIsSaved(true);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                // Dispatch event so other components can know
                window.dispatchEvent(new Event('saved_articles_updated'));
            }
        } catch (e) {
            console.error("Error saving article", e);
        }
    };

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
                    onClick={handleSave}
                    className={`flex flex-col items-center gap-1 transition-colors ${isSaved ? 'text-teal-600' : 'text-gray-500 hover:text-teal-600'}`} 
                    title={isSaved ? "Saved" : "Save for later"}
                >
                    {isSaved ? <BookmarkPlus className="w-5 h-5 fill-current" /> : <BookmarkPlus className="w-5 h-5" />}
                    <span className="text-[10px] font-medium">{isSaved ? 'Saved' : 'Save'}</span>
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
        </>
    );
}
