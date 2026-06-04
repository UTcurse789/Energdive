import { slugify } from "@/lib/utils";
import { EnergJobCmsUnauthorizedError, fetchCmsJobs } from "@/lib/energjob-cms";
import { listPublicEnergJobs, PublicEnergJobRow } from "@/lib/queries/energjob";
import { strapiImageUrl, strapiMediaUrl } from "@/lib/strapi-image";

type RichTextBlock = any[];

export type PublicEnergJob = {
  id: number | string;
  cmsDocumentId: string | null;
  cmsId: number | null;
  slug: string | null;
  routeSlug: string;
  title: string;
  companyName: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  companyLogoUrl: string | null;
  companyDescription: RichTextBlock;
  companyDescriptionLines: string[];
  companyWebsite: string | null;
  companyAddress: string | null;
  location: string | null;
  jobType: string | null;
  workMode: string | null;
  status: string | null;
  applyEmail: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceMin: number | null;
  experienceMax: number | null;
  sectors: string[];
  skills: string[];
  bonusSkills: string[];
  skillTags: string[];
  qualification: string | null;
  department: string | null;
  roleCategory: string | null;
  openings: number | null;
  description: RichTextBlock;
  descriptionText: string;
  descriptionLines: string[];
  keyResponsibilities: RichTextBlock;
  keyResponsibilityLines: string[];
  requiredSkills: RichTextBlock;
  requiredSkillLines: string[];
  goodToHave: RichTextBlock;
  goodToHaveLines: string[];
  summary: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
};

function pickValue(record: any, key: string) {
  if (record?.[key] !== undefined) {
    return record[key];
  }

  if (record?.attributes?.[key] !== undefined) {
    return record.attributes[key];
  }

  return null;
}

function pickSingleRelation(record: any, key: string) {
  const value = pickValue(record, key);

  if (!value) {
    return null;
  }

  if (Array.isArray(value?.data)) {
    return value.data[0] ?? null;
  }

  if (value?.data) {
    return value.data;
  }

  return value;
}

function pickManyRelation(record: any, key: string) {
  const value = pickValue(record, key);

  if (!value) {
    return [];
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSectorName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return toTitleCase(trimmed);
}

function normalizeStatus(value: string | null) {
  return (value || "").toLowerCase();
}

function isVisibleStatus(value: string | null) {
  return !["closed", "archived", "expired", "inactive"].includes(normalizeStatus(value));
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBlocks(value: unknown): RichTextBlock {
  return Array.isArray(value) ? value : [];
}

function extractTextFromNode(node: any): string {
  if (!node) {
    return "";
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }

  return "";
}

function extractLinesFromBlocks(blocks: RichTextBlock): string[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .map((block) => extractTextFromNode(block).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractPlainText(blocks: RichTextBlock) {
  return extractLinesFromBlocks(blocks).join(" ").trim();
}

function buildSummary(text: string) {
  if (!text) {
    return "";
  }

  if (text.length <= 190) {
    return text;
  }

  return `${text.slice(0, 187).trimEnd()}...`;
}

function sanitizeTag(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[.;:]+$/g, "")
    .trim();
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const line of lines) {
    const candidate = sanitizeTag(line);
    if (!candidate) {
      continue;
    }

    const normalized = candidate.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    tags.push(candidate);
  }

  return tags;
}

function buildRouteSlug(title: string, slug: string | null, id: number | string) {
  const base = slugify(slug || title) || "energjob-role";
  return `${base}-${id}`;
}

function getStableRouteId(job: Pick<PublicEnergJob, "id" | "cmsId">) {
  return job.cmsId ?? job.id;
}

function matchesLegacyRouteSlug(job: PublicEnergJob, routeSlug: string) {
  const match = routeSlug.match(/^(.*)-(\d+)$/);
  if (!match) {
    return false;
  }

  const [, requestedBase, requestedId] = match;
  const jobBase = slugify(job.slug || job.title) || "energjob-role";
  if (jobBase !== requestedBase) {
    return false;
  }

  return String(job.id) === requestedId || (job.cmsId != null && String(job.cmsId) === requestedId);
}

function normalizeDate(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeCmsJob(job: any): PublicEnergJob | null {
  const title = pickValue(job, "title");
  if (!title || typeof title !== "string") {
    return null;
  }

  const id = pickValue(job, "id") ?? title;
  const cmsDocumentId = pickValue(job, "documentId");
  const slug = pickValue(job, "slug");
  const postedBy = pickSingleRelation(job, "posted_by");
  const sectors = pickManyRelation(job, "sectors")
    .map((sector: any) =>
      normalizeSectorName(
        pickValue(sector, "name") || pickValue(sector, "title") || pickValue(sector, "slug")
      )
    )
    .filter((sector: string | null): sector is string => Boolean(sector));
  const description = normalizeBlocks(pickValue(job, "description"));
  const keyResponsibilities = normalizeBlocks(pickValue(job, "key_responsibilities"));
  const requiredSkills = normalizeBlocks(pickValue(job, "required_skills"));
  const goodToHave = normalizeBlocks(pickValue(job, "good_to_have"));
  const companyDescription = normalizeBlocks(pickValue(postedBy, "company_description"));
  const descriptionText = extractPlainText(description);
  const requiredSkillLines = extractLinesFromBlocks(requiredSkills);
  const goodToHaveLines = extractLinesFromBlocks(goodToHave);

  return {
    id,
    cmsDocumentId: typeof cmsDocumentId === "string" ? cmsDocumentId : null,
    cmsId: typeof id === "number" ? id : null,
    slug,
    routeSlug: buildRouteSlug(title, slug, id),
    title,
    companyName: pickValue(postedBy, "company_name") || null,
    recruiterName: pickValue(postedBy, "recruiter_name") || null,
    recruiterEmail: pickValue(postedBy, "email") || null,
    companyLogoUrl: pickValue(postedBy, "logo") ? strapiMediaUrl(pickValue(postedBy, "logo"), "") : null,
    companyDescription,
    companyDescriptionLines: extractLinesFromBlocks(companyDescription),
    companyWebsite: pickValue(postedBy, "website") || null,
    companyAddress: pickValue(postedBy, "address") || null,
    location: pickValue(job, "location"),
    jobType: pickValue(job, "job_type"),
    workMode: pickValue(job, "work_mode"),
    status: pickValue(job, "job_status"),
    applyEmail: pickValue(job, "apply_email"),
    salaryMin: toNumber(pickValue(job, "salary_min")),
    salaryMax: toNumber(pickValue(job, "salary_max")),
    experienceMin: toNumber(pickValue(job, "experience_min")),
    experienceMax: toNumber(pickValue(job, "experience_max")),
    sectors: sectors.length > 0 ? sectors : ["Open Roles"],
    skills: requiredSkillLines,
    bonusSkills: goodToHaveLines,
    skillTags: uniqueLines(goodToHaveLines).slice(0, 10),
    qualification: pickValue(job, "qualification"),
    department: pickValue(job, "department"),
    roleCategory: pickValue(job, "role_category"),
    openings: toNumber(pickValue(job, "openings")),
    description,
    descriptionText,
    descriptionLines: extractLinesFromBlocks(description),
    keyResponsibilities,
    keyResponsibilityLines: extractLinesFromBlocks(keyResponsibilities),
    requiredSkills,
    requiredSkillLines,
    goodToHave,
    goodToHaveLines,
    summary: buildSummary(descriptionText),
    createdAt: normalizeDate(pickValue(job, "createdAt")),
    updatedAt: normalizeDate(pickValue(job, "updatedAt")),
    publishedAt: normalizeDate(pickValue(job, "publishedAt")),
  };
}

function normalizeLocalJob(job: PublicEnergJobRow): PublicEnergJob {
  const sectors = (job.sector_refs || [])
    .map((sector) => normalizeSectorName(sector))
    .filter((sector: string | null): sector is string => Boolean(sector));
  const description = normalizeBlocks(job.description);
  const keyResponsibilities = normalizeBlocks(job.key_responsibilities);
  const requiredSkills = normalizeBlocks(job.required_skills);
  const goodToHave = normalizeBlocks(job.good_to_have);
  const companyDescription = normalizeBlocks(job.company_description);
  const descriptionText = extractPlainText(description);
  const requiredSkillLines = extractLinesFromBlocks(requiredSkills);
  const goodToHaveLines = extractLinesFromBlocks(goodToHave);

  return {
    id: job.id,
    cmsDocumentId: job.cms_document_id,
    cmsId: job.cms_id,
    slug: job.slug,
    routeSlug: buildRouteSlug(job.title, job.slug, job.cms_id ?? job.id),
    title: job.title,
    companyName: job.company_name,
    recruiterName: job.recruiter_name,
    recruiterEmail: job.email,
    companyLogoUrl: job.logo ? strapiImageUrl(job.logo, "") : null,
    companyDescription,
    companyDescriptionLines: extractLinesFromBlocks(companyDescription),
    companyWebsite: job.website,
    companyAddress: job.address,
    location: job.location,
    jobType: job.job_type,
    workMode: job.work_mode,
    status: job.job_status,
    applyEmail: job.apply_email,
    salaryMin: toNumber(job.salary_min),
    salaryMax: toNumber(job.salary_max),
    experienceMin: toNumber(job.experience_min),
    experienceMax: toNumber(job.experience_max),
    sectors: sectors.length > 0 ? sectors : ["Open Roles"],
    skills: requiredSkillLines,
    bonusSkills: goodToHaveLines,
    skillTags: uniqueLines(goodToHaveLines).slice(0, 10),
    qualification: job.qualification,
    department: job.department,
    roleCategory: job.role_category,
    openings: toNumber(job.openings),
    description,
    descriptionText,
    descriptionLines: extractLinesFromBlocks(description),
    keyResponsibilities,
    keyResponsibilityLines: extractLinesFromBlocks(keyResponsibilities),
    requiredSkills,
    requiredSkillLines,
    goodToHave,
    goodToHaveLines,
    summary: buildSummary(descriptionText),
    createdAt: null,
    updatedAt: null,
    publishedAt: null,
  };
}

export async function loadPublicEnergJobs(limit = 60) {
  // Prefer CMS data (has full recruiter + logo populated) over local DB
  try {
    const cmsResponse = await fetchCmsJobs({
      pagination: { pageSize: limit },
      sort: ["createdAt:desc"],
    });

    const cmsJobs = (cmsResponse.data || [])
      .map(normalizeCmsJob)
      .filter((job): job is PublicEnergJob => Boolean(job))
      .filter((job) => isVisibleStatus(job.status));

    if (cmsJobs.length > 0) {
      return cmsJobs;
    }
  } catch {
    // CMS unreachable — fall through to local DB
  }

  // Fallback: use local DB
  try {
    const localJobs = await listPublicEnergJobs({ limit });

    if (localJobs && localJobs.length > 0) {
      const normalizedLocalJobs = localJobs
        .map(normalizeLocalJob)
        .filter((job): job is PublicEnergJob => Boolean(job))
        .filter((job) => isVisibleStatus(job.status));

      if (normalizedLocalJobs.length > 0) {
        return normalizedLocalJobs;
      }
    }
  } catch {
    // Local tables may not exist — silently fail
  }

  return [];
}

export async function loadPublicEnergJobBySlug(routeSlug: string) {
  const jobs = await loadPublicEnergJobs(200);
  return (
    jobs.find((job) => job.routeSlug === routeSlug) ||
    jobs.find((job) => buildRouteSlug(job.title, job.slug, getStableRouteId(job)) === routeSlug) ||
    jobs.find((job) => matchesLegacyRouteSlug(job, routeSlug)) ||
    null
  );
}

export async function loadRelatedPublicEnergJobs(
  currentJob: PublicEnergJob,
  limit = 6
) {
  const jobs = await loadPublicEnergJobs(200);
  const primarySector = currentJob.sectors[0];

  return jobs
    .filter((job) => job.routeSlug !== currentJob.routeSlug)
    .sort((left, right) => {
      const leftScore =
        Number(left.companyName === currentJob.companyName) * 3 +
        Number(left.sectors.includes(primarySector)) * 2 +
        Number(left.jobType === currentJob.jobType);
      const rightScore =
        Number(right.companyName === currentJob.companyName) * 3 +
        Number(right.sectors.includes(primarySector)) * 2 +
        Number(right.jobType === currentJob.jobType);

      return rightScore - leftScore;
    })
    .slice(0, limit);
}
