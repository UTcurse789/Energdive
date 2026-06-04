import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createCmsRecruiter, fetchCmsRecruiters } from "@/lib/energjob-cms";
import { recruiterCreateSchema } from "@/lib/energjob-schemas";
import {
  createEnergJobRecruiter,
  getEnergJobPlanById,
  logEnergJobSyncEvent,
  markEnergJobEntitySyncFailed,
  markEnergJobEntitySynced,
} from "@/lib/queries/energjob";

export async function GET() {
  try {
    const data = await fetchCmsRecruiters();
    return NextResponse.json({ success: true, source: "cms", ...data });
  } catch (error: any) {
    console.error("[GET /api/energjob/recruiters]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch recruiters" },
      { status: 500 }
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
    const payload = recruiterCreateSchema.parse({
      ...body,
      clerkUserId: body.clerkUserId || userId,
    });

    const localRecruiter = await createEnergJobRecruiter(payload);
    const currentPlan = localRecruiter.current_plan_id
      ? await getEnergJobPlanById(localRecruiter.current_plan_id)
      : null;

    try {
      const cmsResult = await createCmsRecruiter(
        {
          recruiter_name: localRecruiter.recruiter_name,
          company_name: localRecruiter.company_name,
          company_description: localRecruiter.company_description,
          email: localRecruiter.email,
          clerk_user_id: localRecruiter.clerk_user_id,
          website: localRecruiter.website,
          logo: localRecruiter.logo,
          address: localRecruiter.address,
          plot_no_street: localRecruiter.plot_no_street,
          jobs_remaining: localRecruiter.jobs_remaining,
          plans_expires_at: localRecruiter.plans_expires_at,
        },
        {
          currentPlan: currentPlan
            ? {
                cms_id: currentPlan.cms_id,
                cms_document_id: currentPlan.cms_document_id,
              }
            : null,
        }
      );

      await markEnergJobEntitySynced("recruiters", localRecruiter.id, {
        id: cmsResult.id,
        documentId: cmsResult.documentId,
      });

      await logEnergJobSyncEvent({
        entityType: "recruiters",
        entityId: localRecruiter.id,
        action: "create",
        status: "success",
        requestPayload: payload,
        responsePayload: cmsResult.raw,
      });

      return NextResponse.json({
        success: true,
        local: localRecruiter,
        cms: cmsResult,
      });
    } catch (syncError: any) {
      await markEnergJobEntitySyncFailed(
        "recruiters",
        localRecruiter.id,
        syncError.message
      );
      await logEnergJobSyncEvent({
        entityType: "recruiters",
        entityId: localRecruiter.id,
        action: "create",
        status: "failed",
        requestPayload: payload,
        errorMessage: syncError.message,
      });

      return NextResponse.json(
        {
          success: false,
          local: localRecruiter,
          syncStatus: "failed",
          error: syncError.message,
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/energjob/recruiters]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create recruiter" },
      { status: 500 }
    );
  }
}
