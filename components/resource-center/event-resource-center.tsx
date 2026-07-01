"use client";

import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownAZ,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/buttons";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
  clearPendingResourceDownload,
  type DownloadableResource,
  readPendingResourceDownload,
  requestTrackedResourceDownload,
  storePendingResourceDownload,
  triggerResourceFileDownload,
} from "./resource-download";

import type {
  EnergyEvent,
  EventResource,
  FileType,
  ResourceFilters,
  ResourceType,
  SortOption,
} from "./types";

const DEFAULT_FILTERS: ResourceFilters = {
  events: [],
  types: [],
  sectors: [],
  years: [],
  sort: "Latest First",
};

const SORT_OPTIONS: SortOption[] = ["Latest First", "Event Name", "Year"];

const RESOURCE_TYPE_ORDER: string[] = [
  "Magazine EPDF",
  "Post Show Report",
  "Paper Abstract",
  "Whitepaper",
  "Industry Report",
  "Event Brochure",
];

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

function countBy<T extends string | number>(
  values: EventResource[],
  getKey: (resource: EventResource) => T | T[] | null | undefined
) {
  return values.reduce<Record<string, number>>((acc, resource) => {
    const rawKeys = getKey(resource);
    const keys = Array.isArray(rawKeys) ? rawKeys : [rawKeys];
    keys.forEach((key) => {
      if (key === null || key === undefined || key === "") return;
      acc[String(key)] = (acc[String(key)] ?? 0) + 1;
    });
    return acc;
  }, {});
}

function getResourceTypeStyle(type: ResourceType) {
  return RESOURCE_TYPE_STYLES[type] ?? "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function getFileTypeStyle(type: FileType) {
  return FILE_TYPE_STYLES[type] ?? FILE_TYPE_STYLES.FILE;
}

function uniqueSorted<T extends string | number>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

export function EventResourceCenter({
  resources,
  events,
}: {
  resources: EventResource[];
  events: EnergyEvent[];
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ResourceFilters>(DEFAULT_FILTERS);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);

  const canDownload = isLoaded && isSignedIn;
  const eventLookup = useMemo(
    () =>
      events.reduce<Record<string, EnergyEvent>>((acc, event) => {
        acc[event.id] = event;
        return acc;
      }, {}),
    [events]
  );
  const resourceTypeOptions = useMemo(
    () => {
      const existing = new Set(resources.map((r) => r.resource_type));
      // Fixed order first, then any types not in the list (alphabetically)
      const ordered = RESOURCE_TYPE_ORDER.filter((t) => existing.has(t));
      const extras = Array.from(existing)
        .filter((t) => !RESOURCE_TYPE_ORDER.includes(t))
        .sort();
      return [...ordered, ...extras];
    },
    [resources]
  );
  const sectorOptions = useMemo(
    () => uniqueSorted(resources.flatMap((resource) => resource.sector)),
    [resources]
  );
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(resources.map((resource) => resource.year)))
        .filter(Boolean)
        .sort((a, b) => b - a),
    [resources]
  );

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    const sectorParam = searchParams.get("sector");
    setFilters((current) => ({
      ...current,
      types: typeParam ? [typeParam] : [],
      sectors: sectorParam ? [sectorParam] : [],
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!downloadNotice) return;
    const timer = window.setTimeout(() => setDownloadNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [downloadNotice]);

  const filterCounts = useMemo(
    () => ({
      events: countBy(resources, (resource) => resource.event_id),
      types: countBy(resources, (resource) => resource.resource_type),
      sectors: countBy(resources, (resource) => resource.sector),
      years: countBy(resources, (resource) => resource.year),
    }),
    [resources]
  );

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matching = resources.filter((resource) => {
      const matchesSearch =
        !query ||
        [
          resource.title,
          resource.eventName,
          resource.resource_type,
          resource.description,
          resource.resourceTag,
          resource.showCode,
          resource.fileType,
          ...resource.sector,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesEvent =
        filters.events.length === 0 ||
        filters.events.includes(resource.event_id);
      const matchesType =
        filters.types.length === 0 ||
        filters.types.includes(resource.resource_type);
      const matchesSector =
        filters.sectors.length === 0 ||
        resource.sector.some((sector) => filters.sectors.includes(sector));
      const matchesYear =
        filters.years.length === 0 || filters.years.includes(resource.year);

      return (
        matchesSearch &&
        matchesEvent &&
        matchesType &&
        matchesSector &&
        matchesYear
      );
    });

    return matching.sort((a, b) => {
      if (filters.sort === "Event Name") {
        return `${a.eventName}${a.title}`.localeCompare(
          `${b.eventName}${b.title}`
        );
      }
      if (filters.sort === "Year") return b.year - a.year;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
  }, [filters, resources, searchQuery]);

  const activeFilterCount =
    filters.events.length +
    filters.types.length +
    filters.sectors.length +
    filters.years.length;

  const hasActiveCriteria = activeFilterCount > 0 || searchQuery.trim().length > 0;
  const resourceGridKey = [
    searchQuery.trim(),
    filters.sort,
    filters.events.join("|"),
    filters.types.join("|"),
    filters.sectors.join("|"),
    filters.years.join("|"),
  ].join("::");

  function setSort(sort: SortOption) {
    setFilters((current) => ({ ...current, sort }));
  }

  function toggleFilter(
    key: Exclude<keyof ResourceFilters, "sort">,
    value: string | number
  ) {
    setFilters((current) => {
      const selected = current[key] as Array<string | number>;
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return {
        ...current,
        [key]: next,
      } as ResourceFilters;
    });
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  }

  const startResourceDownload = useCallback(async (resource: DownloadableResource) => {
    if (downloadingSlug === resource.slug) return;

    setDownloadingSlug(resource.slug);
    try {
      const result = await requestTrackedResourceDownload(resource);

      if (result.status === "unauthenticated") {
        storePendingResourceDownload(resource);
        openAuthModal("/resource-center");
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
      console.error("[RESOURCE_DOWNLOAD] Failed to start download:", error);
      const message =
        error instanceof Error ? error.message : "Unable to start this download";
      setDownloadNotice(message);
    } finally {
      setDownloadingSlug(null);
    }
  }, [downloadingSlug, openAuthModal]);

  // After auth redirect: check for pending download
  useEffect(() => {
    if (!canDownload) return;

    const pending = readPendingResourceDownload();
    if (!pending) return;

    clearPendingResourceDownload();
    void startResourceDownload(pending);
  }, [canDownload, startResourceDownload]);

  function requestDownload(resource: EventResource) {
    if (canDownload) {
      void startResourceDownload(resource);
      return;
    }

    storePendingResourceDownload(resource);
    openAuthModal("/resource-center");
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <HeroSection />

      <section className="border-t border-zinc-200/80 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950 lg:py-8">
        <div className="container mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-6 xl:px-8">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00A651]">
                Resource Library
              </p>
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                Browse Resources & Market Intelligence
              </h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <label className="sr-only" htmlFor="resource-library-search">
                Search resources
              </label>
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="resource-library-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search resources..."
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 lg:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#00A651] px-1.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="lg:hidden">
                <SortSelect value={filters.sort} onChange={setSort} compact />
              </div>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-5">
            <aside className="hidden self-start lg:sticky lg:top-[128px] lg:block lg:h-[calc(100vh-148px)]">
              <FilterPanel
                counts={filterCounts}
                events={events}
                filters={filters}
                resourceTypeOptions={resourceTypeOptions}
                resultCount={filteredResources.length}
                sectorOptions={sectorOptions}
                totalCount={resources.length}
                yearOptions={yearOptions}
                onReset={resetFilters}
                onSortChange={setSort}
                onToggle={toggleFilter}
              />
            </aside>

            <div className="min-w-0">
              {filteredResources.length > 0 ? (
                <ResourceGrid
                  key={resourceGridKey}
                  downloadingSlug={downloadingSlug}
                  eventLookup={eventLookup}
                  resources={filteredResources}
                  onDownload={requestDownload}
                />
              ) : (
                <EmptyState
                  filters={filters}
                  hasActiveCriteria={hasActiveCriteria}
                  searchQuery={searchQuery}
                  onReset={resetFilters}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <MobileFilterDrawer
        counts={filterCounts}
        events={events}
        filters={filters}
        open={mobileFiltersOpen}
        resourceTypeOptions={resourceTypeOptions}
        resultCount={filteredResources.length}
        sectorOptions={sectorOptions}
        totalCount={resources.length}
        yearOptions={yearOptions}
        onClose={() => setMobileFiltersOpen(false)}
        onReset={resetFilters}
        onSortChange={setSort}
        onToggle={toggleFilter}
      />



      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-banner-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30 saturate-75"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.96)_0%,rgba(9,9,11,0.82)_48%,rgba(9,9,11,0.5)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </div>

      <div className="container mx-auto flex min-h-[360px] max-w-[1440px] items-center px-4 py-14 sm:min-h-[400px] sm:px-6 sm:py-16 lg:min-h-[440px] lg:px-8 lg:py-20">
        <div className="max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" />
            Resource Center
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            ENERGDIVE Resource Center
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-200 sm:text-lg">
            Browse event brochures, post-show reports, whitepapers,
            presentations, and industry insights from leading energy events
            worldwide.
          </p>
        </div>
      </div>
    </section>
  );
}

function FilterPanel({
  counts,
  events,
  filters,
  resourceTypeOptions,
  resultCount,
  sectorOptions,
  totalCount,
  yearOptions,
  onReset,
  onSortChange,
  onToggle,
}: {
  counts: {
    events: Record<string, number>;
    types: Record<string, number>;
    sectors: Record<string, number>;
    years: Record<string, number>;
  };
  events: EnergyEvent[];
  filters: ResourceFilters;
  resourceTypeOptions: ResourceType[];
  resultCount: number;
  sectorOptions: string[];
  totalCount: number;
  yearOptions: number[];
  onReset: () => void;
  onSortChange: (sort: SortOption) => void;
  onToggle: (
    key: Exclude<keyof ResourceFilters, "sort">,
    value: string | number
  ) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00A651]">
              Filters
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {resultCount} of {totalCount} resources
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:hover:text-white"
            title="Reset filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 dashboard-scrollbar">
        <SortControl value={filters.sort} onChange={onSortChange} />


        <FilterGroup
          title="Resource Type"
          options={resourceTypeOptions.map((type) => ({
            label: type,
            value: type,
            count: counts.types[type] ?? 0,
          }))}
          selectedValues={filters.types}
          onToggle={(value) => onToggle("types", value)}
        />
        <FilterGroup
          title="Sector"
          options={sectorOptions.map((sector) => ({
            label: sector,
            value: sector,
            count: counts.sectors[sector] ?? 0,
          }))}
          selectedValues={filters.sectors}
          onToggle={(value) => onToggle("sectors", value)}
        />
        <FilterGroup
          title="Year"
          options={yearOptions.map((year) => ({
            label: String(year),
            value: year,
            count: counts.years[String(year)] ?? 0,
          }))}
          selectedValues={filters.years}
          onToggle={(value) => onToggle("years", value)}
        />

      </div>
    </div>
  );
}

function MobileFilterDrawer({
  counts,
  events,
  filters,
  open,
  resourceTypeOptions,
  resultCount,
  sectorOptions,
  totalCount,
  yearOptions,
  onClose,
  onReset,
  onSortChange,
  onToggle,
}: {
  counts: {
    events: Record<string, number>;
    types: Record<string, number>;
    sectors: Record<string, number>;
    years: Record<string, number>;
  };
  events: EnergyEvent[];
  filters: ResourceFilters;
  open: boolean;
  resourceTypeOptions: ResourceType[];
  resultCount: number;
  sectorOptions: string[];
  totalCount: number;
  yearOptions: number[];
  onClose: () => void;
  onReset: () => void;
  onSortChange: (sort: SortOption) => void;
  onToggle: (
    key: Exclude<keyof ResourceFilters, "sort">,
    value: string | number
  ) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-zinc-950/50"
            onClick={onClose}
          />
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00A651]">
                  Filters
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {resultCount} of {totalCount} resources
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-md border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(88vh-8rem)] overflow-y-auto p-4 dashboard-scrollbar">
              <div className="space-y-4">
                <SortControl value={filters.sort} onChange={onSortChange} />


                <FilterGroup
                  title="Resource Type"
                  options={resourceTypeOptions.map((type) => ({
                    label: type,
                    value: type,
                    count: counts.types[type] ?? 0,
                  }))}
                  selectedValues={filters.types}
                  onToggle={(value) => onToggle("types", value)}
                />
                <FilterGroup
                  title="Sector"
                  options={sectorOptions.map((sector) => ({
                    label: sector,
                    value: sector,
                    count: counts.sectors[sector] ?? 0,
                  }))}
                  selectedValues={filters.sectors}
                  onToggle={(value) => onToggle("sectors", value)}
                />
                <FilterGroup
                  title="Year"
                  options={yearOptions.map((year) => ({
                    label: String(year),
                    value: year,
                    count: counts.years[String(year)] ?? 0,
                  }))}
                  selectedValues={filters.years}
                  onToggle={(value) => onToggle("years", value)}
                />

              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-md text-sm"
                onClick={onReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                type="button"
                className="h-10 rounded-md bg-[#00A651] text-sm text-white hover:bg-[#008b44]"
                onClick={onClose}
              >
                Apply Filters
              </Button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SortControl({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  return (
    <div>
      <label
        htmlFor="resource-sort-panel"
        className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
      >
        <ArrowDownAZ className="h-4 w-4" />
        Sort Options
      </label>
      <SortSelect value={value} onChange={onChange} id="resource-sort-panel" />
    </div>
  );
}

function SortSelect({
  compact,
  id,
  value,
  onChange,
}: {
  compact?: boolean;
  id?: string;
  value: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as SortOption)}
      className={cn(
        "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800 outline-none transition focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
        compact && "w-[170px]"
      )}
      aria-label="Sort resources"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function FilterGroup({
  title,
  options,
  selectedValues,
  onToggle,
}: {
  title: string;
  options: Array<{ label: string; value: string | number; count: number }>;
  selectedValues: Array<string | number>;
  onToggle: (value: string | number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="space-y-1">
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);
          return (
            <label
              key={option.value}
              className="group flex min-h-8 cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggle(option.value)}
                  className="h-4 w-4 rounded border-zinc-300 data-[state=checked]:border-[#00A651] data-[state=checked]:bg-[#00A651]"
                />
                <span
                  className={cn(
                    "truncate text-[13px] font-semibold text-zinc-700 dark:text-zinc-300",
                    checked && "text-zinc-950 dark:text-white"
                  )}
                >
                  {option.label}
                </span>
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {option.count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ResourceGrid({
  downloadingSlug,
  eventLookup,
  resources,
  onDownload,
}: {
  downloadingSlug: string | null;
  eventLookup: Record<string, EnergyEvent>;
  resources: EventResource[];
  onDownload: (resource: EventResource) => void;
}) {
  const pageSize = 12;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleResources = resources.slice(0, visibleCount);
  const hasMore = visibleCount < resources.length;

  return (
    <div>
      <motion.div
        layout
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:gap-4"
      >
        <AnimatePresence mode="popLayout">
          {visibleResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              event={eventLookup[resource.event_id]}
              isDownloading={downloadingSlug === resource.slug}
              resource={resource}
              onDownload={onDownload}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisibleCount((count) => count + pageSize)}
            className="h-11 rounded-md border-zinc-300 bg-white px-8 text-sm font-black text-zinc-950 shadow-sm transition hover:border-[#00A651] hover:text-[#007a3d] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            Load more resources
          </Button>
        </div>
      )}
    </div>
  );
}

function ResourceCard({
  event,
  isDownloading,
  resource,
  onDownload,
}: {
  event?: EnergyEvent;
  isDownloading: boolean;
  resource: EventResource;
  onDownload: (resource: EventResource) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.24 }}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="p-3 pb-0">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black leading-tight text-zinc-950 dark:text-white">
                {resource.eventName}
              </p>
              <p className="truncate text-[11px] font-semibold text-zinc-500">
                {resource.showCode} · {resource.year}
              </p>
            </div>
          </div>
        </div>

        <ResourceCover resource={resource} />
      </div>

      <div className="flex grow flex-col p-3">
        <div className="mb-2">
          <span
            className={cn(
              "inline-flex max-w-full rounded-full border px-2 py-0.5 text-[10px] font-black",
              getResourceTypeStyle(resource.resource_type)
            )}
          >
            <span className="truncate">{resource.resource_type}</span>
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[38px] text-[15px] font-black leading-[1.25] tracking-tight text-zinc-950 transition group-hover:text-[#007a3d] dark:text-white">
          {resource.title}
        </h3>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <Link
            href={`/resource-center/${resource.slug}`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-transparent px-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Preview"
          >
            <Eye className="h-3.5 w-3.5 xl:mr-1.5" />
            <span className="hidden xl:inline">Preview</span>
          </Link>
          <Button
            type="button"
            onClick={() => onDownload(resource)}
            disabled={isDownloading}
            className="h-9 rounded-md bg-zinc-950 px-2 text-xs text-white hover:bg-[#00A651] dark:bg-white dark:text-zinc-950 dark:hover:bg-[#00A651] dark:hover:text-white"
            title="Download"
          >
            <Download className="h-3.5 w-3.5 xl:mr-1.5" />
            <span className="hidden xl:inline">
              {isDownloading ? "Preparing..." : "Download"}
            </span>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function ResourceCover({
  resource,
  large,
}: {
  resource: EventResource;
  large?: boolean;
}) {
  const palette = COVER_PALETTES[hashIndex(resource.id, COVER_PALETTES.length)];

  const imageUrl = resource.thumbnailImageUrl || resource.coverImageUrl;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gradient-to-br text-white",
        palette,
        large ? "aspect-[5/3]" : "aspect-[16/10]"
      )}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={resource.title}
          fill
          sizes={
            large
              ? "(max-width: 768px) 100vw, 640px"
              : "(max-width: 1024px) 50vw, 25vw"
          }
          className="object-cover"
        />
      )}

      {!imageUrl && (
        <>
          <div className="absolute inset-0 opacity-35">
            <div className="absolute left-0 top-1/4 h-px w-full bg-white/30" />
            <div className="absolute left-0 top-1/2 h-px w-full bg-white/20" />
            <div className="absolute bottom-1/4 left-0 h-px w-full bg-white/20" />
            <div className="absolute bottom-0 right-8 top-0 w-px bg-white/20" />
            <div className="absolute bottom-0 right-20 top-0 w-px bg-white/10" />
          </div>

          <div className={cn("relative flex h-full flex-col justify-between", large ? "p-5" : "p-3.5")}>
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]">
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
              <h4
                className={cn(
                  "line-clamp-2 max-w-[92%] font-black leading-tight tracking-tight",
                  large ? "text-2xl sm:text-3xl" : "text-sm"
                )}
              >
                {resource.title}
              </h4>
              <div className={cn("flex items-center gap-2 text-[10px] font-bold text-white/70", large ? "mt-4" : "mt-2.5")}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                {resource.eventName}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EventLogo({
  event,
  fallback = "ER",
  size = "sm",
}: {
  event?: EnergyEvent;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}) {
  const label = event?.logoLabel ?? fallback;
  const bg = event?.brandColor ?? "#00A651";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md text-center font-black text-white shadow-sm",
        size === "sm" && "h-9 w-9 text-[11px]",
        size === "md" && "h-12 w-12 text-sm",
        size === "lg" && "h-14 w-14 text-base"
      )}
      style={{ backgroundColor: bg }}
      aria-label={`${event?.name ?? "Event"} logo`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  filters,
  hasActiveCriteria,
  searchQuery,
  onReset,
}: {
  filters: ResourceFilters;
  hasActiveCriteria: boolean;
  searchQuery: string;
  onReset: () => void;
}) {
  const title = !hasActiveCriteria
    ? "No resources available."
    : filters.types.includes("Post Show Report")
      ? "No reports available."
      : "No resources found.";

  const description = hasActiveCriteria
    ? "Try removing one or more filters, changing the search term, or returning to the full event library."
    : "Resources will appear here once event assets are available.";

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-[#fbfcfb] p-6 text-center dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
      <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative h-16 w-14 rounded-md border border-zinc-300 bg-zinc-50 p-2 text-left dark:border-zinc-700 dark:bg-zinc-900">
          <div className="h-2 w-8 rounded bg-[#00A651]" />
          <div className="mt-3 h-1.5 w-10 rounded bg-zinc-300 dark:bg-zinc-700" />
          <div className="mt-2 h-1.5 w-7 rounded bg-zinc-300 dark:bg-zinc-700" />
          <Search className="absolute -bottom-3 -right-3 h-8 w-8 rounded-full border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950" />
        </div>
      </div>

      <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {description}
        {searchQuery.trim() && (
          <>
            {" "}
            Current search:{" "}
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {searchQuery.trim()}
            </span>
            .
          </>
        )}
      </p>
      <Button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-md bg-zinc-950 text-white hover:bg-[#00A651] dark:bg-white dark:text-zinc-950 dark:hover:bg-[#00A651] dark:hover:text-white"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  );
}

