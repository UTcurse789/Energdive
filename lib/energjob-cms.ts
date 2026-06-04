import qs from "qs";
import { normalizeRichTextBlocks } from "@/lib/energjob-schemas";

const ENERGJOB_STRAPI_URL =
  process.env.ENERGJOB_STRAPI_URL ||
  process.env.ENERGJOB_STRAPI_API_URL ||
  "https://cms-staging.energdive.com";

const ENERGJOB_STRAPI_TOKEN = process.env.ENERGJOB_STRAPI_TOKEN || "";

type CmsEntity = "jobs" | "recruiters" | "applications" | "plans" | "payments";

type CmsIdentifier = {
  cms_id: number | null;
  cms_document_id: string | null;
};

type CmsRequestOptions = RequestInit & {
  params?: Record<string, unknown>;
};

export type CmsSyncResult = {
  id: number | null;
  documentId: string | null;
  raw: unknown;
};

export class EnergJobCmsUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnergJobCmsUnauthorizedError";
  }
}

function getHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(ENERGJOB_STRAPI_TOKEN
      ? { Authorization: `Bearer ${ENERGJOB_STRAPI_TOKEN}` }
      : {}),
    ...extra,
  };
}

async function energJobCmsRequest<T>(
  endpoint: string,
  { params, ...options }: CmsRequestOptions = {}
): Promise<T> {
  const query = params ? qs.stringify(params, { encodeValuesOnly: true }) : "";
  const url = `${ENERGJOB_STRAPI_URL.replace(/\/$/, "")}/api/${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new EnergJobCmsUnauthorizedError(
        `EnergJob CMS unauthorized. Check ENERGJOB_STRAPI_TOKEN for ${ENERGJOB_STRAPI_URL}. Response: ${text}`
      );
    }
    throw new Error(`EnergJob CMS error (${response.status}): ${text || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function extractSyncResult(response: any): CmsSyncResult {
  const item = response?.data ?? response;
  return {
    id: typeof item?.id === "number" ? item.id : null,
    documentId: typeof item?.documentId === "string" ? item.documentId : null,
    raw: response,
  };
}

function getRelationValue(record?: CmsIdentifier | null) {
  if (!record) return undefined;
  return record.cms_document_id || record.cms_id || undefined;
}

function getUpdateTarget(record: CmsIdentifier) {
  return record.cms_document_id || record.cms_id;
}

function normalizeCmsApplicationStatus(status: string | null | undefined) {
  const normalized = (status || "").trim().toLowerCase();

  switch (normalized) {
    case "received":
    case "recived":
      return "recived";
    case "viewed":
      return "viewed";
    case "shortlisted":
      return "shortlisted";
    case "rejected":
      return "rejected";
    default:
      return "recived";
  }
}

export async function fetchEnergJobCollection(
  entity: CmsEntity,
  params: Record<string, unknown> = {}
) {
  return energJobCmsRequest<{ data: any[]; meta?: any }>(entity, {
    method: "GET",
    params,
  });
}

export async function fetchCmsJobs(params: Record<string, unknown> = {}) {
  return fetchEnergJobCollection("jobs", {
    populate: {
      posted_by: {
        populate: ["logo"],
      },
      application: true,
      sectors: true,
    },
    sort: ["createdAt:desc"],
    ...params,
  });
}

export async function fetchCmsRecruiters(params: Record<string, unknown> = {}) {
  return fetchEnergJobCollection("recruiters", {
    populate: ["current_plan", "payments", "jobs", "job", "logo"],
    sort: ["createdAt:desc"],
    ...params,
  });
}

export async function fetchCmsApplications(params: Record<string, unknown> = {}) {
  return fetchEnergJobCollection("applications", {
    populate: ["jobs"],
    sort: ["createdAt:desc"],
    ...params,
  });
}

export async function fetchCmsPlans(params: Record<string, unknown> = {}) {
  return fetchEnergJobCollection("plans", {
    sort: ["price:asc"],
    ...params,
  });
}

export async function fetchCmsPayments(params: Record<string, unknown> = {}) {
  return fetchEnergJobCollection("payments", {
    populate: ["plan"],
    sort: ["createdAt:desc"],
    ...params,
  });
}

export async function createCmsPlan(plan: {
  name: string;
  price: number;
  job_limit: number;
  duration: number;
  is_featured: boolean;
  is_active: boolean;
}) {
  const response = await energJobCmsRequest("plans", {
    method: "POST",
    body: JSON.stringify({
      data: {
        name: plan.name,
        price: plan.price,
        job_limit: plan.job_limit,
        duration: plan.duration,
        is_featured: plan.is_featured,
        is_active: plan.is_active,
      },
    }),
  });

  return extractSyncResult(response);
}

export async function createCmsRecruiter(
  recruiter: {
    recruiter_name: string;
    company_name: string;
    company_description: unknown;
    email: string;
    clerk_user_id: string | null;
    website: string | null;
    logo: string | null;
    address: string | null;
    plot_no_street: string | null;
    jobs_remaining: number;
    plans_expires_at: string | null;
  },
  relations?: {
    currentPlan?: CmsIdentifier | null;
  }
) {
  const data: Record<string, unknown> = {
    recruiter_name: recruiter.recruiter_name,
    company_name: recruiter.company_name,
    company_description: normalizeRichTextBlocks(recruiter.company_description as any),
    email: recruiter.email,
    clerk_user_id: recruiter.clerk_user_id,
    website: recruiter.website,
    address: recruiter.address,
    plot_no_street: recruiter.plot_no_street,
    jobs_remaining: recruiter.jobs_remaining,
    plans_expires_at: recruiter.plans_expires_at,
  };

  const logoValue = recruiter.logo?.trim();
  if (logoValue && !/^https?:\/\//i.test(logoValue)) {
    data.logo = logoValue;
  }

  const currentPlan = getRelationValue(relations?.currentPlan);
  if (currentPlan) {
    data.current_plan = currentPlan;
  }

  const response = await energJobCmsRequest("recruiters", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  return extractSyncResult(response);
}

export async function createCmsJob(
  job: {
    title: string;
    slug: string;
    sector_refs: string[];
    job_type: string | null;
    work_mode: string | null;
    location: string | null;
    experience_min: number | null;
    experience_max: number | null;
    salary_min: number | null;
    salary_max: number | null;
    description: unknown;
    key_responsibilities: unknown;
    required_skills: unknown;
    good_to_have: unknown;
    qualification: string | null;
    department: string | null;
    role_category: string | null;
    apply_email: string | null;
    job_status: string;
    openings: number;
  },
  relations?: {
    postedBy?: CmsIdentifier | null;
    application?: CmsIdentifier | null;
  }
) {
  const data: Record<string, unknown> = {
    title: job.title,
    slug: job.slug,
    sectors: job.sector_refs,
    job_type: job.job_type,
    work_mode: job.work_mode,
    location: job.location,
    experience_min: job.experience_min,
    experience_max: job.experience_max,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    description: normalizeRichTextBlocks(job.description as any),
    key_responsibilities: normalizeRichTextBlocks(job.key_responsibilities as any),
    required_skills: normalizeRichTextBlocks(job.required_skills as any),
    good_to_have: normalizeRichTextBlocks(job.good_to_have as any),
    qualification: job.qualification,
    department: job.department,
    role_category: job.role_category,
    apply_email: job.apply_email,
    job_status: job.job_status,
    openings: job.openings,
  };

  const postedBy = getRelationValue(relations?.postedBy);
  if (postedBy) {
    data.posted_by = postedBy;
  }

  const application = getRelationValue(relations?.application);
  if (application) {
    data.application = application;
  }

  const response = await energJobCmsRequest("jobs", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  return extractSyncResult(response);
}

export async function createCmsApplication(
  application: {
    applicant_name: string;
    applicant_email: string;
    phone: string | null;
    resume_url: string | null;
    resumeFileId: number | null;
    cover_note: string | null;
    early_applicant: boolean;
    application_status: string;
  }
) {
  const data: Record<string, unknown> = {
    applicant_name: application.applicant_name,
    applicant_email: application.applicant_email,
    phone: application.phone,
    cover_note: application.cover_note,
    early_applicant: application.early_applicant,
    application_status: normalizeCmsApplicationStatus(application.application_status),
  };

  // Strapi 'resume' field is a media relation — link it by file ID
  if (application.resumeFileId) {
    data.resume = application.resumeFileId;
  }

  const response = await energJobCmsRequest("applications", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  return extractSyncResult(response);
}

export async function updateCmsApplicationStatus(
  application: CmsIdentifier,
  newStatus: string
) {
  const target = application.cms_document_id || application.cms_id;
  if (!target) {
    throw new Error("Cannot update application CMS record without CMS identifier");
  }

  const response = await energJobCmsRequest(`applications/${target}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        application_status: normalizeCmsApplicationStatus(newStatus),
      },
    }),
  });

  return extractSyncResult(response);
}

export async function createCmsPayment(
  payment: {
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    amount: number;
    payment_status: string;
    expires_at: string | null;
  },
  relations?: {
    plan?: CmsIdentifier | null;
  }
) {
  const data: Record<string, unknown> = {
    razorpay_order_id: payment.razorpay_order_id,
    razorpay_payment_id: payment.razorpay_payment_id,
    amount: payment.amount,
    payment_status: payment.payment_status,
    expires_at: payment.expires_at,
  };

  const plan = getRelationValue(relations?.plan);
  if (plan) {
    data.plan = plan;
  }

  const response = await energJobCmsRequest("payments", {
    method: "POST",
    body: JSON.stringify({ data }),
  });

  return extractSyncResult(response);
}

export async function updateCmsRecruiterRelations(
  recruiter: CmsIdentifier,
  relations: {
    currentPlan?: CmsIdentifier | null;
    latestJob?: CmsIdentifier | null;
    jobs?: CmsIdentifier[];
    payments?: CmsIdentifier[];
    jobsRemaining?: number;
    plansExpiresAt?: string | null;
  }
) {
  const target = getUpdateTarget(recruiter);
  if (!target) {
    throw new Error("Cannot update recruiter CMS record without CMS identifier");
  }

  const data: Record<string, unknown> = {};

  if (relations.currentPlan) {
    data.current_plan = getRelationValue(relations.currentPlan);
  }
  if (relations.latestJob) {
    data.job = getRelationValue(relations.latestJob);
  }
  if (relations.jobs?.length) {
    data.jobs = {
      connect: relations.jobs
        .map((item) => getRelationValue(item))
        .filter(Boolean),
    };
  }
  if (relations.payments?.length) {
    data.payments = {
      connect: relations.payments
        .map((item) => getRelationValue(item))
        .filter(Boolean),
    };
  }
  if (relations.jobsRemaining !== undefined) {
    data.jobs_remaining = relations.jobsRemaining;
  }
  if (relations.plansExpiresAt !== undefined) {
    data.plans_expires_at = relations.plansExpiresAt;
  }

  const response = await energJobCmsRequest(`recruiters/${target}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });

  return extractSyncResult(response);
}

export async function updateCmsJobApplicationRelation(
  job: CmsIdentifier,
  application: CmsIdentifier
) {
  const target = getUpdateTarget(job);
  if (!target) {
    throw new Error("Cannot update job CMS record without CMS identifier");
  }

  const response = await energJobCmsRequest(`jobs/${target}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        application: getRelationValue(application),
      },
    }),
  });

  return extractSyncResult(response);
}
