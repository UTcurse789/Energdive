"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

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
  const [showToast, setShowToast] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const syncSavedState = () => {
      if (typeof window === "undefined") return;

      const savedArticles = readSavedArticles();
      setIsSaved(savedArticles.some((article) => article.url === url));
    };

    syncSavedState();
    window.addEventListener("saved_articles_updated", syncSavedState);

    return () => {
      window.removeEventListener("saved_articles_updated", syncSavedState);
    };
  }, [url]);

  const loginHref = useMemo(() => {
    if (typeof window === "undefined") {
      return `/auth?redirect_url=${encodeURIComponent(url)}`;
    }

    return `/auth?redirect_url=${encodeURIComponent(window.location.href)}`;
  }, [url]);

  const handleSave = () => {
    if (isLoaded && !isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }

    try {
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
      }

      window.dispatchEvent(new Event("saved_articles_updated"));
    } catch (error) {
      console.error("Error saving article", error);
    }
  };

  return {
    isGuest: isLoaded && !isSignedIn,
    isSaved,
    loginHref,
    showLoginPrompt,
    showToast,
    handleSave,
    setShowLoginPrompt,
  };
}
