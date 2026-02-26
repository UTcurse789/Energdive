"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
    title?: string;
    text?: string;
    url?: string;
    className?: string;
    iconClassName?: string;
    hideTextIcon?: boolean;
}

export function ShareButton({ title, text, url, className = "", iconClassName = "w-4 h-4", hideTextIcon = false }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareData = {
            title: title || document.title,
            text: text || "Check this out!",
            url: url || window.location.href,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareData.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className={`flex items-center gap-2 transition-colors ${className}`}
            title="Share"
        >
            {copied ? <Check className={iconClassName || "w-4 h-4 text-green-500"} /> : <Share2 className={iconClassName || "w-4 h-4 text-inherit"} />}
            {!hideTextIcon ? <span>{copied ? "Copied!" : "Share"}</span> : (copied ? "Copied!" : "Share")}
        </button>
    );
}
