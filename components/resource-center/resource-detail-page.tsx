"use client";

import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileDown,
  Layers3,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import type { EnergyEvent, EventResource, FileType, ResourceType } from "./types";

const THEME_STYLE = "bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20";

const RESOURCE_TYPE_STYLES: Record<string, string> = {
  "Magazine EPDF": THEME_STYLE,
  "Post Show Report": THEME_STYLE,
  "Paper Abstract": THEME_STYLE,
  Whitepaper: THEME_STYLE,
  "Industry Report": THEME_STYLE,
  "Event Brochure": THEME_STYLE,
  Presentation: THEME_STYLE,
  "Media Kit": THEME_STYLE,
  "Sponsor Prospectus": THEME_STYLE,
};

const FILE_TYPE_STYLES: Record<string, string> = {
  PDF: "bg-red-50 text-red-700 border-red-100",
  PPT: "bg-orange-50 text-orange-700 border-orange-100",
  ZIP: "bg-slate-100 text-slate-700 border-slate-200",
  FILE: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const COVER_PALETTES = [
  "from-zinc-950 via-emerald-950 to-emerald-700",
  "from-slate-950 via-blue-950 to-cyan-700",
  "from-neutral-950 via-zinc-800 to-amber-700",
  "from-stone-950 via-teal-950 to-lime-700",
  "from-zinc-950 via-indigo-950 to-sky-700",
  "from-neutral-950 via-rose-950 to-orange-700",
];

function hashIndex(value: string, length: number) {
  return Math.abs(
    value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
  ) % length;
}

function getResourceTypeStyle(type: ResourceType) {
  return RESOURCE_TYPE_STYLES[type] ?? THEME_STYLE;
}

function getFileTypeStyle(type: FileType) {
  return FILE_TYPE_STYLES[type] ?? FILE_TYPE_STYLES.FILE;
}

export function ResourceDetailPage({
  event,
  relatedResources,
  resource,
}: {
  event?: EnergyEvent;
  relatedResources: EventResource[];
  resource: EventResource;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessMode, setAccessMode] = useState<"login" | "register" | "success">(
    "login"
  );
  const [hasLocalAccess, setHasLocalAccess] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const canDownload = hasLocalAccess || (isLoaded && isSignedIn);

  const isLandscape = resource.coverImageUrl 
    ? (resource.coverImageWidth || 1200) > (resource.coverImageHeight || 675)
    : true;

  useEffect(() => {
    if (!accessOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [accessOpen]);

  useEffect(() => {
    if (!downloadNotice) return;
    const timer = window.setTimeout(() => setDownloadNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [downloadNotice]);

  function startDownload() {
    if (!resource.file_url) {
      setDownloadNotice("File is not available for this resource");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = resource.file_url;
    anchor.download = resource.fileName;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setDownloadNotice(`${resource.fileName} download started`);
  }

  function requestDownload() {
    if (canDownload) {
      startDownload();
      return;
    }

    setAccessMode("login");
    setAccessOpen(true);
  }

  function completeAccess() {
    setAccessMode("success");
    setHasLocalAccess(true);
    window.setTimeout(() => {
      startDownload();
      setAccessOpen(false);
      setAccessMode("login");
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-[1200px] px-8 py-8 pb-10 sm:px-14 lg:px-20">
          <Link
            href="/resource-center"
            className="inline-flex items-center gap-2 text-sm font-black text-zinc-600 transition hover:text-[#00A651] dark:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Resource Center
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-black",
                    getResourceTypeStyle(resource.resource_type)
                  )}
                >
                  {resource.resource_type}
                </span>
                {resource.featured && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="max-w-4xl text-3xl font-black leading-[1.05] tracking-tight text-zinc-950 dark:text-white sm:text-4xl lg:text-5xl xl:text-[54px] xl:leading-[1.02]">
                {resource.title}
              </h1>
              {resource.description && (
                <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                  {resource.description}
                </p>
              )}

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryItem icon={Building2} label="Resource" value={resource.eventName} />
                <SummaryItem icon={CalendarDays} label="Year" value={String(resource.year)} />
                <div className="rounded-lg border border-zinc-200 bg-[#fbfcfb] p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <Layers3 className="h-3.5 w-3.5 text-[#00A651]" />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                    Sectors
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {resource.sector.length > 0 ? (
                      resource.sector.map((sector) => (
                        <span
                          key={sector}
                          className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {sector}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-semibold text-zinc-500">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28 flex flex-col items-center">
              <div className={cn("w-full", isLandscape ? "max-w-[380px] xl:max-w-[420px]" : "max-w-[260px]")}>
                <ResourceCover resource={resource} />
                <Button
                  type="button"
                  onClick={requestDownload}
                  className="mt-4 h-12 w-full rounded-md bg-[#00A651] text-sm font-black text-white hover:bg-[#008b44]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-8 py-12 sm:px-14 lg:px-20">
        <div
          className={cn(
            "grid gap-6",
            relatedResources.length > 0 &&
              "lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]"
          )}
        >
          <div className="space-y-6">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                Resource Overview
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base">
                {resource.description ||
                  "This resource is available from the ENERGDIVE Resource Center."}
              </p>
            </section>


          </div>

          {relatedResources.length > 0 && (
            <aside className="space-y-6">
              <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                  More Resources From This Event
                </h2>
                <div className="mt-4 space-y-2.5">
                  {relatedResources.map((related) => (
                    <Link
                      key={related.id}
                      href={`/resource-center/${related.slug}`}
                      className="group block rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-[#00A651]/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#00A651]">
                        {related.resource_type}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-bold text-zinc-950 transition group-hover:text-[#007a3d] dark:text-white">
                        {related.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          )}
        </div>
      </section>

      <AccessModal
        mode={accessMode}
        open={accessOpen}
        resource={resource}
        onClose={() => setAccessOpen(false)}
        onModeChange={setAccessMode}
        onSubmit={completeAccess}
      />

      {downloadNotice && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-5 right-5 z-[70] max-w-[calc(100vw-2rem)] rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-2xl shadow-emerald-950/10 dark:border-emerald-900 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#00A651]" />
            {downloadNotice}
          </span>
        </motion.div>
      )}
    </main>
  );
}

function ResourceCover({ resource }: { resource: EventResource }) {
  const palette = COVER_PALETTES[hashIndex(resource.id, COVER_PALETTES.length)];

  if (resource.coverImageUrl) {
    return (
      <div className="flex justify-center">
        <Image
          src={resource.coverImageUrl}
          alt={resource.title}
          width={resource.coverImageWidth || 1200}
          height={resource.coverImageHeight || 675}
          priority
          sizes="(max-width: 1024px) 340px, 350px"
          className="h-auto w-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[5/3] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br text-white shadow-inner",
        palette
      )}
    >
      {resource.coverImageUrl && (
        <Image
          src={resource.coverImageUrl}
          alt={resource.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover"
        />
      )}
      {resource.coverImageUrl && (
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-zinc-950/10" />
      )}
      <div className="absolute inset-0 opacity-35">
        <div className="absolute left-0 top-1/4 h-px w-full bg-white/30" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white/20" />
        <div className="absolute bottom-1/4 left-0 h-px w-full bg-white/20" />
        <div className="absolute bottom-0 right-10 top-0 w-px bg-white/20" />
        <div className="absolute bottom-0 right-24 top-0 w-px bg-white/10" />
      </div>
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
            {resource.fileType}
          </span>
          <span className="text-right text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
            {resource.year}
          </span>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100">
            {resource.resourceTag}
          </p>
          <h2 className="line-clamp-2 max-w-[92%] text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {resource.title}
          </h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
            {resource.eventName}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-[#fbfcfb] p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <Icon className="h-3.5 w-3.5 text-[#00A651]" />
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function AccessModal({
  mode,
  open,
  resource,
  onClose,
  onModeChange,
  onSubmit,
}: {
  mode: "login" | "register" | "success";
  open: boolean;
  resource: EventResource;
  onClose: () => void;
  onModeChange: (mode: "login" | "register" | "success") => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center px-4">
      <button
        type="button"
        aria-label="Close access modal"
        className="absolute inset-0 bg-zinc-950/65 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Access Premium Industry Resources"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        className="relative w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                Access Premium Industry Resources
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Sign in or register to download {resource.fileName}.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-zinc-200 text-zinc-500 dark:border-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mode === "success" ? (
          <div className="p-7 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-[#00A651]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-zinc-950 dark:text-white">
              Your download is starting...
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Access approved. Your resource will download automatically.
            </p>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 grid grid-cols-2 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onModeChange(tab)}
                  className={cn(
                    "h-10 rounded px-3 text-sm font-black capitalize transition",
                    mode === tab
                      ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              {mode === "register" && (
                <FormField label="Full Name" placeholder="Aarav Mehta" />
              )}
              <FormField label="Work Email" placeholder="name@company.com" type="email" />
              <FormField label="Password" placeholder="Password" type="password" />
              {mode === "register" && (
                <FormField label="Company" placeholder="Energia Global" />
              )}
              <Button
                type="submit"
                className="h-11 w-full rounded-md bg-[#00A651] text-sm font-black text-white hover:bg-[#008b44]"
              >
                <FileDown className="mr-2 h-4 w-4" />
                {mode === "login" ? "Login and Download" : "Register and Download"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                Social Login
              </span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {["Google", "LinkedIn", "Company SSO"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={onSubmit}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <Mail className="h-4 w-4" />
                  {provider}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </label>
      <input
        type={type}
        className="mt-1.5 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/15 dark:border-zinc-800 dark:bg-zinc-900"
        placeholder={placeholder}
      />
    </div>
  );
}
