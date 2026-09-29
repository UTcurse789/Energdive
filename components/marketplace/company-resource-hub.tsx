"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronDown, FileText, Search, SlidersHorizontal, Video } from "lucide-react";
import { CompanyResource, VideoResource } from "@/data/marketplace/types";
import { EmptyState } from "./empty-state";
import { ResourceCard } from "./resource-card";
import { VideoCard } from "./video-card";
import { VideoModal } from "./video-modal";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { triggerResourceFileDownload } from "@/components/resource-center/resource-download";

export const MARKETPLACE_PENDING_DOWNLOAD_KEY = "marketplace_pending_download";

type AssetKind = "all" | "documents" | "videos";
type SortOrder = "recent" | "title" | "size";

interface CompanyResourceHubProps {
  presentations?: CompanyResource[];
  videos?: VideoResource[];
  brochures?: CompanyResource[];
  productResources?: CompanyResource[];
  companyName: string;
  companySlug: string;
  defaultKind?: AssetKind;
}

const documentGroups = ["Presentation", "Company Brochure", "Product Catalogue", "Product Brochure", "Product Information", "Technical Document"];

export function CompanyResourceHub({
  presentations = [],
  videos = [],
  brochures = [],
  productResources = [],
  companyName,
  companySlug,
  defaultKind = "all",
}: CompanyResourceHubProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [kind, setKind] = useState<AssetKind>(defaultKind);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [activeVideo, setActiveVideo] = useState<VideoResource | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const autoDownloadTriggeredRef = useRef(false);

  const documents = useMemo(
    () => [...presentations, ...brochures, ...productResources],
    [presentations, brochures, productResources]
  );
  const allItems = useMemo(
    () => [
      ...documents.map((item) => ({ ...item, assetKind: "document" as const })),
      ...videos.map((item) => ({ ...item, assetKind: "video" as const })),
    ],
    [documents, videos]
  );
  const availableFormats = useMemo(
    () => Array.from(new Set(documents.map((item) => item.fileType))).sort(),
    [documents]
  );

  useEffect(() => {
    if (!downloadNotice) return;
    const timer = window.setTimeout(() => setDownloadNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [downloadNotice]);

  const executeDownload = useCallback((resource: CompanyResource) => {
    try {
      const fileName = resource.fileName || `${resource.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      triggerResourceFileDownload(resource.file, fileName);
      setDownloadNotice(`Download started: ${resource.title}`);
    } catch (error) {
      console.error("[MARKETPLACE_DOWNLOAD_ERROR]", error);
      setDownloadNotice(`Unable to start download: ${resource.title}`);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleDownload = useCallback(
    (resource: CompanyResource) => {
      if (isLoaded && !isSignedIn) {
        localStorage.setItem(
          MARKETPLACE_PENDING_DOWNLOAD_KEY,
          JSON.stringify({ id: resource.id, companySlug, file: resource.file, fileName: resource.fileName })
        );
        openAuthModal(`${pathname}?download_target=${encodeURIComponent(resource.id)}`);
        return;
      }
      setDownloadingId(resource.id);
      executeDownload(resource);
    },
    [companySlug, executeDownload, isLoaded, isSignedIn, openAuthModal, pathname]
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || autoDownloadTriggeredRef.current) return;
    const targetId = searchParams.get("download_target");
    if (!targetId) return;
    const matchingResource = documents.find((resource) => resource.id === targetId);
    if (!matchingResource) return;
    autoDownloadTriggeredRef.current = true;
    localStorage.removeItem(MARKETPLACE_PENDING_DOWNLOAD_KEY);
    window.history.replaceState({}, "", window.location.pathname);
    setDownloadingId(matchingResource.id);
    executeDownload(matchingResource);
  }, [documents, executeDownload, isLoaded, isSignedIn, searchParams]);

  const toggle = (value: string, values: string[], setValues: (values: string[]) => void) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };
  const resetFilters = () => {
    setKind(defaultKind);
    setSearchQuery("");
    setSelectedGroups([]);
    setSelectedFormats([]);
    setSortOrder("recent");
  };
  const query = searchQuery.toLowerCase().trim();
  const filteredItems = allItems
    .filter((item) => kind === "all" || (kind === "documents" ? item.assetKind === "document" : item.assetKind === "video"))
    .filter((item) => !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query))
    .filter((item) => item.assetKind === "video" || selectedGroups.length === 0 || selectedGroups.includes(item.type))
    .filter((item) => item.assetKind === "video" || selectedFormats.length === 0 || selectedFormats.includes(item.fileType))
    .sort((a, b) => {
      if (sortOrder === "title") return a.title.localeCompare(b.title);
      if (sortOrder === "size") {
        const aSize = a.assetKind === "document" ? Number.parseFloat(a.fileSize || "0") : 0;
        const bSize = b.assetKind === "document" ? Number.parseFloat(b.fileSize || "0") : 0;
        return bSize - aSize;
      }
      return (b.date || "").localeCompare(a.date || "");
    });

  if (allItems.length === 0) return null;

  const filterSection = (label: string, content: React.ReactNode, defaultOpen = true) => (
    <details open={defaultOpen} className="border-b border-zinc-100 py-4 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.11em] text-zinc-700">
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </summary>
      <div className="mt-3 space-y-2">{content}</div>
    </details>
  );

  return (
    <section id="company-resource-hub" className="scroll-mt-40">
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-[70] flex max-w-md items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-white shadow-2xl">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00A651]" />
          <p className="text-xs font-medium">{downloadNotice}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">Vendor library</p>
          <h2 className="mt-1 font-sans text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">Technical assets & documents</h2>
          <p className="mt-1 text-sm text-zinc-500">Filter presentations, catalogues, specifications, and media from {companyName}.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search this library" className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 outline-none transition focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/10" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-4 lg:sticky lg:top-[190px]">
          <div className="mb-3 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-900"><SlidersHorizontal className="h-3.5 w-3.5 text-[#00A651]" /> Filters <span className="text-zinc-400">({filteredItems.length})</span></p>
            <button type="button" onClick={resetFilters} className="text-[10px] font-semibold text-[#00A651] hover:underline">Reset</button>
          </div>
          {filterSection("Asset category", ([
            ["all", "All assets", allItems.length],
            ["documents", "Documents", documents.length],
            ["videos", "Videos & media", videos.length],
          ] as const).map(([value, label, count]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
              <input type="radio" name="asset-kind" checked={kind === value} onChange={() => setKind(value)} className="accent-[#00A651]" />
              <span>{label}</span><span className="ml-auto font-mono text-[10px] text-zinc-400">{count}</span>
            </label>
          )))}
          {filterSection("Document type", documentGroups.filter((group) => documents.some((item) => item.type === group)).map((group) => (
            <label key={group} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
              <input type="checkbox" checked={selectedGroups.includes(group)} onChange={() => toggle(group, selectedGroups, setSelectedGroups)} className="accent-[#00A651]" />
              <span>{group === "Technical Document" ? "Spec sheets" : group}</span>
            </label>
          )))}
          {availableFormats.length > 0 && filterSection("File format", availableFormats.map((format) => (
            <label key={format} className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
              <input type="checkbox" checked={selectedFormats.includes(format)} onChange={() => toggle(format, selectedFormats, setSelectedFormats)} className="accent-[#00A651]" />
              <span>{format}</span>
            </label>
          )), false)}
        </aside>

        <div>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-zinc-500"><span className="font-semibold text-zinc-900">{filteredItems.length}</span> assets found</p>
            <label className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500">
              Sort
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="bg-transparent text-xs font-semibold normal-case text-zinc-800 outline-none">
                <option value="recent">Most recent</option>
                <option value="title">Title A–Z</option>
                <option value="size">File size</option>
              </select>
            </label>
          </div>

          {filteredItems.length === 0 ? <EmptyState title="No assets match these filters" description="Try another document type, format, or search phrase." onAction={resetFilters} /> : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => item.assetKind === "document" ? (
                <ResourceCard key={item.id} resource={item} onDownload={handleDownload} isDownloading={downloadingId === item.id} isAuthenticated={Boolean(isLoaded && isSignedIn)} />
              ) : (
                <VideoCard key={item.id} video={item} onWatch={setActiveVideo} />
              ))}
            </div>
          )}
        </div>
      </div>
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </section>
  );
}
