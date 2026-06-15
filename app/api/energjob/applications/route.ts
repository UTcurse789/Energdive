import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createCmsApplication,
  fetchCmsApplications,
  updateCmsJobApplicationRelation,
} from "@/lib/energjob-cms";
import { applicationCreateSchema } from "@/lib/energjob-schemas";
import {
  sendEnergJobApplicationApplicantEmail,
  sendEnergJobApplicationRecruiterEmail,
} from "@/lib/email";
import {
  createEnergJob,
  createEnergJobApplication,
  getEnergJobApplicationByJobAndEmail,
  getEnergJobById,
  getEnergJobByCmsId,
  getEnergJobByCmsDocumentId,
  getEnergJobRecruiterById,
  getEnergJobBySlug,
  logEnergJobSyncEvent,
  markEnergJobEntitySyncFailed,
  markEnergJobEntitySynced,
} from "@/lib/queries/energjob";
import { loadPublicEnergJobBySlug, type PublicEnergJob } from "@/lib/energjob-public";
import { slugify } from "@/lib/utils";

function buildJobRouteSlug(title: string, slug: string | null, id: number | string) {
  const base = slugify(slug || title) || "energjob-role";
  return `${base}-${id}`;
}

function getJobRouteId(job: { id: number; cms_id: number | null }) {
  return job.cms_id ?? job.id;
}

function getJobSnapshot(value: unknown): Partial<PublicEnergJob> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Partial<PublicEnergJob>;
  return typeof snapshot.title === "string" && snapshot.title.trim() ? snapshot : null;
}

export async function GET() {
  try {
    const data = await fetchCmsApplications();
    return NextResponse.json({ success: true, source: "cms", ...data });
  } catch (error: any) {
    console.error("[GET /api/energjob/applications]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Sign in is required before applying." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const payload = applicationCreateSchema.parse(body);
    const requestedJobSlug =
      typeof body?.jobSlug === "string" && body.jobSlug.trim() ? body.jobSlug.trim() : null;
    const requestedRouteSlug =
      typeof body?.routeSlug === "string" && body.routeSlug.trim()
        ? body.routeSlug.trim()
        : null;
    const requestedJobCmsDocumentId =
      typeof body?.jobCmsDocumentId === "string" && body.jobCmsDocumentId.trim()
        ? body.jobCmsDocumentId.trim()
        : null;
    const requestedJobSnapshot = getJobSnapshot(body?.jobSnapshot);
    const requestUrl = new URL(req.url);
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || requestUrl.host;
    let appUrl = `${forwardedProto}://${forwardedHost}`;
    if ((forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1")) && process.env.NEXT_PUBLIC_APP_URL) {
      appUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    const normalizedResumeUrl = payload.resumeUrl;

    let resolvedJob: Awaited<ReturnType<typeof getEnergJobById>> | null =
      (await getEnergJobById(payload.jobId)) ||
      (await getEnergJobByCmsId(payload.jobId)) ||
      (requestedJobCmsDocumentId
        ? await getEnergJobByCmsDocumentId(requestedJobCmsDocumentId)
        : null) ||
      (requestedJobSlug ? await getEnergJobBySlug(requestedJobSlug) : null);

    if (!resolvedJob && requestedRouteSlug) {
      const publicJob = requestedJobSnapshot || (await loadPublicEnergJobBySlug(requestedRouteSlug));

      if (publicJob) {
        const publicJobTitle =
          typeof publicJob.title === "string" ? publicJob.title.trim() : "";

        resolvedJob =
          (publicJob.cmsId != null ? await getEnergJobByCmsId(publicJob.cmsId) : null) ||
          (publicJob.cmsDocumentId
            ? await getEnergJobByCmsDocumentId(publicJob.cmsDocumentId)
            : null) ||
          (publicJob.slug ? await getEnergJobBySlug(publicJob.slug) : null);

        if (!resolvedJob && publicJobTitle) {
          const shadowJob = await createEnergJob({
            title: publicJobTitle,
            slug: publicJob.slug,
            sectors: Array.isArray(publicJob.sectors) ? publicJob.sectors : [],
            jobType: publicJob.jobType ?? null,
            workMode: publicJob.workMode ?? null,
            location: publicJob.location ?? null,
            experienceMin: publicJob.experienceMin ?? null,
            experienceMax: publicJob.experienceMax ?? null,
            salaryMin: publicJob.salaryMin ?? null,
            salaryMax: publicJob.salaryMax ?? null,
            description: publicJob.description ?? null,
            keyResponsibilities: publicJob.keyResponsibilities ?? null,
            requiredSkills: publicJob.requiredSkills ?? null,
            goodToHave: publicJob.goodToHave ?? null,
            qualification: publicJob.qualification ?? null,
            department: publicJob.department ?? null,
            roleCategory: publicJob.roleCategory ?? null,
            applyEmail: publicJob.applyEmail || publicJob.recruiterEmail || null,
            jobStatus: publicJob.status ?? null,
            openings: publicJob.openings ?? null,
          });

          if (publicJob.cmsId || publicJob.cmsDocumentId) {
            await markEnergJobEntitySynced("jobs", shadowJob.id, {
              id: publicJob.cmsId ?? null,
              documentId: publicJob.cmsDocumentId ?? null,
            });
          }

          resolvedJob = shadowJob;
        }
      }
    }

    if (!resolvedJob) {
      return NextResponse.json(
        {
          success: false,
          error: "This job could not be mapped to a live EnergJob record.",
        },
        { status: 404 }
      );
    }

    const applicationPayload = {
      ...payload,
      jobId: resolvedJob.id,
      resumeUrl: normalizedResumeUrl,
    };

    const existingApplication = await getEnergJobApplicationByJobAndEmail(
      resolvedJob.id,
      payload.applicantEmail
    );

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          alreadyApplied: true,
          error: "You have already applied to this job with this email.",
          local: existingApplication,
        },
        { status: 409 }
      );
    }

    let localApplication;
    try {
      localApplication = await createEnergJobApplication(applicationPayload);
    } catch (error: any) {
      if (
        error?.code === "23505" &&
        error?.constraint === "idx_energjob_applications_job_email"
      ) {
        const duplicateApplication = await getEnergJobApplicationByJobAndEmail(
          resolvedJob.id,
          payload.applicantEmail
        );

        return NextResponse.json(
          {
            success: false,
            alreadyApplied: true,
            error: "You have already applied to this job with this email.",
            local: duplicateApplication,
          },
          { status: 409 }
        );
      }

      throw error;
    }

    const job = resolvedJob;
    const recruiter =
      job?.posted_by_recruiter_id != null
        ? await getEnergJobRecruiterById(job.posted_by_recruiter_id)
        : null;
    const routeSlug = requestedRouteSlug || buildJobRouteSlug(job.title, job.slug, getJobRouteId(job));
    const jobUrl = `${appUrl}/energyjobs/${routeSlug}`;
    const companyName =
      recruiter?.company_name ||
      recruiter?.recruiter_name ||
      requestedJobSnapshot?.companyName ||
      requestedJobSnapshot?.recruiterName ||
      "EnergJob Employer";
    let syncStatus: "success" | "failed" = "success";
    let syncErrorMessage: string | null = null;
    let cmsResult: Awaited<ReturnType<typeof createCmsApplication>> | null = null;
    let relationWarning: string | null = null;

    try {
      cmsResult = await createCmsApplication({
        applicant_name: localApplication.applicant_name,
        applicant_email: localApplication.applicant_email,
        phone: localApplication.phone,
        resume_url: localApplication.resume_url,
        resumeFileId: payload.resumeFileId ?? null,
        cover_note: localApplication.cover_note,
        early_applicant: localApplication.early_applicant,
        application_status: localApplication.application_status,
      });

      await markEnergJobEntitySynced("applications", localApplication.id, {
        id: cmsResult.id,
        documentId: cmsResult.documentId,
      });

      if (job && (job.cms_document_id || job.cms_id) && (cmsResult.documentId || cmsResult.id)) {
        try {
          await updateCmsJobApplicationRelation(
            {
              cms_id: job.cms_id,
              cms_document_id: job.cms_document_id,
            },
            {
              cms_id: cmsResult.id,
              cms_document_id: cmsResult.documentId,
            }
          );
        } catch (relationError: any) {
          relationWarning =
            relationError?.message ||
            "Application was created in CMS, but linking it to the job failed.";
          console.error(
            "[POST /api/energjob/applications] CMS job relation update failed",
            relationError
          );
          await logEnergJobSyncEvent({
            entityType: "applications",
            entityId: localApplication.id,
            action: "link-job",
            status: "failed",
            requestPayload: {
              jobCmsId: job.cms_id,
              jobCmsDocumentId: job.cms_document_id,
              applicationCmsId: cmsResult.id,
              applicationCmsDocumentId: cmsResult.documentId,
            },
            errorMessage: relationWarning,
          });
        }
      }

      await logEnergJobSyncEvent({
        entityType: "applications",
        entityId: localApplication.id,
        action: "create",
        status: "success",
        requestPayload: applicationPayload,
        responsePayload: cmsResult.raw,
      });
    } catch (syncError: any) {
      syncStatus = "failed";
      syncErrorMessage = syncError.message || "Application sync failed.";
      const syncFailureMessage = syncErrorMessage || "Application sync failed.";
      await markEnergJobEntitySyncFailed(
        "applications",
        localApplication.id,
        syncFailureMessage
      );
      await logEnergJobSyncEvent({
        entityType: "applications",
        entityId: localApplication.id,
        action: "create",
        status: "failed",
        requestPayload: applicationPayload,
        errorMessage: syncFailureMessage,
      });
    }

    const applicationViewUrl = `${appUrl}/energyjobs/applications/${localApplication.recruiter_token}`;

    try {
      await Promise.all([
        sendEnergJobApplicationApplicantEmail({
          applicantEmail: localApplication.applicant_email,
          applicantName: localApplication.applicant_name,
          companyName,
          coverNote: localApplication.cover_note,
          jobTitle: job.title,
          jobUrl,
          phone: localApplication.phone,
          recruiterEmail: recruiter?.email || job.apply_email || requestedJobSnapshot?.recruiterEmail || requestedJobSnapshot?.applyEmail,
          recruiterName: recruiter?.recruiter_name || requestedJobSnapshot?.recruiterName || companyName,
          resumeUrl: localApplication.resume_url,
        }),
        sendEnergJobApplicationRecruiterEmail({
          applicantEmail: localApplication.applicant_email,
          applicantName: localApplication.applicant_name,
          companyName,
          coverNote: localApplication.cover_note,
          jobTitle: job.title,
          jobUrl,
          phone: localApplication.phone,
          recruiterEmail: recruiter?.email || job.apply_email || requestedJobSnapshot?.recruiterEmail || requestedJobSnapshot?.applyEmail,
          recruiterName: recruiter?.recruiter_name || requestedJobSnapshot?.recruiterName || companyName,
          resumeUrl: localApplication.resume_url,
          applicationViewUrl,
        }),
      ]);
    } catch (emailError) {
      console.error("[POST /api/energjob/applications] notification send failed", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        local: localApplication,
        cms: cmsResult,
        syncStatus,
        warning: syncErrorMessage || relationWarning,
      },
      { status: syncStatus === "success" ? 200 : 202 }
    );
  } catch (error: any) {
    console.error("[POST /api/energjob/applications]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create application" },
      { status: 500 }
    );
  }
}
