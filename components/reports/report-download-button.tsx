"use client";

import { useAuth } from "@clerk/nextjs";
import { Download } from "lucide-react";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useEffect, useState } from "react";

interface ReportDownloadButtonProps {
  slug: string;
  title: string;
  downloadUrl: string;
}

export function ReportDownloadButton({ slug, title, downloadUrl }: ReportDownloadButtonProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const canDownload = isLoaded && isSignedIn;

  function startDownload() {
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setDownloadNotice("Download started");

    // Save to dashboard saved articles
    fetch("/api/user/saved-articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        url: `/reports/${slug}`,
      }),
    }).catch(() => {});
  }

  // After auth redirect: auto-download pending resource
  useEffect(() => {
    if (!canDownload) return;

    const pending = localStorage.getItem("report_pending_download");
    if (!pending) return;

    localStorage.removeItem("report_pending_download");
    try {
      const data = JSON.parse(pending) as {
        slug: string;
        title: string;
        downloadUrl: string;
      };
      // Only auto-download if this is the same report
      if (data.slug === slug && data.downloadUrl) {
        const anchor = document.createElement("a");
        anchor.href = data.downloadUrl;
        anchor.download = "";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        fetch("/api/user/saved-articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            url: `/reports/${data.slug}`,
          }),
        }).catch(() => {});
      }
    } catch {}
  }, [canDownload, slug]);

  function requestDownload() {
    if (canDownload) {
      startDownload();
      return;
    }

    // Store pending download for after auth
    localStorage.setItem(
      "report_pending_download",
      JSON.stringify({
        slug,
        title,
        downloadUrl,
      })
    );
    openAuthModal(`/reports/${slug}`);
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={requestDownload}
        className="group mb-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00A651] py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:bg-white hover:text-zinc-900"
      >
        <Download className="h-3.5 w-3.5" />
        Download Report
      </button>
      {downloadNotice && (
        <p className="text-center text-[11px] font-semibold text-emerald-400">
          {downloadNotice}
        </p>
      )}
    </div>
  );
}
