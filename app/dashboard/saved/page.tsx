"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Clock, ArrowRight, Trash2, CheckCircle2 } from "lucide-react";
import {
    clearPendingSavedArticle,
    clearPendingSaveQueryParam,
    getSavedItemToastMessage,
    readPendingSavedArticle,
    SAVED_ARTICLE_TOAST_MESSAGE,
} from "@/lib/pending-saved-article";

interface SavedArticle {
    id: number;
    title: string;
    url: string;
    savedAt: string;
}

export default function SavedArticlesPage() {
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveError, setSaveError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState(SAVED_ARTICLE_TOAST_MESSAGE);
    const processedPendingSaveRef = useRef(false);

    useEffect(() => {
        let toastTimer: number | undefined;

        const showSavedToast = () => {
            setShowToast(true);
            toastTimer = window.setTimeout(() => setShowToast(false), 3500);
        };

        const loadArticles = async (showLoading = true) => {
            try {
                if (showLoading) setIsLoading(true);
                const res = await fetch("/api/user/saved-articles", {
                    method: "GET",
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("Failed to load saved articles");

                const data = await res.json();
                setSavedArticles(Array.isArray(data.articles) ? data.articles : []);
            } catch (e) {
                console.error("Error loading saved articles", e);
            } finally {
                if (showLoading) setIsLoading(false);
            }
        };

        const processPendingSave = async () => {
            if (processedPendingSaveRef.current) return;
            processedPendingSaveRef.current = true;

            const pendingArticle = readPendingSavedArticle();
            if (!pendingArticle) {
                await loadArticles();
                clearPendingSaveQueryParam();
                return;
            }

            setIsLoading(true);
            setSaveError("");

            try {
                const res = await fetch("/api/user/saved-articles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: pendingArticle.title,
                        url: pendingArticle.url,
                    }),
                });

                if (!res.ok) throw new Error("Failed to save article");

                clearPendingSavedArticle();
                setToastMessage(getSavedItemToastMessage(pendingArticle.kind));
                showSavedToast();
                window.dispatchEvent(new Event("saved_articles_updated"));
            } catch (error) {
                console.error("Error saving pending article", error);
                setSaveError("We could not save this item. Please try again.");
            } finally {
                await loadArticles(false);
                clearPendingSaveQueryParam();
                setIsLoading(false);
            }
        };

        processPendingSave();

        const handleSavedArticlesUpdated = () => {
            void loadArticles(false);
        };

        window.addEventListener("saved_articles_updated", handleSavedArticlesUpdated);
        return () => {
            window.removeEventListener("saved_articles_updated", handleSavedArticlesUpdated);
            if (toastTimer) window.clearTimeout(toastTimer);
        };
    }, []);

    const handleRemove = async (url: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const res = await fetch("/api/user/saved-articles", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            if (!res.ok) throw new Error("Failed to remove saved article");

            const updated = savedArticles.filter(a => a.url !== url);
            setSavedArticles(updated);
            window.dispatchEvent(new Event('saved_articles_updated'));
        } catch (error) {
            console.error("Error removing saved article", error);
        }
    };

    const formatDate = (isoString: string) => {
        try {
            return new Intl.DateTimeFormat("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
            }).format(new Date(isoString));
        } catch {
            return "Recently";
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-serif mb-2 text-white">Saved Items</h1>
                <p className="text-zinc-400">Articles and jobs you&apos;ve bookmarked to view later.</p>
            </div>

            {saveError && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                    {saveError}
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-zinc-900/50 rounded-xl h-24 border border-white/5" />
                    ))}
                </div>
            ) : savedArticles.length === 0 ? (
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#00A651]/10 text-[#00A651] rounded-full flex items-center justify-center mb-4">
                        <Bookmark className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No saved items</h3>
                    <p className="text-zinc-400 max-w-sm mb-6">
                        When you see an interesting article or job, click Save to find it here later.
                    </p>
                    <Link href="/" className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-zinc-200 transition-colors">
                        Browse News <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {savedArticles.map((article) => (
                        <Link
                            href={article.url}
                            key={article.id}
                            className="group bg-zinc-900/40 hover:bg-zinc-800 border border-white/5 hover:border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white group-hover:text-[#00A651] transition-colors leading-snug mb-2 line-clamp-2">
                                    {article.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        Saved on {formatDate(article.savedAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                                <div className="text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1">
                                    Read <ArrowRight className="w-4 h-4" />
                                </div>
                                <button
                                    onClick={(e) => handleRemove(article.url, e)}
                                    className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                    title="Remove from saved"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showToast && (
                <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-white px-5 py-3 text-zinc-950 shadow-2xl ring-1 ring-black/10">
                    <CheckCircle2 className="h-5 w-5 text-[#00A651]" />
                    <span className="text-sm font-semibold">{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
