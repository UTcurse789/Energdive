import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  createCmsJob,
  fetchCmsJobs,
  isEnergJobCmsConfigured,
  updateCmsRecruiterRelations,
} from "@/lib/energjob-cms";
import { jobCreateSchema } from "@/lib/energjob-schemas";
import {
  createEnergJob,
  getEnergJobApplicationById,
  getEnergJobRecruiterById,
  listEnergJobs,
  logEnergJobSyncEvent,
  markEnergJobEntitySyncFailed,
  markEnergJobEntitySynced,
} from "@/lib/queries/energjob";

type JobsSource = "local" | "cms" | "auto";

function getJobsSource(value: string | null): JobsSource {
  const normalized = (value || process.env.ENERGJOB_PUBLIC_JOBS_SOURCE || "cms")
    .trim()
    .toLowerCase();

  if (normalized === "local" || normalized === "auto") {
    return normalized;
  }

  return "cms";
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get("limit");
  const status = searchParams.get("status");
  const source = getJobsSource(searchParams.get("source"));

  async function loadLocalJobs(warning?: string) {
    const localJobs = await listEnergJobs({
      limit: limit ? Number(limit) : undefined,
      status,
    });

    return NextResponse.json({
      success: true,
      source: "local",
      ...(warning ? { warning } : {}),
      data: localJobs,
      meta: {
        total: localJobs.length,
      },
    });
  }

  if (source === "local") {
    try {
      return await loadLocalJobs();
    } catch (error: any) {
      console.error("[GET /api/energjob/jobs] Local fetch failed", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch local jobs" },
        { status: 502 }
      );
    }
  }

  try {
    const params: Record<string, unknown> = {
      sort: ["createdAt:desc"],
    };

    if (limit) {
      params.pagination = { pageSize: Number(limit) };
    }
    if (status) {
      params.filters = { job_status: { $eq: status } };
    }

    if (!isEnergJobCmsConfigured()) {
      throw new Error("ENERGJOB_STRAPI_URL is not configured");
    }

    const data = await fetchCmsJobs(params);
    return NextResponse.json({ success: true, source: "cms", ...data });
  } catch (error: any) {
    console.error("[GET /api/energjob/jobs]", error);

    if (source === "auto") {
      try {
        return await loadLocalJobs(error.message || "CMS fetch failed; returning local DB data");
      } catch (fallbackError: any) {
        console.error("[GET /api/energjob/jobs] Local fallback failed", fallbackError);
      }
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch jobs" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const payload = jobCreateSchema.parse(body);

    const localJob = await createEnergJob(payload);
    const recruiter = localJob.posted_by_recruiter_id
      ? await getEnergJobRecruiterById(localJob.posted_by_recruiter_id)
      : null;
    const application = localJob.latest_application_id
      ? await getEnergJobApplicationById(localJob.latest_application_id)
      : null;

    try {
      const cmsResult = await createCmsJob(
        {
          title: localJob.title,
          slug: localJob.slug,
          sector_refs: localJob.sector_refs || [],
          job_type: localJob.job_type,
          work_mode: localJob.work_mode,
          location: localJob.location,
          experience_min: localJob.experience_min,
          experience_max: localJob.experience_max,
          salary_min: localJob.salary_min ? Number(localJob.salary_min) : null,
          salary_max: localJob.salary_max ? Number(localJob.salary_max) : null,
          description: localJob.description,
          key_responsibilities: localJob.key_responsibilities,
          required_skills: localJob.required_skills,
          good_to_have: localJob.good_to_have,
          qualification: localJob.qualification,
          department: localJob.department,
          role_category: localJob.role_category,
          apply_email: localJob.apply_email,
          job_status: localJob.job_status,
          openings: localJob.openings,
          external_apply_url: localJob.external_apply_url,
        },
        {
          postedBy: recruiter
            ? {
                cms_id: recruiter.cms_id,
                cms_document_id: recruiter.cms_document_id,
              }
            : null,
          application: application
            ? {
                cms_id: application.cms_id,
                cms_document_id: application.cms_document_id,
              }
            : null,
        }
      );

      await markEnergJobEntitySynced("jobs", localJob.id, {
        id: cmsResult.id,
        documentId: cmsResult.documentId,
      });

      if (recruiter && (recruiter.cms_document_id || recruiter.cms_id)) {
        await updateCmsRecruiterRelations(
          {
            cms_id: recruiter.cms_id,
            cms_document_id: recruiter.cms_document_id,
          },
          {
            latestJob: {
              cms_id: cmsResult.id,
              cms_document_id: cmsResult.documentId,
            },
            jobs: [
              {
                cms_id: cmsResult.id,
                cms_document_id: cmsResult.documentId,
              },
            ],
          }
        );
      }

      await logEnergJobSyncEvent({
        entityType: "jobs",
        entityId: localJob.id,
        action: "create",
        status: "success",
        requestPayload: payload,
        responsePayload: cmsResult.raw,
      });

      return NextResponse.json({
        success: true,
        local: localJob,
        cms: cmsResult,
      });
    } catch (syncError: any) {
      await markEnergJobEntitySyncFailed("jobs", localJob.id, syncError.message);
      await logEnergJobSyncEvent({
        entityType: "jobs",
        entityId: localJob.id,
        action: "create",
        status: "failed",
        requestPayload: payload,
        errorMessage: syncError.message,
      });

      return NextResponse.json(
        {
          success: false,
          local: localJob,
          syncStatus: "failed",
          error: syncError.message,
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/energjob/jobs]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
