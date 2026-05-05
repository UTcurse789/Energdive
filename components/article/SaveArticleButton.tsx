"use client";

import { useState, useEffect } from "react";
import { BookmarkPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface SaveArticleButtonProps {
    title: string;
    url: string;
}

export function SaveArticleButton({ title, url }: SaveArticleButtonProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        try {
            const savedArticles = JSON.parse(localStorage.getItem('saved_articles') || '[]');
            if (savedArticles.some((a: any) => a.url === url)) {
                setIsSaved(true);
            }
        } catch (e) {
            console.error("Error reading saved articles", e);
        }
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
                window.dispatchEvent(new Event('saved_articles_updated'));
            }
        } catch (e) {
            console.error("Error saving article", e);
        }
    };

    return (
        <>
            <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 font-medium text-sm border px-4 py-2 rounded-full shadow-sm transition-colors ${
                    isSaved
                        ? "text-[#00A651] border-[#00A651]/30 bg-[#00A651]/5 hover:bg-[#00A651]/10"
                        : "text-gray-600 hover:text-gray-900 border-gray-200 bg-white hover:bg-gray-50"
                }`}
                title={isSaved ? "Saved" : "Save for later"}
            >
                <BookmarkPlus className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
            </button>

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
