"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import posthog from "posthog-js";

interface UseArticleSaveOptions {
  title: string;
  url: string;
}

type SavedArticle = {
  title: string;
  url: string;
  savedAt: string;
};

function readSavedArticles() {
  try {
    return JSON.parse(
      window.localStorage.getItem("saved_articles") || "[]",
    ) as SavedArticle[];
  } catch {
    return [] as SavedArticle[];
  }
}

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

      const savedArticles = readSavedArticles();
      setIsSaved(savedArticles.some((article) => article.url === url));
    };

    syncSavedState();
    window.addEventListener("saved_articles_updated", syncSavedState);

    return () => {
      window.removeEventListener("saved_articles_updated", syncSavedState);
    };
  }, [isLoaded, isSignedIn, url]);

  const loginHref = useMemo(() => {
    if (typeof window === "undefined") {
      return `/auth?redirect_url=${encodeURIComponent(url)}`;
    }

    return `/auth?redirect_url=${encodeURIComponent(window.location.href)}`;
  }, [url]);

  const handleSave = async () => {
    if (isLoaded && !isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }

    if (isSaving) return;

    try {
      setIsSaving(true);

      if (isSignedIn) {
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
        }

        window.dispatchEvent(new Event("saved_articles_updated"));
        return;
      }

      const savedArticles = readSavedArticles();

      if (isSaved) {
        const updated = savedArticles.filter((article) => article.url !== url);
        window.localStorage.setItem("saved_articles", JSON.stringify(updated));
        setIsSaved(false);
      } else {
        savedArticles.push({ title, url, savedAt: new Date().toISOString() });
        window.localStorage.setItem("saved_articles", JSON.stringify(savedArticles));
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

  return {
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
