"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import posthog from "posthog-js";
import {
  clearPendingSavedArticle,
  persistPendingSavedArticle,
  SAVED_ARTICLE_REDIRECT_PATH,
} from "@/lib/pending-saved-article";

interface UseArticleSaveOptions {
  title: string;
  url: string;
}

type SavedArticle = {
  title: string;
  url: string;
  savedAt: string;
};

export function useArticleSave({ title, url }: UseArticleSaveOptions) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const syncSavedState = async () => {
      if (typeof window === "undefined") return;

      if (isLoaded && isSignedIn) {
        try {
          const res = await fetch("/api/user/saved-articles", {
            method: "GET",
            cache: "no-store",
          });
          if (!res.ok) throw new Error("Failed to load saved articles");
          const data = await res.json();
          const articles = Array.isArray(data.articles) ? data.articles : [];
          setIsSaved(articles.some((article: SavedArticle) => article.url === url));
        } catch (error) {
          console.error("Error loading saved state", error);
          setIsSaved(false);
        }
        return;
      }

      setIsSaved(false);
    };

    syncSavedState();
    window.addEventListener("saved_articles_updated", syncSavedState);

    return () => {
      window.removeEventListener("saved_articles_updated", syncSavedState);
    };
  }, [isLoaded, isSignedIn, url]);

  const loginHref = useMemo(() => {
    return `/auth?redirect_url=${encodeURIComponent(SAVED_ARTICLE_REDIRECT_PATH)}`;
  }, []);

  const handleSave = async () => {
    if (!isLoaded || isSaving) return;

    if (!isSignedIn) {
      persistPendingSavedArticle({ title, url });
      setShowLoginPrompt(true);
      posthog.capture("article_save_login_required", { article_title: title, article_url: url });
      return;
    }

    try {
      setIsSaving(true);

      if (isSaved) {
        const res = await fetch("/api/user/saved-articles", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) throw new Error("Failed to remove saved article");
        setIsSaved(false);
      } else {
        const res = await fetch("/api/user/saved-articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, url }),
        });
        if (!res.ok) throw new Error("Failed to save article");
        setIsSaved(true);
        setShowToast(true);
        window.setTimeout(() => setShowToast(false), 3000);
        posthog.capture("article_saved", { article_title: title, article_url: url });
      }

      window.dispatchEvent(new Event("saved_articles_updated"));
    } catch (error) {
      console.error("Error saving article", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginPromptDismiss = () => {
    clearPendingSavedArticle();
    setShowLoginPrompt(false);
  };

  const handleLoginPromptContinue = () => {
    setShowLoginPrompt(false);
  };

  return {
    authRedirectUrl: SAVED_ARTICLE_REDIRECT_PATH,
    handleLoginPromptContinue,
    handleLoginPromptDismiss,
    isGuest: isLoaded && !isSignedIn,
    isSaved,
    isSaving,
    loginHref,
    showLoginPrompt,
    showToast,
    handleSave,
    setShowLoginPrompt,
  };
}
