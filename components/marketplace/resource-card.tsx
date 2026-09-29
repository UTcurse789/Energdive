"use client";

import { Download, FileCog, FileText, FolderArchive, Loader2, Lock, Presentation, Ruler, Sparkles } from "lucide-react";
import { CompanyResource } from "@/data/marketplace/types";

interface ResourceCardProps {
  resource: CompanyResource;
  onDownload?: (resource: CompanyResource) => void;
  isDownloading?: boolean;
  isAuthenticated?: boolean;
  customCtaLabel?: string;
}

function resourceVisual(resource: CompanyResource) {
  if (resource.type === "Technical Document") return { label: "Spec sheet", icon: FileCog };
  if (resource.type === "Product Catalogue") return { label: "Catalogue", icon: Ruler };
  if (resource.type === "Presentation") return { label: "Presentation", icon: Presentation };
  if (resource.fileType === "ZIP") return { label: "CAD / archive", icon: FolderArchive };
  return { label: resource.fileType || "Document", icon: FileText };
}

export function ResourceCard({ resource, onDownload, isDownloading = false, isAuthenticated = false, customCtaLabel }: ResourceCardProps) {
  const visual = resourceVisual(resource);
  const Icon = visual.icon;
  const cta = customCtaLabel || `Download ${resource.fileType || "file"}`;

  return (
    <article className="group flex min-h-[250px] flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00A651]/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#00A651]/15 bg-[#00A651]/7 text-[#00A651]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-1 font-mono text-[10px] font-semibold text-zinc-500">{resource.fileType || "FILE"}</span>
          {resource.fileSize && <span className="text-[10px] font-mono text-zinc-400">{resource.fileSize}</span>}
        </div>
      </div>

      <div className="mt-5 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#00A651]">{visual.label}</p>
        <h3 className="mt-2 font-sans text-[15px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-[#00A651]">{resource.title}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500">{resource.description}</p>
        {resource.productName && <span className="mt-3 inline-flex max-w-full items-center gap-1 rounded bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600"><Sparkles className="h-3 w-3 shrink-0 text-[#00A651]" /><span className="truncate">{resource.productName}</span></span>}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
        <span className="text-[10px] text-zinc-400">{resource.date || "Vendor library"}</span>
        <button type="button" onClick={() => onDownload?.(resource)} disabled={isDownloading} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-zinc-800 transition-colors hover:text-[#00A651] disabled:text-zinc-400">
          {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAuthenticated ? <Download className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {isDownloading ? "Preparing" : cta}
        </button>
      </div>
    </article>
  );
}
