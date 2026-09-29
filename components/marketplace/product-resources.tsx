"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams, usePathname } from "next/navigation";
import { FileText, CheckCircle2 } from "lucide-react";
import { CompanyResource } from "@/data/marketplace/types";
import { ResourceCard } from "./resource-card";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { triggerResourceFileDownload } from "@/components/resource-center/resource-download";
import { MARKETPLACE_PENDING_DOWNLOAD_KEY } from "./company-resource-hub";

interface ProductResourcesProps {
  resources?: CompanyResource[];
  productName: string;
  productSlug: string;
}

export function ProductResources({
  resources = [],
  productName,
  productSlug,
}: ProductResourcesProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const autoDownloadTriggeredRef = useRef(false);

  // Clear notice after 4 seconds
  useEffect(() => {
    if (!downloadNotice) return;
    const timer = setTimeout(() => setDownloadNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [downloadNotice]);

  // Execute download
  const executeDownload = useCallback((resource: CompanyResource) => {
    try {
      const fileName = resource.fileName || `${resource.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      triggerResourceFileDownload(resource.file, fileName);
      setDownloadNotice(`"${resource.title}" download started successfully.`);
    } catch (error) {
      console.error("[PRODUCT_RESOURCE_DOWNLOAD_ERROR]", error);
      setDownloadNotice(`Failed to start download for "${resource.title}".`);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Handle user clicking [ Download ]
  const handleDownload = useCallback(
    (resource: CompanyResource) => {
      if (isLoaded && !isSignedIn) {
        try {
          localStorage.setItem(
            MARKETPLACE_PENDING_DOWNLOAD_KEY,
            JSON.stringify({
              id: resource.id,
              productSlug,
              title: resource.title,
              file: resource.file,
              fileName: resource.fileName,
            })
          );
        } catch (e) {
          console.warn("[ProductResources] Failed to write localStorage:", e);
        }

        const redirectPath = `${pathname}?download_target=${encodeURIComponent(resource.id)}`;
        openAuthModal(redirectPath);
        return;
      }

      setDownloadingId(resource.id);
      executeDownload(resource);
    },
    [isLoaded, isSignedIn, productSlug, pathname, openAuthModal, executeDownload]
  );

  // Auto-continue download after login redirect
  useEffect(() => {
    if (!isLoaded || !isSignedIn || autoDownloadTriggeredRef.current) return;

    const targetIdFromQuery = searchParams.get("download_target");
    let targetResourceId = targetIdFromQuery;

    if (!targetResourceId) {
      try {
        const stored = localStorage.getItem(MARKETPLACE_PENDING_DOWNLOAD_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id && parsed.productSlug === productSlug) {
            targetResourceId = parsed.id;
          }
        }
      } catch (e) {
        console.warn("[ProductResources] Failed to read localStorage:", e);
      }
    }

    if (targetResourceId) {
      const matchingResource = resources.find((r) => r.id === targetResourceId);
      if (matchingResource) {
        autoDownloadTriggeredRef.current = true;
        try {
          localStorage.removeItem(MARKETPLACE_PENDING_DOWNLOAD_KEY);
        } catch {}

        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", window.location.pathname);
        }

        setDownloadingId(matchingResource.id);
        executeDownload(matchingResource);
      }
    }
  }, [isLoaded, isSignedIn, searchParams, productSlug, resources, executeDownload]);

  // If no resources, omit section completely
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <section id="product-documents-and-catalogues" className="pt-2">
      {/* Toast Notice */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-zinc-900 text-white p-4 rounded-xl shadow-2xl border border-zinc-700 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#00A651] shrink-0" />
          <p className="text-xs font-semibold leading-normal">{downloadNotice}</p>
        </div>
      )}

      <div className="flex items-end justify-between border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Official Technical Assets for {productName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
            Product Information & Catalogues{" "}
            <span className="text-sm sm:text-base font-bold text-zinc-400 font-mono ml-1">
              · {resources.length}
            </span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((item) => (
          <ResourceCard
            key={item.id}
            resource={item}
            onDownload={handleDownload}
            isDownloading={downloadingId === item.id}
            isAuthenticated={Boolean(isLoaded && isSignedIn)}
          />
        ))}
      </div>
    </section>
  );
}
