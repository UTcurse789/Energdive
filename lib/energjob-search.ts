import type { PublicEnergJob } from "@/lib/energjob-public";

export const EXPERIENCE_FILTERS = [
  { id: "internship", label: "Internship" },
  { id: "1-3", label: "1 - 3 Years" },
  { id: "3-5", label: "3 - 5 Years" },
  { id: "5-plus", label: "5+ Years" },
] as const;

export const EMPLOYMENT_FILTERS = [
  { id: "full-time", label: "Full Time" },
  { id: "internship", label: "Internship" },
  { id: "contract", label: "Contract" },
  { id: "remote", label: "Remote" },
] as const;

export type ExperienceFilterId = (typeof EXPERIENCE_FILTERS)[number]["id"];
export type EmploymentFilterId = (typeof EMPLOYMENT_FILTERS)[number]["id"];

export type EnergJobSearchState = {
  titleQuery: string;
  locationQuery: string;
  filterLocation: string;
  experienceFilters: ExperienceFilterId[];
  employmentFilters: EmploymentFilterId[];
};

export type RankedPublicEnergJob = {
  job: PublicEnergJob;
  score: number;
};

type SearchField = {
  value: string | null | undefined;
  weight: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

const TOKEN_SYNONYMS: Record<string, string[]> = {
  bess: ["battery", "energy", "storage", "systems"],
  ev: ["electric", "vehicle"],
  hvac: ["heating", "ventilation", "air", "conditioning"],
  onsite: ["on-site", "on", "site"],
  photovoltaic: ["pv", "solar"],
  pv: ["photovoltaic", "solar"],
  remote: ["wfh", "work", "from", "home"],
  wfh: ["remote", "work", "from", "home"],
};

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}

export function formatLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSearchText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTokens(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => {
      if (!token) {
        return false;
      }

      if (STOP_WORDS.has(token)) {
        return false;
      }

      if (token.length === 1) {
        return /^\d$/.test(token);
      }

      return true;
    });
}

function expandToken(token: string) {
  return dedupe([token, ...(TOKEN_SYNONYMS[token] || [])].map(normalizeSearchText).filter(Boolean));
}

function buildTokenGroups(value: string) {
  return splitTokens(value).map(expandToken);
}

function isNearMatch(left: string, right: string) {
  if (left === right) {
    return true;
  }

  if (left.length < 4 || right.length < 4) {
    return false;
  }

  if (Math.abs(left.length - right.length) > 1) {
    return false;
  }

  let edits = 0;
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) {
      return false;
    }

    if (left.length > right.length) {
      leftIndex += 1;
      continue;
    }

    if (right.length > left.length) {
      rightIndex += 1;
      continue;
    }

    leftIndex += 1;
    rightIndex += 1;
  }

  if (leftIndex < left.length || rightIndex < right.length) {
    edits += 1;
  }

  return edits <= 1;
}

function scoreVariantAgainstField(variant: string, fieldText: string) {
  if (!variant || !fieldText) {
    return 0;
  }

  if (fieldText === variant) {
    return 10;
  }

  const words = fieldText.split(" ");

  if (words.includes(variant)) {
    return 9;
  }

  if (fieldText.startsWith(variant)) {
    return 8;
  }

  if (words.some((word) => word.startsWith(variant))) {
    return 7;
  }

  if (variant.length >= 3 && fieldText.includes(variant)) {
    return 5;
  }

  if (words.some((word) => isNearMatch(word, variant))) {
    return 3;
  }

  return 0;
}

function scoreQuery(fields: SearchField[], query: string) {
  const tokenGroups = buildTokenGroups(query);
  const normalizedFields = fields
    .map((field) => ({
      text: normalizeSearchText(field.value),
      weight: field.weight,
    }))
    .filter((field) => field.text);

  if (tokenGroups.length === 0) {
    return { matches: true, score: 0 };
  }

  if (normalizedFields.length === 0) {
    return { matches: false, score: 0 };
  }

  let score = 0;

  for (const group of tokenGroups) {
    let tokenScore = 0;

    for (const field of normalizedFields) {
      for (const variant of group) {
        tokenScore = Math.max(
          tokenScore,
          scoreVariantAgainstField(variant, field.text) * field.weight
        );
      }
    }

    if (tokenScore === 0) {
      return { matches: false, score: 0 };
    }

    score += tokenScore;
  }

  const phrase = normalizeSearchText(query);

  if (phrase && phrase.includes(" ")) {
    let phraseScore = 0;

    for (const field of normalizedFields) {
      if (field.text === phrase) {
        phraseScore = Math.max(phraseScore, field.weight * 18);
        continue;
      }

      if (field.text.startsWith(phrase)) {
        phraseScore = Math.max(phraseScore, field.weight * 14);
        continue;
      }

      if (field.text.includes(phrase)) {
        phraseScore = Math.max(phraseScore, field.weight * 10);
      }
    }

    score += phraseScore;
  }

  return { matches: true, score };
}

function buildGeneralSearchFields(job: PublicEnergJob): SearchField[] {
  return [
    { value: job.title, weight: 12 },
    { value: job.companyName, weight: 10 },
    { value: job.recruiterName, weight: 8 },
    { value: job.summary, weight: 5 },
    { value: job.descriptionText, weight: 2 },
    ...job.descriptionLines.slice(0, 8).map((value) => ({ value, weight: 1 })),
    ...job.sectors.map((value) => ({ value, weight: 9 })),
    ...job.skills.slice(0, 10).map((value) => ({ value, weight: 7 })),
    ...job.bonusSkills.slice(0, 8).map((value) => ({ value, weight: 4 })),
    ...job.skillTags.map((value) => ({ value, weight: 5 })),
    { value: formatLabel(job.jobType), weight: 7 },
    { value: formatLabel(job.workMode), weight: 5 },
    { value: formatLabel(job.roleCategory), weight: 7 },
    { value: formatLabel(job.department), weight: 6 },
    { value: job.qualification, weight: 5 },
  ];
}

function buildLocationSearchFields(job: PublicEnergJob): SearchField[] {
  return [
    { value: job.location, weight: 12 },
    { value: formatLabel(job.workMode), weight: 9 },
    { value: job.companyAddress, weight: 8 },
    { value: job.companyName, weight: 2 },
  ];
}

function getJobTimestamp(job: PublicEnergJob) {
  return job.publishedAt || job.updatedAt || job.createdAt || "";
}

export function matchesExperienceFilter(
  job: PublicEnergJob,
  filterId: ExperienceFilterId
) {
  const normalizedFields = [
    job.title,
    job.jobType,
    job.roleCategory,
    job.department,
    job.qualification,
    job.summary,
  ]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);

  if (filterId === "internship") {
    return normalizedFields.some((value) => value.includes("intern"));
  }

  const min = job.experienceMin;
  const max = job.experienceMax ?? job.experienceMin;

  if (min === null && max === null) {
    return false;
  }

  const rangeMin = min ?? 0;
  const rangeMax = max ?? rangeMin;

  if (filterId === "1-3") {
    return rangeMin <= 3 && rangeMax >= 1;
  }

  if (filterId === "3-5") {
    return rangeMin <= 5 && rangeMax >= 3;
  }

  if (filterId === "5-plus") {
    return rangeMax >= 5;
  }

  return true;
}

export function matchesEmploymentFilter(
  job: PublicEnergJob,
  filterId: EmploymentFilterId
) {
  const jobType = normalizeSearchText(job.jobType);
  const workMode = normalizeSearchText(job.workMode);
  const location = normalizeSearchText(job.location);

  if (filterId === "remote") {
    return workMode.includes("remote") || location.includes("remote");
  }

  if (filterId === "full-time") {
    return (
      jobType.includes("full time") ||
      jobType.includes("full-time") ||
      jobType.includes("permanent")
    );
  }

  if (filterId === "internship") {
    return jobType.includes("intern") || normalizeSearchText(job.title).includes("intern");
  }

  if (filterId === "contract") {
    return jobType.includes("contract") || jobType.includes("consult");
  }

  return true;
}

function jobMatchesFilters(job: PublicEnergJob, state: EnergJobSearchState) {
  const titleResult = scoreQuery(buildGeneralSearchFields(job), state.titleQuery);
  if (!titleResult.matches) {
    return null;
  }

  const locationResult = scoreQuery(buildLocationSearchFields(job), state.locationQuery);
  if (!locationResult.matches) {
    return null;
  }

  const sidebarLocationResult = scoreQuery(
    buildLocationSearchFields(job),
    state.filterLocation
  );
  if (!sidebarLocationResult.matches) {
    return null;
  }

  if (
    state.experienceFilters.length > 0 &&
    !state.experienceFilters.some((filterId) => matchesExperienceFilter(job, filterId))
  ) {
    return null;
  }

  if (
    state.employmentFilters.length > 0 &&
    !state.employmentFilters.some((filterId) => matchesEmploymentFilter(job, filterId))
  ) {
    return null;
  }

  return titleResult.score + locationResult.score + sidebarLocationResult.score;
}

export function filterAndRankJobs(
  jobs: PublicEnergJob[],
  state: EnergJobSearchState
) {
  return jobs
    .map((job) => {
      const score = jobMatchesFilters(job, state);
      return score === null ? null : { job, score };
    })
    .filter((value): value is RankedPublicEnergJob => Boolean(value))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const rightTimestamp = getJobTimestamp(right.job);
      const leftTimestamp = getJobTimestamp(left.job);

      if (rightTimestamp !== leftTimestamp) {
        return rightTimestamp.localeCompare(leftTimestamp);
      }

      return left.job.title.localeCompare(right.job.title);
    });
}
