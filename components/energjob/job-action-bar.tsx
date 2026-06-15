"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Heart } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";

const STORAGE_KEY = "energjob-saved-jobs";

function readSavedJobs(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch (error) {
    console.error("[JobActionBar] Failed to read saved jobs", error);
    return [];
  }
}

function writeSavedJobs(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error("[JobActionBar] Failed to persist saved jobs", error);
  }
}

type JobActionBarProps = {
  jobId: number | string;
  shareTitle: string;
  shareText: string;
  shareUrl: string;
  className?: string;
  minimal?: boolean;
};

export default function JobActionBar({
  jobId,
  shareTitle,
  shareText,
  shareUrl,
  className = "",
  minimal = false,
}: JobActionBarProps) {
  const normalizedId = String(jobId);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readSavedJobs().includes(normalizedId));
  }, [normalizedId]);

  const toggleSaved = () => {
    const nextIds = readSavedJobs();
    const updatedIds = nextIds.includes(normalizedId)
      ? nextIds.filter((value) => value !== normalizedId)
      : [...nextIds, normalizedId];

    writeSavedJobs(updatedIds);
    setSaved(updatedIds.includes(normalizedId));
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`.trim()}>
      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={saved}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 text-sm font-bold text-[#121417] shadow-sm transition-all duration-200 hover:border-[#09B697]/40 hover:text-[#09B697] hover:shadow-md"
      >
        {saved ? (
          <Check className="h-4 w-4" />
        ) : minimal ? (
          <Heart className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {saved ? "Saved" : "Save"}
      </button>

      <ShareButton
        title={shareTitle}
        text={shareText}
        url={shareUrl}
        hideTextIcon={minimal}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white ${minimal ? 'w-11 px-0' : 'px-5'} text-sm font-bold text-[#121417] shadow-sm transition-all duration-200 hover:border-[#09B697]/40 hover:text-[#09B697] hover:shadow-md`}
        iconClassName="h-4 w-4"
        textClassName="text-sm font-bold"
      />
    </div>
  );
}
