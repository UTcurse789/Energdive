"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { ShareButton } from "@/components/ui/share-button";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
  persistPendingSavedArticle,
  SAVED_ARTICLE_REDIRECT_PATH,
  SAVED_JOB_TOAST_MESSAGE,
} from "@/lib/pending-saved-article";

type JobActionBarProps = {
  jobId: number | string;
  shareTitle: string;
  shareText: string;
  shareUrl: string;
  className?: string;
  minimal?: boolean;
};

export default function JobActionBar({
  shareTitle,
  shareText,
  shareUrl,
  className = "",
  minimal = false,
}: JobActionBarProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    const syncSavedState = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setSaved(false);
        return;
      }

      try {
        const res = await fetch("/api/user/saved-articles", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load saved jobs");
        const data = await res.json();
        const articles = Array.isArray(data.articles) ? data.articles : [];
        setSaved(articles.some((item: { url?: string }) => item.url === shareUrl));
      } catch (error) {
        console.error("[JobActionBar] Failed to load saved jobs", error);
        setSaved(false);
      }
    };

    void syncSavedState();
    window.addEventListener("saved_articles_updated", syncSavedState);

    return () => {
      window.removeEventListener("saved_articles_updated", syncSavedState);
    };
  }, [isLoaded, isSignedIn, shareUrl]);

  const toggleSaved = async () => {
    if (!isLoaded || saving) return;

    if (!isSignedIn) {
      persistPendingSavedArticle({
        title: shareTitle,
        url: shareUrl,
        kind: "job",
      });
      openAuthModal(SAVED_ARTICLE_REDIRECT_PATH);
      return;
    }

    setSaving(true);

    try {
      if (saved) {
        const res = await fetch("/api/user/saved-articles", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: shareUrl }),
        });
        if (!res.ok) throw new Error("Failed to remove saved job");
        setSaved(false);
      } else {
        const res = await fetch("/api/user/saved-articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: shareTitle, url: shareUrl }),
        });
        if (!res.ok) throw new Error("Failed to save job");
        setSaved(true);
        setShowToast(true);
        window.setTimeout(() => setShowToast(false), 3000);
      }

      window.dispatchEvent(new Event("saved_articles_updated"));
    } catch (error) {
      console.error("[JobActionBar] Failed to toggle saved job", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-3 ${className}`.trim()}>
        <button
          type="button"
          onClick={toggleSaved}
          aria-pressed={saved}
          disabled={saving || !isLoaded}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved && <Check className="h-4 w-4" />}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>

        <ShareButton
          title={shareTitle}
          text={shareText}
          url={shareUrl}
          hideTextIcon={minimal}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white ${minimal ? 'w-11 px-0' : 'px-5'} text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-neutral-50 transition-colors`}
          iconClassName="h-4 w-4"
          textClassName="text-sm font-semibold"
        />
      </div>

      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-gray-900 px-5 py-3 text-white shadow-xl">
          <Check className="h-5 w-5 text-[#00A651]" />
          <span className="text-sm font-medium">{SAVED_JOB_TOAST_MESSAGE}</span>
        </div>
      )}
    </>
  );
}
