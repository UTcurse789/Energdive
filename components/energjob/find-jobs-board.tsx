"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { ArrowRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { PublicEnergJob } from "@/lib/energjob-public";
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
    return `Salary ${minValue} - ${maxValue}`;
  }

  if (minValue) {
    return `Salary from ${minValue}`;
  }

  if (maxValue) {
    return `Salary up to ${maxValue}`;
  }

  return null;
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
  size = "h-[68px] w-[68px]",
}: {
  name: string;
  logoUrl: string | null;
  size?: string;
}) {
  if (logoUrl) {
    return (
      <div
        className={`${size} shrink-0 overflow-hidden rounded-[20px] border border-[#d7e3ea] bg-white shadow-[0_6px_18px_rgba(20,63,82,0.08)]`}
      >
        <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-[20px] bg-[#143f52] text-base font-black text-white`}
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
  const searchParamsKey = searchParams.toString();
  const initialState = buildStateFromParams(searchParams);

  const [titleQuery, setTitleQuery] = useState(initialState.titleQuery);
  const [locationQuery, setLocationQuery] = useState(initialState.locationQuery);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
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
    try {
      const raw = window.localStorage.getItem("energjob-saved-jobs");
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedJobIds(parsed.map((value) => String(value)));
      }
    } catch (error) {
      console.error("[FindJobsBoard] Failed to load saved jobs", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("energjob-saved-jobs", JSON.stringify(savedJobIds));
    } catch (error) {
      console.error("[FindJobsBoard] Failed to persist saved jobs", error);
    }
  }, [savedJobIds]);

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

  const toggleSaved = (jobId: number | string) => {
    const normalizedId = String(jobId);
    setSavedJobIds((currentIds) =>
      currentIds.includes(normalizedId)
        ? currentIds.filter((value) => value !== normalizedId)
        : [...currentIds, normalizedId]
    );
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
              <div className="mt-5 space-y-5">
                {sections.map(([sector, sectorJobs]) => (
                  <section
                    key={sector}
                    id={toAnchorId(sector)}
                    className="rounded-[28px] border border-[#091d3a]/6 bg-white px-4 py-5 shadow-[0_18px_45px_rgba(20,63,82,0.05)] sm:px-5 lg:px-6 lg:py-6 gsap-stagger-container"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-black/8 pb-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#09B697]">
                          Sector
                        </p>
                        <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#091d3a]">
                          {sector}
                        </h3>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-[#f4f7f8] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#24344b]">
                        {sectorJobs.length} roles
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {sectorJobs.map(({ job }) => {
                        const companyName =
                          job.companyName || job.recruiterName || "Energy ecosystem employer";
                        const primaryMeta = buildMetaLine([
                          formatLabel(job.workMode),
                          job.location,
                        ]);
                        const secondaryMeta = buildMetaLine([
                          formatSalary(job.salaryMin, job.salaryMax),
                          formatExperience(job.experienceMin, job.experienceMax),
                          job.qualification,
                        ]);
                        const tags = [
                          ...(job.sectors || []).slice(0, 2),
                          formatLabel(job.jobType),
                          formatLabel(job.roleCategory),
                        ].filter(Boolean);
                        const isSaved = savedJobIds.includes(String(job.id));

                        return (
                          <article
                            key={`${sector}-${job.id}`}
                            className="flex flex-col gap-4 rounded-[24px] border border-black/8 bg-[#fcfdfc] px-4 py-5 shadow-[0_12px_34px_rgba(20,63,82,0.04)] sm:px-5 gsap-stagger-item"
                          >
                            <div className="flex gap-4 items-start sm:gap-5">
                              <CompanyMark
                                name={companyName}
                                logoUrl={job.companyLogoUrl}
                                size="h-[78px] w-[78px] sm:h-[84px] sm:w-[84px]"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#09B697]">
                                  <span>{companyName}</span>
                                  {job.openings ? (
                                    <span className="rounded-full bg-[#eef4fb] px-2.5 py-1 text-[10px] tracking-[0.14em] text-[#2f5577]">
                                      {job.openings} {job.openings === 1 ? "role" : "roles"}
                                    </span>
                                  ) : null}
                                </div>
                                <Link
                                  href={getJobHref(job)}
                                  className="mt-1 block line-clamp-2 text-[1.4rem] font-black leading-tight tracking-[-0.04em] text-[#111111] transition-colors hover:text-[#09B697] sm:text-[1.6rem]"
                                >
                                  {job.title}
                                </Link>
                                {primaryMeta ? (
                                  <p className="mt-2 text-[15px] leading-7 text-black/68">
                                    {primaryMeta}
                                  </p>
                                ) : null}
                                {secondaryMeta ? (
                                  <p className="text-[14px] leading-6 text-black/58">
                                    {secondaryMeta}
                                  </p>
                                ) : null}
                                {job.summary ? (
                                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-black/54">
                                    {job.summary}
                                  </p>
                                ) : null}
                                {tags.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={`${job.id}-${tag}`}
                                        className="rounded-full bg-[#f4f7f8] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#33415c]"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-black/5 pt-4">
                              <button
                                type="button"
                                onClick={() => toggleSaved(job.id)}
                                className="inline-flex h-11 items-center justify-center rounded-[14px] border border-black/14 bg-white px-5 text-sm font-bold text-[#111111] transition-colors hover:border-[#09B697] hover:text-[#09B697]"
                              >
                                {isSaved ? "Saved" : "Save"}
                              </button>
                              <Link
                                href={getJobHref(job)}
                                className="inline-flex h-11 items-center justify-center gap-1 rounded-[14px] bg-[#121417] px-5 text-sm font-bold text-white transition-colors hover:bg-[#09B697]"
                              >
                                View role
                                <ArrowRight className="h-4 w-4" />
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
    </main>
  );
}
