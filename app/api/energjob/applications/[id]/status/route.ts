import { NextRequest, NextResponse } from "next/server";
import {
  getEnergJobApplicationById,
  updateEnergJobApplicationStatus,
  getEnergJobById,
  getEnergJobRecruiterById,
} from "@/lib/queries/energjob";
import { updateCmsApplicationStatus } from "@/lib/energjob-cms";
import {
  sendApplicationViewedEmail,
  sendApplicationShortlistedEmail,
} from "@/lib/email";
import { slugify } from "@/lib/utils";
import { loadPublicEnergJobBySlug } from "@/lib/energjob-public";

function buildJobRouteSlug(title: string, slug: string | null, id: number | string) {
  const base = slugify(slug || title) || "energjob-role";
  return `${base}-${id}`;
}

function getJobRouteId(job: { id: number; cms_id: number | null }) {
  return job.cms_id ?? job.id;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID." },
        { status: 400 }
      );
    }

    const { status, token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Recruiter token is required." },
        { status: 401 }
      );
    }

    if (!["viewed", "shortlisted"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status update. Only 'viewed' or 'shortlisted' are allowed." },
        { status: 400 }
      );
    }

    // Fetch local application
    const application = await getEnergJobApplicationById(id);

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }

    // Validate recruiter token
    if (application.recruiter_token !== token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized token." },
        { status: 403 }
      );
    }

    // If status is already updated or further along, skip redundant updates
    // received -> viewed -> shortlisted
    if (
      (status === "viewed" && application.application_status !== "received") ||
      (status === "shortlisted" && application.application_status === "shortlisted")
    ) {
      return NextResponse.json({
        success: true,
        message: "Status already updated.",
        status: application.application_status,
      });
    }

    // 1. Update status locally
    const updatedApplication = await updateEnergJobApplicationStatus(id, status);
    if (!updatedApplication) {
      throw new Error("Failed to update status in local database.");
    }

    // 2. Update status in CMS
    let cmsUpdated = false;
    let cmsErrorMsg: string | null = null;
    if (application.cms_document_id || application.cms_id) {
      try {
        await updateCmsApplicationStatus(
          {
            cms_id: application.cms_id,
            cms_document_id: application.cms_document_id,
          },
          status
        );
        cmsUpdated = true;
      } catch (cmsError: any) {
        cmsErrorMsg = cmsError.message || String(cmsError);
        console.error(`[PATCH /api/energjob/applications/${id}/status] CMS update failed:`, cmsError);
      }
    }

    // 3. Fetch Job and Recruiter details to construct email info
    const job = await getEnergJobById(application.job_id);
    const recruiter = job?.posted_by_recruiter_id
      ? await getEnergJobRecruiterById(job.posted_by_recruiter_id)
      : null;

    let companyName = recruiter?.company_name || recruiter?.recruiter_name || "EnergJob Employer";
    const requestUrl = new URL(req.url);
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || requestUrl.host;
    let appUrl = `${forwardedProto}://${forwardedHost}`;
    if ((forwardedHost.includes("localhost") || forwardedHost.includes("127.0.0.1")) && process.env.NEXT_PUBLIC_APP_URL) {
      appUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    const jobRouteId = job ? getJobRouteId(job) : application.job_id;
    const routeSlug = job ? buildJobRouteSlug(job.title, job.slug, jobRouteId) : `job-${application.job_id}`;
    const jobUrl = `${appUrl}/energyjobs/${routeSlug}`;

    if (companyName === "EnergJob Employer" && job) {
      try {
        const publicJob = await loadPublicEnergJobBySlug(routeSlug);
        if (publicJob?.companyName) {
          companyName = publicJob.companyName;
        }
      } catch (pubErr) {
        console.error("Failed to load public job details for company name fallback:", pubErr);
      }
    }

    // 4. Send email notification to applicant
    try {
      const emailPayload = {
        applicantEmail: application.applicant_email,
        applicantName: application.applicant_name,
        companyName,
        jobTitle: job?.title || "Applied Job Role",
        jobUrl,
        phone: application.phone,
        resumeUrl: application.resume_url,
      };

      if (status === "viewed") {
        await sendApplicationViewedEmail(emailPayload);
      } else if (status === "shortlisted") {
        await sendApplicationShortlistedEmail(emailPayload);
      }
    } catch (emailError) {
      console.error(`[PATCH /api/energjob/applications/${id}/status] Send status email failed:`, emailError);
    }

    return NextResponse.json({
      success: true,
      status,
      cmsUpdated,
      cmsError: cmsErrorMsg,
    });
  } catch (error: any) {
    console.error("[PATCH /api/energjob/applications/id/status] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status." },
      { status: 500 }
    );
  }
}
