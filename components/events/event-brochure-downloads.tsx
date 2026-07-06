"use client";

import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
  clearPendingResourceDownload,
  type DownloadableResource,
  readPendingResourceDownload,
  requestTrackedResourceDownload,
  storePendingResourceDownload,
  triggerResourceFileDownload,
} from "@/components/resource-center/resource-download";
import type { EventResource } from "@/components/resource-center/types";

type EventBrochureDownloadsProps = {
  resources: EventResource[];
  returnTo: string;
};

export function EventBrochureDownloads({
  resources,
  returnTo,
}: EventBrochureDownloadsProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState("");

  const canDownload = isLoaded && isSignedIn;
  const resourcesByYear = useMemo(() => {
    const sortedResources = [...resources].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return sortedResources.reduce<Map<string, EventResource>>((acc, resource) => {
      const year = String(resource.year);
      if (!acc.has(year)) acc.set(year, resource);
      return acc;
    }, new Map());
  }, [resources]);
  const yearOptions = useMemo(
    () => Array.from(resourcesByYear.keys()).sort((a, b) => Number(b) - Number(a)),
    [resourcesByYear]
  );
  const selectedResource = selectedYear
    ? resourcesByYear.get(selectedYear)
    : undefined;

  useEffect(() => {
    if (!downloadNotice) return;
    const timer = window.setTimeout(() => setDownloadNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [downloadNotice]);

  const startDownload = useCallback(
    async (resource: DownloadableResource) => {
      if (downloadingSlug === resource.slug) return;

      setDownloadingSlug(resource.slug);
      try {
        const result = await requestTrackedResourceDownload(resource);

        if (result.status === "unauthenticated") {
          storePendingResourceDownload(resource);
          openAuthModal(returnTo);
          return;
        }

        if (result.status === "onboarding_required") {
          storePendingResourceDownload(resource);
          window.location.href = result.redirectUrl;
          return;
        }

        triggerResourceFileDownload(result.downloadUrl, result.fileName);
        setDownloadNotice(`${result.fileName} download started`);
      } catch (error) {
        console.error("[EVENT_BROCHURE_DOWNLOAD] Failed to start download:", error);
        const message =
          error instanceof Error ? error.message : "Unable to start this download";
        setDownloadNotice(message);
      } finally {
        setDownloadingSlug(null);
      }
    },
    [downloadingSlug, openAuthModal, returnTo]
  );

  useEffect(() => {
    if (!canDownload || resources.length === 0) return;

    const pending = readPendingResourceDownload();
    if (!pending) return;

    const hasPendingResource = resources.some(
      (resource) => resource.slug === pending.slug
    );
    if (!hasPendingResource) return;

    clearPendingResourceDownload();
    void startDownload(pending);
  }, [canDownload, resources, startDownload]);

  function requestDownload(resource: EventResource) {
    if (!resource.file_url) {
      setDownloadNotice("File is not available for this resource");
      return;
    }

    if (canDownload) {
      void startDownload(resource);
      return;
    }

    storePendingResourceDownload(resource);
    openAuthModal(returnTo);
  }

  if (resources.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3.5 border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
        Event Brochure
      </h2>

      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
        <label
          htmlFor="event-brochure-year"
          className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
        >
          Select Year
        </label>
        <select
          id="event-brochure-year"
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
        >
          <option value="">Choose year</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {selectedResource && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
            {selectedResource.title}
          </p>
        )}

        <button
          type="button"
          onClick={() => selectedResource && requestDownload(selectedResource)}
          disabled={!selectedResource || downloadingSlug === selectedResource.slug}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          <Download className="h-3.5 w-3.5" />
          {selectedResource && downloadingSlug === selectedResource.slug
            ? "Preparing..."
            : "Download Brochure"}
        </button>
      </div>

      {downloadNotice && (
        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {downloadNotice}
          </span>
        </div>
      )}
    </section>
  );
}
