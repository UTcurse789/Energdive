import { getClient, query } from "@/lib/db";
import { slugify } from "@/lib/utils";
import crypto from "crypto";
import {
  ApplicationCreateInput,
  JobCreateInput,
  normalizeRichTextBlocks,
  PaymentCreateInput,
  PlanCreateInput,
  RecruiterCreateInput,
} from "@/lib/energjob-schemas";


export type SyncEntityType =
  | "plans"
  | "recruiters"
  | "jobs"
  | "applications"
  | "payments";

type SyncState = "pending" | "synced" | "failed";

type CmsSyncMeta = {
  id: number | null;
  documentId: string | null;
};

export type EnergJobPlanRow = {
  id: number;
  name: string;
  price: number;
  job_limit: number;
  duration: number;
  is_featured: boolean;
  is_active: boolean;
  cms_id: number | null;
  cms_document_id: string | null;
};

export type EnergJobRecruiterRow = {
  id: number;
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
  current_plan_id: number | null;
  latest_job_id: number | null;
  cms_id: number | null;
  cms_document_id: string | null;
};

export type EnergJobRow = {
  id: number;
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
  posted_by_recruiter_id: number | null;
  application_count: number;
  latest_application_id: number | null;
  cms_id: number | null;
  cms_document_id: string | null;
  external_apply_url: string | null;
};

export type PublicEnergJobRow = EnergJobRow & {
  company_name: string | null;
  recruiter_name: string | null;
  email: string | null;
  logo: string | null;
  company_description: unknown;
  website: string | null;
  address: string | null;
};

export type EnergJobApplicationRow = {
  id: number;
  job_id: number;
  applicant_name: string;
  applicant_email: string;
  phone: string | null;
  resume_url: string | null;
  cover_note: string | null;
  early_applicant: boolean;
  application_status: string;
  recruiter_token: string | null;
  cms_id: number | null;
  cms_document_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type EnergJobPaymentRow = {
  id: number;
  recruiter_id: number | null;
  plan_id: number | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  payment_status: string;
  expires_at: string | null;
  cms_id: number | null;
  cms_document_id: string | null;
};

const TABLE_BY_ENTITY: Record<SyncEntityType, string> = {
  plans: "energjob_plans",
  recruiters: "energjob_recruiters",
  jobs: "energjob_jobs",
  applications: "energjob_applications",
  payments: "energjob_payments",
};

async function createUniqueJobSlug(title: string, preferredSlug?: string | null) {
  const base = slugify(preferredSlug || title) || "energjob-role";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await query<{ id: number }>(
      `SELECT id FROM energjob_jobs WHERE slug = $1 LIMIT 1`,
      [candidate]
    );
    if (existing.rows.length === 0) {
      return candidate;
    }
    candidate = `${base}-${suffix++}`;
  }
}

export async function logEnergJobSyncEvent(args: {
  entityType: SyncEntityType;
  entityId: number;
  action: string;
  status: "success" | "failed";
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string | null;
}) {
  await query(
    `INSERT INTO energjob_sync_events (
      entity_type, entity_id, action, status, request_payload, response_payload, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      args.entityType,
      args.entityId,
      args.action,
      args.status,
      args.requestPayload ? JSON.stringify(args.requestPayload) : null,
      args.responsePayload ? JSON.stringify(args.responsePayload) : null,
      args.errorMessage || null,
    ]
  );
}

export async function markEnergJobEntitySynced(
  entityType: SyncEntityType,
  entityId: number,
  cms: CmsSyncMeta
) {
  await query(
    `UPDATE ${TABLE_BY_ENTITY[entityType]}
     SET cms_id = $1,
         cms_document_id = COALESCE($2, cms_document_id),
         sync_status = 'synced',
         sync_error = NULL,
         last_synced_at = NOW(),
         updated_at = NOW()
     WHERE id = $3`,
    [cms.id, cms.documentId, entityId]
  );
}

export async function markEnergJobEntitySyncFailed(
  entityType: SyncEntityType,
  entityId: number,
  errorMessage: string
) {
  await query(
    `UPDATE ${TABLE_BY_ENTITY[entityType]}
     SET sync_status = 'failed',
         sync_error = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [errorMessage, entityId]
  );
}

export async function createEnergJobPlan(input: PlanCreateInput) {
  const result = await query<EnergJobPlanRow>(
    `INSERT INTO energjob_plans (
      name, price, job_limit, duration, is_featured, is_active, sync_status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *`,
    [
      input.name,
      input.price,
      input.jobLimit,
      input.duration,
      input.isFeatured ?? false,
      input.isActive ?? true,
    ]
  );

  return result.rows[0];
}

export async function createEnergJobRecruiter(input: RecruiterCreateInput) {
  const result = await query<EnergJobRecruiterRow>(
    `INSERT INTO energjob_recruiters (
      recruiter_name, company_name, company_description, email, clerk_user_id,
      website, logo, address, plot_no_street, jobs_remaining, plans_expires_at,
      current_plan_id, sync_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
    RETURNING *`,
    [
      input.recruiterName,
      input.companyName,
      JSON.stringify(normalizeRichTextBlocks(input.companyDescription)),
      input.email,
      input.clerkUserId ?? null,
      input.website ?? null,
      input.logo ?? null,
      input.address ?? null,
      input.plotNoStreet ?? null,
      input.jobsRemaining ?? 0,
      input.plansExpiresAt ? input.plansExpiresAt.toISOString() : null,
      input.currentPlanId ?? null,
    ]
  );

  return result.rows[0];
}

export async function createEnergJob(input: JobCreateInput) {
  const slug = await createUniqueJobSlug(input.title, input.slug);

  const result = await query<EnergJobRow>(
    `INSERT INTO energjob_jobs (
      title, slug, sector_refs, job_type, work_mode, location,
      experience_min, experience_max, salary_min, salary_max,
      description, key_responsibilities, required_skills, good_to_have,
      qualification, department, role_category, apply_email, job_status,
      openings, posted_by_recruiter_id, external_apply_url, sync_status
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17, $18, $19,
      $20, $21, $22, 'pending'
    )
    RETURNING *`,
    [
      input.title,
      slug,
      (input.sectors ?? []).map((value) => String(value)),
      input.jobType ?? null,
      input.workMode ?? null,
      input.location ?? null,
      input.experienceMin ?? null,
      input.experienceMax ?? null,
      input.salaryMin ?? null,
      input.salaryMax ?? null,
      JSON.stringify(normalizeRichTextBlocks(input.description)),
      JSON.stringify(normalizeRichTextBlocks(input.keyResponsibilities)),
      JSON.stringify(normalizeRichTextBlocks(input.requiredSkills)),
      JSON.stringify(normalizeRichTextBlocks(input.goodToHave)),
      input.qualification ?? null,
      input.department ?? null,
      input.roleCategory ?? null,
      input.applyEmail ?? null,
      input.jobStatus ?? "draft",
      input.openings ?? 1,
      input.recruiterId ?? null,
      input.externalApplyUrl ?? null,
    ]
  );

  const job = result.rows[0];

  if (job.posted_by_recruiter_id) {
    await query(
      `UPDATE energjob_recruiters
       SET latest_job_id = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [job.id, job.posted_by_recruiter_id]
    );
  }

  return job;
}

export async function createEnergJobApplication(input: ApplicationCreateInput) {
  const client = await getClient();
  const token = crypto.randomUUID();

  try {
    await client.query("BEGIN");

    const result = await client.query<EnergJobApplicationRow>(
      `INSERT INTO energjob_applications (
        job_id, applicant_name, applicant_email, phone, resume_url,
        cover_note, early_applicant, application_status, recruiter_token, sync_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *`,
      [
        input.jobId,
        input.applicantName,
        input.applicantEmail,
        input.phone ?? null,
        input.resumeUrl ?? null,
        input.coverNote ?? null,
        input.earlyApplicant ?? false,
        input.applicationStatus ?? "received",
        token,
      ]
    );

    const application = result.rows[0];

    await client.query(
      `UPDATE energjob_jobs
       SET application_count = application_count + 1,
           latest_application_id = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [application.id, input.jobId]
    );

    await client.query("COMMIT");
    return application;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createEnergJobPayment(input: PaymentCreateInput) {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const paymentResult = await client.query<EnergJobPaymentRow>(
      `INSERT INTO energjob_payments (
        recruiter_id, plan_id, razorpay_order_id, razorpay_payment_id,
        amount, payment_status, expires_at, sync_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        input.recruiterId ?? null,
        input.planId ?? null,
        input.razorpayOrderId ?? null,
        input.razorpayPaymentId ?? null,
        input.amount,
        input.paymentStatus ?? "created",
        input.expiresAt ? input.expiresAt.toISOString() : null,
      ]
    );

    const payment = paymentResult.rows[0];

    const isCaptured = ["paid", "captured", "success", "completed"].includes(
      (payment.payment_status || "").toLowerCase()
    );

    if (isCaptured && payment.recruiter_id && payment.plan_id) {
      const planResult = await client.query<EnergJobPlanRow>(
        `SELECT * FROM energjob_plans WHERE id = $1 LIMIT 1`,
        [payment.plan_id]
      );

      const plan = planResult.rows[0];
      if (plan) {
        await client.query(
          `UPDATE energjob_recruiters
           SET current_plan_id = $1,
               jobs_remaining = COALESCE(jobs_remaining, 0) + $2,
               plans_expires_at = COALESCE($3, plans_expires_at),
               updated_at = NOW()
           WHERE id = $4`,
          [plan.id, plan.job_limit, payment.expires_at, payment.recruiter_id]
        );
      }
    }

    await client.query("COMMIT");
    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getEnergJobPlanById(id: number) {
  const result = await query<EnergJobPlanRow>(
    `SELECT * FROM energjob_plans WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getEnergJobRecruiterById(id: number) {
  const result = await query<EnergJobRecruiterRow>(
    `SELECT * FROM energjob_recruiters WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getEnergJobById(id: number) {
  const result = await query<EnergJobRow>(
    `SELECT * FROM energjob_jobs WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getEnergJobBySlug(slug: string) {
  const result = await query<EnergJobRow>(
    `SELECT * FROM energjob_jobs WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function getEnergJobByCmsId(cmsId: number) {
  const result = await query<EnergJobRow>(
    `SELECT * FROM energjob_jobs WHERE cms_id = $1 LIMIT 1`,
    [cmsId]
  );
  return result.rows[0] || null;
}

export async function getEnergJobByCmsDocumentId(cmsDocumentId: string) {
  const result = await query<EnergJobRow>(
    `SELECT * FROM energjob_jobs WHERE cms_document_id = $1 LIMIT 1`,
    [cmsDocumentId]
  );
  return result.rows[0] || null;
}

export async function getEnergJobApplicationById(id: number) {
  const result = await query<EnergJobApplicationRow>(
    `SELECT * FROM energjob_applications WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getEnergJobApplicationByToken(token: string) {
  const result = await query<EnergJobApplicationRow>(
    `SELECT * FROM energjob_applications WHERE recruiter_token = $1 LIMIT 1`,
    [token]
  );
  return result.rows[0] || null;
}

export async function updateEnergJobApplicationStatus(id: number, status: string) {
  const result = await query<EnergJobApplicationRow>(
    `UPDATE energjob_applications
     SET application_status = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

export async function getEnergJobApplicationByJobAndEmail(
  jobId: number,
  applicantEmail: string
) {
  const result = await query<EnergJobApplicationRow>(
    `SELECT *
     FROM energjob_applications
     WHERE job_id = $1
       AND lower(applicant_email) = lower($2)
     LIMIT 1`,
    [jobId, applicantEmail]
  );
  return result.rows[0] || null;
}

export async function getEnergJobPaymentById(id: number) {
  const result = await query<EnergJobPaymentRow>(
    `SELECT * FROM energjob_payments WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function listEnergJobPlans() {
  const result = await query<EnergJobPlanRow>(
    `SELECT *
     FROM energjob_plans
     ORDER BY price ASC, created_at DESC`
  );
  return result.rows;
}

export async function listEnergJobRecruiters() {
  const result = await query<EnergJobRecruiterRow>(
    `SELECT *
     FROM energjob_recruiters
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function listEnergJobs(filters?: {
  limit?: number;
  status?: string | null;
}) {
  const values: unknown[] = [];
  const where: string[] = [];

  if (filters?.status) {
    values.push(filters.status);
    where.push(`job_status = $${values.length}`);
  }

  let sql = `SELECT *
             FROM energjob_jobs`;

  if (where.length > 0) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }

  sql += ` ORDER BY created_at DESC`;

  if (filters?.limit && Number.isFinite(filters.limit) && filters.limit > 0) {
    values.push(filters.limit);
    sql += ` LIMIT $${values.length}`;
  }

  const result = await query<EnergJobRow>(sql, values);
  return result.rows;
}

export async function listPublicEnergJobs(filters?: {
  limit?: number;
  status?: string | null;
}) {
  const values: unknown[] = [];
  const where: string[] = [];

  if (filters?.status) {
    values.push(filters.status);
    where.push(`j.job_status = $${values.length}`);
  }

  let sql = `SELECT
               j.*,
               r.company_name,
               r.recruiter_name,
               r.email,
               r.logo,
               r.company_description,
               r.website,
               r.address
             FROM energjob_jobs j
             LEFT JOIN energjob_recruiters r
               ON r.id = j.posted_by_recruiter_id`;

  if (where.length > 0) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }

  sql += ` ORDER BY j.created_at DESC`;

  if (filters?.limit && Number.isFinite(filters.limit) && filters.limit > 0) {
    values.push(filters.limit);
    sql += ` LIMIT $${values.length}`;
  }

  const result = await query<PublicEnergJobRow>(sql, values);
  return result.rows;
}

export async function listEnergJobApplications() {
  const result = await query<EnergJobApplicationRow>(
    `SELECT *
     FROM energjob_applications
     ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function listEnergJobPayments() {
  const result = await query<EnergJobPaymentRow>(
    `SELECT *
     FROM energjob_payments
     ORDER BY created_at DESC`
  );
  return result.rows;
}
