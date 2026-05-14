"use client";

import React, { useState, useRef, useEffect } from "react";
import { Share2, Check, Facebook, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";
import posthog from "posthog-js";

interface ShareButtonProps {
    title?: string;
    text?: string;
    url?: string;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    hideTextIcon?: boolean;
    dropUp?: boolean;
}

export function ShareButton({ title, text, url, className = "", iconClassName = "w-4 h-4", textClassName = "", hideTextIcon = false, dropUp = false }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const shareUrl = url || window.location.href;

        // Fallback: Copy to clipboard
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = shareUrl;
                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }

                document.body.removeChild(textArea);
            }
            setCopied(true);
            posthog.capture("content_shared", {
                platform: "copy_link",
                url: shareUrl,
                title: title || text || "",
            });
            setTimeout(() => {
                setCopied(false);
                setIsOpen(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleSocialShare = (e: React.MouseEvent<HTMLButtonElement>, platform: 'facebook' | 'twitter' | 'linkedin') => {
        e.preventDefault();
        e.stopPropagation();

        const currentUrl = url || window.location.href;
        const currentTitle = title || text || '';

        let shareLink = '';
        if (platform === 'facebook') {
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        } else if (platform === 'twitter') {
            const tweetText = `--> ${currentTitle} ${currentUrl} via @energdive`;
            shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        } else if (platform === 'linkedin') {
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
        }

        if (shareLink) {
            posthog.capture("content_shared", {
                platform,
                url: currentUrl,
                title: currentTitle,
            });
            window.open(shareLink, '_blank', 'noopener,noreferrer');
        }
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button
                onClick={toggleMenu}
                className={`flex items-center gap-2 transition-colors focus:outline-none ${className}`}
                title="Share"
            >
                <Share2 className={iconClassName || "w-4 h-4 text-inherit"} />
                {!hideTextIcon ? <span className={textClassName}>Share</span> : null}
            </button>

            {isOpen && (
                <div className={`absolute ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 rounded-md shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden flex flex-col p-1 gap-1 -translate-x-1/2 left-1/2 md:translate-x-0 md:left-auto md:right-0`}>
                    <button
                        onClick={(e) => handleSocialShare(e, 'facebook')}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors w-full text-left"
                    >
                        <Facebook className="w-4 h-4 text-[#1877F2]" />
                        Facebook
                    </button>
                    <button
                        onClick={(e) => handleSocialShare(e, 'twitter')}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors w-full text-left"
                    >
                        <Twitter className="w-4 h-4" style={{ color: "#1DA1F2" }} />
                        Twitter (X)
                    </button>
                    <button
                        onClick={(e) => handleSocialShare(e, 'linkedin')}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors w-full text-left"
                    >
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        LinkedIn
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors w-full text-left focus:outline-none"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>
            )}
        </div>
    );
}
