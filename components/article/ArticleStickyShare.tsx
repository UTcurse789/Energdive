"use client";

import { useEffect, useState } from "react";
import { Share2, BookmarkPlus, MessageSquare } from "lucide-react";
import { ShareButton } from "../ui/share-button";

interface ArticleStickyShareProps {
    title: string;
    url: string;
}

export function ArticleStickyShare({ title, url }: ArticleStickyShareProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show the floating bar only after scrolling down a bit (e.g., past the main header)
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
        <div 
            className={`fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-zinc-200 p-3 flex items-center justify-center gap-6 sm:hidden transition-transform duration-300 ease-in-out shadow-[0_-4px_12px_rgba(0,0,0,0.05)] ${isVisible ? "translate-y-0" : "translate-y-full"}`}
        >
            <ShareButton
                title={title}
                url={url}
                className="flex flex-col items-center gap-1 text-gray-500 hover:text-teal-600 transition-colors"
                iconClassName="w-5 h-5"
                textClassName="text-[10px] font-medium"
            />
            
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-teal-600 transition-colors" title="Save for later">
                <BookmarkPlus className="w-5 h-5" />
                <span className="text-[10px] font-medium">Save</span>
            </button>
            
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-teal-600 transition-colors" title="Comments">
                <MessageSquare className="w-5 h-5" />
                <span className="text-[10px] font-medium">Discuss</span>
            </button>
        </div>
    );
}
