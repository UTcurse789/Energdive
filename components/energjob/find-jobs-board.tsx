"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import type { PublicEnergJob } from "@/lib/energjob-public";
import { getCanonicalUrl } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import {
  EMPLOYMENT_FILTERS,
  EXPERIENCE_FILTERS,
  type EmploymentFilterId,
  type EnergJobSearchState,
  type ExperienceFilterId,
  filterAndRankJobs,
  formatLabel,
} from "@/lib/energjob-search";
import FloatingLines from "@/components/FloatingLines";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
  persistPendingSavedArticle,
  SAVED_ARTICLE_REDIRECT_PATH,
  SAVED_JOB_TOAST_MESSAGE,
} from "@/lib/pending-saved-article";

type FindJobsBoardProps = {
  jobs: PublicEnergJob[];
};

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSalary(min: number | null, max: number | null) {
  const minValue = formatNumber(min);
  const maxValue = formatNumber(max);

  if (minValue && maxValue) {
    return `₹${minValue} – ₹${maxValue}`;
  }

  if (minValue) {
    return `₹${minValue}+`;
  }

  if (maxValue) {
    return `₹${maxValue}`;
  }

  return null;
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) {
    return null;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = nowMidnight.getTime() - dateMidnight.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "today";
  }
  if (diffDays === 1) {
    return "yesterday";
  }
  return `${diffDays} days ago`;
}

function formatExperience(min: number | null, max: number | null) {
  if (min === null && max === null) {
    return null;
  }

  if (min !== null && max !== null) {
    return `${min}-${max} yrs exp`;
  }

  if (min !== null) {
    return `${min}+ yrs exp`;
  }

  return `Up to ${max} yrs exp`;
}

function getInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) {
    return "EJ";
  }

  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function CompanyMark({
  name,
  logoUrl,
  size = "h-12 w-12",
  rounded = "rounded-xl",
}: {
  name: string;
  logoUrl: string | null;
  size?: string;
  rounded?: string;
}) {
  if (logoUrl) {
    return (
      <div
        className={`${size} ${rounded} shrink-0 overflow-hidden border border-gray-200 bg-white`}
      >
        <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${size} ${rounded} shrink-0 items-center justify-center bg-gray-900 text-xs font-bold text-white`}
    >
      {getInitials(name)}
    </div>
  );
}

function toggleSelection(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function buildMetaLine(parts: Array<string | null>) {
  return parts.filter(Boolean).join(" / ");
}

function toAnchorId(value: string) {
  return `sector-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function getJobHref(job: PublicEnergJob) {
  return `/energyjobs/${job.routeSlug}`;
}

function getJobSaveUrl(job: PublicEnergJob) {
  return getCanonicalUrl(getJobHref(job));
}

function getJobSaveTitle(job: PublicEnergJob) {
  const companyName = job.companyName || job.recruiterName || "Energy ecosystem employer";
  return `${job.title} at ${companyName}`;
}

function getSavedPath(value: string) {
  try {
    return new URL(value).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return value.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  }
}

function parseDelimitedValues<T extends string>(rawValue: string | null, allowedValues: readonly T[]) {
  if (!rawValue) {
    return [];
  }

  const allowed = new Set<string>(allowedValues);

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is T => allowed.has(value));
}

function normalizeSearchState(state: EnergJobSearchState): EnergJobSearchState {
  return {
    titleQuery: state.titleQuery.trim(),
    locationQuery: state.locationQuery.trim(),
    filterLocation: state.filterLocation.trim(),
    experienceFilters: parseDelimitedValues(
      state.experienceFilters.join(","),
      EXPERIENCE_FILTERS.map((filter) => filter.id)
    ),
    employmentFilters: parseDelimitedValues(
      state.employmentFilters.join(","),
      EMPLOYMENT_FILTERS.map((filter) => filter.id)
    ),
    categoryFilters: (state.categoryFilters || [])
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function buildStateFromParams(
  searchParams: Pick<URLSearchParams, "get">
): EnergJobSearchState {
  return normalizeSearchState({
    titleQuery: searchParams.get("q") || "",
    locationQuery: searchParams.get("location") || "",
    filterLocation: searchParams.get("filterLocation") || "",
    experienceFilters: parseDelimitedValues(
      searchParams.get("experience"),
      EXPERIENCE_FILTERS.map((filter) => filter.id)
    ),
    employmentFilters: parseDelimitedValues(
      searchParams.get("employment"),
      EMPLOYMENT_FILTERS.map((filter) => filter.id)
    ),
    categoryFilters: (searchParams.get("category") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  });
}

function buildSearchUrl(pathname: string, state: EnergJobSearchState) {
  const searchParams = new URLSearchParams();

  if (state.titleQuery) {
    searchParams.set("q", state.titleQuery);
  }

  if (state.locationQuery) {
    searchParams.set("location", state.locationQuery);
  }

  if (state.filterLocation) {
    searchParams.set("filterLocation", state.filterLocation);
  }

  if (state.experienceFilters.length > 0) {
    searchParams.set("experience", state.experienceFilters.join(","));
  }

  if (state.employmentFilters.length > 0) {
    searchParams.set("employment", state.employmentFilters.join(","));
  }

  if (state.categoryFilters && state.categoryFilters.length > 0) {
    searchParams.set("category", state.categoryFilters.join(","));
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function getAppliedFilterLabel<T extends string>(
  filters: readonly { id: T; label: string }[],
  values: T[]
) {
  const labelById = new Map(filters.map((filter) => [filter.id, filter.label]));
  return values.map((value) => labelById.get(value) || value);
}

export default function FindJobsBoard({ jobs }: FindJobsBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const searchParamsKey = searchParams.toString();
  const initialState = buildStateFromParams(searchParams);

  const [titleQuery, setTitleQuery] = useState(initialState.titleQuery);
  const [locationQuery, setLocationQuery] = useState(initialState.locationQuery);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [draftExperienceFilters, setDraftExperienceFilters] = useState<ExperienceFilterId[]>(
    initialState.experienceFilters
  );
  const [draftEmploymentFilters, setDraftEmploymentFilters] = useState<EmploymentFilterId[]>(
    initialState.employmentFilters
  );
  const [draftCategoryFilters, setDraftCategoryFilters] = useState<string[]>(
    initialState.categoryFilters || []
  );
  const [draftFilterLocation, setDraftFilterLocation] = useState(initialState.filterLocation);
  const [appliedTitleQuery, setAppliedTitleQuery] = useState(initialState.titleQuery);
  const [appliedLocationQuery, setAppliedLocationQuery] = useState(initialState.locationQuery);
  const [appliedExperienceFilters, setAppliedExperienceFilters] = useState<
    ExperienceFilterId[]
  >(initialState.experienceFilters);
  const [appliedEmploymentFilters, setAppliedEmploymentFilters] = useState<
    EmploymentFilterId[]
  >(initialState.employmentFilters);
  const [appliedCategoryFilters, setAppliedCategoryFilters] = useState<string[]>(
    initialState.categoryFilters || []
  );
  const [appliedFilterLocation, setAppliedFilterLocation] = useState(
    initialState.filterLocation
  );

  const deferredAppliedTitleQuery = useDeferredValue(appliedTitleQuery);
  const deferredAppliedLocationQuery = useDeferredValue(appliedLocationQuery);
  const deferredAppliedFilterLocation = useDeferredValue(appliedFilterLocation);

  useEffect(() => {
    const loadSavedJobs = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setSavedJobIds([]);
        return;
      }

      try {
        const res = await fetch("/api/user/saved-articles", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load saved jobs");

        const data = await res.json();
        const savedPaths = new Set(
          (Array.isArray(data.articles) ? data.articles : [])
            .map((item: { url?: string }) => (item.url ? getSavedPath(item.url) : null))
            .filter(Boolean)
        );

        setSavedJobIds(
          jobs
            .filter((job) => savedPaths.has(getSavedPath(getJobSaveUrl(job))))
            .map((job) => String(job.id))
        );
      } catch (error) {
        console.error("[FindJobsBoard] Failed to load saved jobs", error);
        setSavedJobIds([]);
      }
    };

    void loadSavedJobs();
    window.addEventListener("saved_articles_updated", loadSavedJobs);

    return () => {
      window.removeEventListener("saved_articles_updated", loadSavedJobs);
    };
  }, [isLoaded, isSignedIn, jobs]);

  useEffect(() => {
    const nextState = buildStateFromParams(searchParams);

    setTitleQuery(nextState.titleQuery);
    setLocationQuery(nextState.locationQuery);
    setDraftExperienceFilters(nextState.experienceFilters);
    setDraftEmploymentFilters(nextState.employmentFilters);
    setDraftCategoryFilters(nextState.categoryFilters || []);
    setDraftFilterLocation(nextState.filterLocation);
    setAppliedTitleQuery(nextState.titleQuery);
    setAppliedLocationQuery(nextState.locationQuery);
    setAppliedExperienceFilters(nextState.experienceFilters);
    setAppliedEmploymentFilters(nextState.employmentFilters);
    setAppliedCategoryFilters(nextState.categoryFilters || []);
    setAppliedFilterLocation(nextState.filterLocation);
  }, [searchParamsKey]);

  // Dynamically extract unique categories from jobs
  const categories = Array.from(
    new Set(
      jobs
        .map((job) => job.roleCategory?.trim())
        .filter((cat): cat is string => Boolean(cat))
    )
  )
    .map((cat) => ({
      id: slugify(cat),
      label: formatLabel(cat) || cat,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const rankedJobs = filterAndRankJobs(jobs, {
    titleQuery: deferredAppliedTitleQuery,
    locationQuery: deferredAppliedLocationQuery,
    filterLocation: deferredAppliedFilterLocation,
    experienceFilters: appliedExperienceFilters,
    employmentFilters: appliedEmploymentFilters,
    categoryFilters: appliedCategoryFilters,
  });

  const sectorMap = new Map<string, typeof rankedJobs>();

  for (const rankedJob of rankedJobs) {
    const sectors = rankedJob.job.sectors.length > 0 ? rankedJob.job.sectors : ["Open Roles"];

    for (const sector of sectors) {
      const current = sectorMap.get(sector) || [];
      current.push(rankedJob);
      sectorMap.set(sector, current);
    }
  }

  const sections = Array.from(sectorMap.entries()).sort((left, right) => {
    const rightBestScore = right[1][0]?.score ?? 0;
    const leftBestScore = left[1][0]?.score ?? 0;

    if (rightBestScore !== leftBestScore) {
      return rightBestScore - leftBestScore;
    }

    if (right[1].length !== left[1].length) {
      return right[1].length - left[1].length;
    }

    return left[0].localeCompare(right[0]);
  });

  const sectorChips = Array.from(
    new Set(jobs.flatMap((job) => (job.sectors.length > 0 ? job.sectors : ["Open Roles"])))
  ).sort((left, right) => left.localeCompare(right));

  const activeExperienceLabels = getAppliedFilterLabel(
    EXPERIENCE_FILTERS,
    appliedExperienceFilters
  );
  const activeEmploymentLabels = getAppliedFilterLabel(
    EMPLOYMENT_FILTERS,
    appliedEmploymentFilters
  );
  const hasActiveSearch = Boolean(
    appliedTitleQuery ||
      appliedLocationQuery ||
      appliedFilterLocation ||
      appliedExperienceFilters.length > 0 ||
      appliedEmploymentFilters.length > 0 ||
      appliedCategoryFilters.length > 0
  );

  const toggleSaved = async (job: PublicEnergJob) => {
    if (!isLoaded || savingJobId) return;

    const normalizedId = String(job.id);
    const url = getJobSaveUrl(job);
    const title = getJobSaveTitle(job);

    if (!isSignedIn) {
      persistPendingSavedArticle({ title, url, kind: "job" });
      openAuthModal(SAVED_ARTICLE_REDIRECT_PATH);
      return;
    }

    const isSaved = savedJobIds.includes(normalizedId);
    setSavingJobId(normalizedId);

    try {
      if (isSaved) {
        const res = await fetch("/api/user/saved-articles", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) throw new Error("Failed to remove saved job");
        setSavedJobIds((currentIds) => currentIds.filter((value) => value !== normalizedId));
      } else {
        const res = await fetch("/api/user/saved-articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, url }),
        });
        if (!res.ok) throw new Error("Failed to save job");
        setSavedJobIds((currentIds) =>
          currentIds.includes(normalizedId) ? currentIds : [...currentIds, normalizedId]
        );
        setShowSaveToast(true);
        window.setTimeout(() => setShowSaveToast(false), 3000);
      }

      window.dispatchEvent(new Event("saved_articles_updated"));
    } catch (error) {
      console.error("[FindJobsBoard] Failed to toggle saved job", error);
    } finally {
      setSavingJobId(null);
    }
  };

  const scrollToResults = () => {
    const resultsNode = document.getElementById("energjob-results");
    resultsNode?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getDraftState = (): EnergJobSearchState => ({
    titleQuery,
    locationQuery,
    filterLocation: draftFilterLocation,
    experienceFilters: draftExperienceFilters,
    employmentFilters: draftEmploymentFilters,
    categoryFilters: draftCategoryFilters,
  });

  const applySearchState = (
    nextState: EnergJobSearchState,
    options?: { shouldScroll?: boolean }
  ) => {
    const normalizedState = normalizeSearchState(nextState);

    setTitleQuery(normalizedState.titleQuery);
    setLocationQuery(normalizedState.locationQuery);
    setDraftExperienceFilters(normalizedState.experienceFilters);
    setDraftEmploymentFilters(normalizedState.employmentFilters);
    setDraftCategoryFilters(normalizedState.categoryFilters || []);
    setDraftFilterLocation(normalizedState.filterLocation);
    setAppliedTitleQuery(normalizedState.titleQuery);
    setAppliedLocationQuery(normalizedState.locationQuery);
    setAppliedExperienceFilters(normalizedState.experienceFilters);
    setAppliedEmploymentFilters(normalizedState.employmentFilters);
    setAppliedCategoryFilters(normalizedState.categoryFilters || []);
    setAppliedFilterLocation(normalizedState.filterLocation);

    startTransition(() => {
      router.replace(buildSearchUrl(pathname, normalizedState), { scroll: false });
    });

    if (options?.shouldScroll !== false) {
      scrollToResults();
    }
  };

  const applyCurrentDraftState = () => {
    applySearchState(getDraftState());
  };

  const clearSidebarFilters = () => {
    applySearchState({
      titleQuery,
      locationQuery,
      filterLocation: "",
      experienceFilters: [],
      employmentFilters: [],
      categoryFilters: [],
    });
  };

  const clearAllSearch = () => {
    applySearchState(
      {
        titleQuery: "",
        locationQuery: "",
        filterLocation: "",
        experienceFilters: [],
        employmentFilters: [],
        categoryFilters: [],
      },
      { shouldScroll: false }
    );
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#fbfcfb_28%,#ffffff_100%)] text-[#111111]">
      <section className="mx-auto w-full max-w-[1120px] px-5 pb-8 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="overflow-hidden rounded-[38px] border border-[#09B697]/10 bg-white shadow-[0_28px_70px_rgba(20,63,82,0.08)]">
          <div className="relative px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <FloatingLines
                enabledWaves={["top", "middle", "bottom"]}
                lineCount={[6, 8, 6]}
                lineDistance={[10, 8, 10]}
                bendRadius={8}
                bendStrength={-1.1}
                interactive={false}
                parallax={true}
                animationSpeed={0.7}
                linesGradient={["#dff5ef", "#09B697", "#d4d7dd"]}
                topWavePosition={{ x: 9.2, y: 0.9, rotate: -0.12 }}
                middleWavePosition={{ x: 4.8, y: 0.08, rotate: 0.08 }}
                bottomWavePosition={{ x: 2.2, y: -0.72, rotate: 0.12 }}
                parallaxStrength={0.12}
                mixBlendMode="normal"
              />
            </div>
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#09B697]/30 to-transparent" />
            <div className="relative mx-auto max-w-4xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#09B697]">
                EnergyJobs
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-[#091d3a] sm:text-5xl lg:text-7xl">
                Find what&apos;s next:
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/60 sm:text-base">
                Search live energy roles, surface high-intent skills, and move from sector
                discovery to job detail pages that are ready for search indexing.
              </p>
            </div>

            <form
              className="mx-auto mt-10 max-w-[1080px]"
              onSubmit={(event) => {
                event.preventDefault();
                applyCurrentDraftState();
              }}
            >
              <div
                id="job-search"
                className="relative overflow-hidden rounded-[28px] border border-black/8 bg-[#fbfcfb] shadow-[0_14px_34px_rgba(9,182,151,0.08)]"
              >
                <div className="flex flex-col lg:flex-row">
                  <label className="flex min-h-[92px] flex-1 items-center gap-4 px-6">
                    <Search className="h-5 w-5 text-[#091d3a]" strokeWidth={2.2} />
                    <span className="sr-only">Job title</span>
                    <input
                      value={titleQuery}
                      onChange={(event) => setTitleQuery(event.target.value)}
                      placeholder="Job title, company, sector, industry, skill, or level"
                      className="w-full bg-transparent text-base font-medium text-[#091d3a] outline-none placeholder:text-[#6d7582]"
                    />
                  </label>

                  <div className="hidden w-px bg-black/8 lg:block" />

                  <label className="flex min-h-[92px] flex-1 items-center gap-4 border-t border-black/8 px-6 lg:border-t-0">
                    <MapPin className="h-5 w-5 text-[#091d3a]" strokeWidth={2.2} />
                    <span className="sr-only">Location</span>
                    <input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Location, city, or work mode"
                      className="w-full bg-transparent text-base font-medium text-[#091d3a] outline-none placeholder:text-[#6d7582]"
                    />
                  </label>

                  <div className="border-t border-black/8 p-4 lg:border-l lg:border-t-0">
                    <button
                      type="submit"
                      className="inline-flex h-14 w-full min-w-[148px] items-center justify-center rounded-[18px] bg-[#121417] px-8 text-base font-bold text-white transition-colors hover:bg-[#09B697]"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="relative mx-auto mt-6 flex max-w-[1080px] flex-wrap items-center justify-center gap-3">
              {sectorChips.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() =>
                    applySearchState({
                      titleQuery: sector,
                      locationQuery,
                      filterLocation: draftFilterLocation,
                      experienceFilters: draftExperienceFilters,
                      employmentFilters: draftEmploymentFilters,
                      categoryFilters: draftCategoryFilters,
                    })
                  }
                  className="rounded-full border border-[#09B697]/16 bg-[#09B697]/7 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#11624f] transition-colors hover:bg-[#09B697]/14"
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="energjob-results"
        className="mx-auto w-full max-w-[1120px] px-5 pb-20 sm:px-6 lg:px-8"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="rounded-[28px] border border-[#091d3a]/6 bg-white px-4 py-5 shadow-[0_18px_45px_rgba(20,63,82,0.05)] sm:px-5 lg:px-6 lg:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#09B697]">
                    Job Listings
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#091d3a] lg:text-[2rem]">
                    Sector-wise openings
                  </h2>
                  <p className="mt-2 text-sm text-black/60">
                    {rankedJobs.length} {rankedJobs.length === 1 ? "role" : "roles"} across{" "}
                    {sections.length} {sections.length === 1 ? "sector" : "sectors"}
                  </p>
                </div>

                {hasActiveSearch ? (
                  <button
                    type="button"
                    onClick={clearAllSearch}
                    className="inline-flex h-11 items-center justify-center rounded-[12px] border border-black/10 bg-white px-4 text-sm font-bold text-[#24344b] transition-colors hover:border-[#09B697] hover:text-[#09B697]"
                  >
                    Reset Search
                  </button>
                ) : null}
              </div>

              {hasActiveSearch ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {appliedTitleQuery ? (
                    <span className="rounded-full bg-[#eef7f5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#11624f]">
                      Query: {appliedTitleQuery}
                    </span>
                  ) : null}
                  {appliedLocationQuery ? (
                    <span className="rounded-full bg-[#eef4fb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f5577]">
                      Top Location: {appliedLocationQuery}
                    </span>
                  ) : null}
                  {appliedFilterLocation ? (
                    <span className="rounded-full bg-[#f3f5fa] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#33415c]">
                      Filter Location: {appliedFilterLocation}
                    </span>
                  ) : null}
                  {activeExperienceLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-[#f7f5ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6f5a1a]"
                    >
                      {label}
                    </span>
                  ))}
                  {activeEmploymentLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-[#f4f7f8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#33415c]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {sections.length > 0 ? (
              <div className="mt-5 space-y-6">
                {sections.map(([sector, sectorJobs]) => (
                  <section
                    key={sector}
                    id={toAnchorId(sector)}
                    className="rounded-[24px] border border-[#091d3a]/6 bg-white px-5 py-6 shadow-[0_12px_36px_rgba(20,63,82,0.04)] gsap-stagger-container"
                  >
                    <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-4 mb-2">
                      <h3 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                        {sector} jobs
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          applySearchState({
                            titleQuery: sector,
                            locationQuery,
                            filterLocation: draftFilterLocation,
                            experienceFilters: draftExperienceFilters,
                            employmentFilters: draftEmploymentFilters,
                            categoryFilters: draftCategoryFilters,
                          })
                        }
                        className="text-xs font-semibold text-[#1155cc] underline hover:text-[#09B697] sm:text-sm"
                      >
                        View all {sector.toLowerCase()} jobs
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {sectorJobs.map(({ job }) => {
                        const companyName =
                          job.companyName || job.recruiterName || "Energy ecosystem employer";
                        
                        const formattedSalary = formatSalary(job.salaryMin, job.salaryMax);
                        const formattedExperience = formatExperience(job.experienceMin, job.experienceMax);
                        const relativeTime = formatRelativeTime(job.publishedAt || job.createdAt);
                        
                        const metaParts = [
                          companyName,
                          job.location || formatLabel(job.workMode),
                          formattedSalary,
                          formattedExperience,
                          relativeTime,
                        ].filter(Boolean);

                        const isSaved = savedJobIds.includes(String(job.id));

                        return (
                          <article
                            key={`${sector}-${job.id}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 gsap-stagger-item first:pt-3 last:pb-3"
                          >
                            <div className="flex flex-1 items-start gap-4 sm:items-center min-w-0">
                              <CompanyMark
                                name={companyName}
                                logoUrl={job.companyLogoUrl}
                                size="h-12 w-12 sm:h-14 sm:w-14"
                              />

                              <div className="min-w-0 flex-1">
                                <Link
                                  href={getJobHref(job)}
                                  className="block text-base font-bold leading-snug text-gray-900 transition-colors hover:text-[#09B697] sm:text-lg hover:underline"
                                >
                                  {job.title}
                                </Link>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                                  {metaParts.map((part, index) => (
                                    <span key={index} className="flex items-center">
                                      {index > 0 && <span className="mr-2 text-gray-300">•</span>}
                                      {part}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => toggleSaved(job)}
                                disabled={!isLoaded || savingJobId === String(job.id)}
                                className="inline-flex h-9 min-w-[76px] items-center justify-center rounded-lg border border-black bg-white px-4 text-sm font-semibold text-black hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingJobId === String(job.id) ? "Saving" : isSaved ? "Saved" : "Save"}
                              </button>
                              <Link
                                href={getJobHref(job)}
                                className="inline-flex h-9 min-w-[76px] items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                              >
                                Apply
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[28px] border border-dashed border-black/12 bg-white px-6 py-14 text-center shadow-[0_18px_45px_rgba(20,63,82,0.04)]">
                <h2 className="text-3xl font-black tracking-[-0.05em] text-[#091d3a]">
                  No roles match this search yet.
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-black/58 sm:text-base">
                  Try a broader title, another location, or adjust the sidebar filters.
                </p>
              </div>
            )}
          </div>

          <aside className="order-first h-fit rounded-[22px] border border-[#091d3a]/8 bg-white p-5 shadow-[0_16px_40px_rgba(20,63,82,0.06)] lg:order-none lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-black/8 pb-4">
              <SlidersHorizontal className="h-4 w-4 text-[#46556f]" />
              <h3 className="text-sm font-bold text-[#24344b]">Refine Your Search</h3>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-[#24344b]">Experience Level</p>
              <div className="mt-3 space-y-2.5">
                {EXPERIENCE_FILTERS.map((filter) => (
                  <label
                    key={filter.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-[#46556f]"
                  >
                    <input
                      type="checkbox"
                      checked={draftExperienceFilters.includes(filter.id)}
                      onChange={() =>
                        setDraftExperienceFilters((current) =>
                          toggleSelection(current, filter.id) as ExperienceFilterId[]
                        )
                      }
                      className="h-4 w-4 rounded border border-black/20 text-[#09B697] focus:ring-[#09B697]"
                    />
                    <span>{filter.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold text-[#24344b]">Employment Type</p>
              <div className="mt-3 space-y-2.5">
                {EMPLOYMENT_FILTERS.map((filter) => (
                  <label
                    key={filter.id}
                    className="flex cursor-pointer items-center gap-3 text-sm text-[#46556f]"
                  >
                    <input
                      type="checkbox"
                      checked={draftEmploymentFilters.includes(filter.id)}
                      onChange={() =>
                        setDraftEmploymentFilters((current) =>
                          toggleSelection(current, filter.id) as EmploymentFilterId[]
                        )
                      }
                      className="h-4 w-4 rounded border border-black/20 text-[#09B697] focus:ring-[#09B697]"
                    />
                    <span>{filter.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-bold text-[#24344b]">Job Category</p>
                <div className="mt-3 space-y-2.5">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex cursor-pointer items-center gap-3 text-sm text-[#46556f]"
                    >
                      <input
                        type="checkbox"
                        checked={draftCategoryFilters.includes(category.id)}
                        onChange={() =>
                          setDraftCategoryFilters((current) =>
                            toggleSelection(current, category.id)
                          )
                        }
                        className="h-4 w-4 rounded border border-black/20 text-[#09B697] focus:ring-[#09B697]"
                      />
                      <span>{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm font-bold text-[#24344b]">Location</p>
              <input
                value={draftFilterLocation}
                onChange={(event) => setDraftFilterLocation(event.target.value)}
                placeholder="Enter city or state"
                className="mt-3 h-11 w-full rounded-[12px] border border-black/10 bg-[#fbfcfb] px-3 text-sm text-[#091d3a] outline-none placeholder:text-[#6d7582] focus:border-[#09B697]"
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearSidebarFilters}
                className="text-sm font-bold text-[#09B697] transition-colors hover:text-[#06695d]"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={applyCurrentDraftState}
                className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#0b7c6c] px-5 text-sm font-bold text-white transition-colors hover:bg-[#09B697]"
              >
                Apply Filters
              </button>
            </div>
          </aside>
        </div>
      </section>

      {showSaveToast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-gray-900 px-5 py-3 text-white shadow-xl">
          <CheckCircle2 className="h-5 w-5 text-[#00A651]" />
          <span className="text-sm font-medium">{SAVED_JOB_TOAST_MESSAGE}</span>
        </div>
      )}
    </main>
  );
}
