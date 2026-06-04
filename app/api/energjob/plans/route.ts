import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchCmsPlans, createCmsPlan } from "@/lib/energjob-cms";
import { planCreateSchema } from "@/lib/energjob-schemas";
import {
  createEnergJobPlan,
  listEnergJobPlans,
  logEnergJobSyncEvent,
  markEnergJobEntitySyncFailed,
  markEnergJobEntitySynced,
} from "@/lib/queries/energjob";

export async function GET() {
  try {
    const data = await fetchCmsPlans();
    return NextResponse.json({ success: true, source: "cms", ...data });
  } catch (error: any) {
    console.error("[GET /api/energjob/plans]", error);

    try {
      const localPlans = await listEnergJobPlans();
      return NextResponse.json({
        success: true,
        source: "local",
        warning: error.message || "CMS fetch failed; returning local DB data",
        data: localPlans,
        meta: {
          fallback: true,
          total: localPlans.length,
        },
      });
    } catch (fallbackError: any) {
      console.error("[GET /api/energjob/plans] Local fallback failed", fallbackError);
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch plans" },
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
    const payload = planCreateSchema.parse(body);

    const localPlan = await createEnergJobPlan(payload);

    try {
      const cmsResult = await createCmsPlan({
        name: localPlan.name,
        price: Number(localPlan.price),
        job_limit: localPlan.job_limit,
        duration: localPlan.duration,
        is_featured: localPlan.is_featured,
        is_active: localPlan.is_active,
      });

      await markEnergJobEntitySynced("plans", localPlan.id, {
        id: cmsResult.id,
        documentId: cmsResult.documentId,
      });

      await logEnergJobSyncEvent({
        entityType: "plans",
        entityId: localPlan.id,
        action: "create",
        status: "success",
        requestPayload: payload,
        responsePayload: cmsResult.raw,
      });

      return NextResponse.json({
        success: true,
        local: localPlan,
        cms: cmsResult,
      });
    } catch (syncError: any) {
      await markEnergJobEntitySyncFailed("plans", localPlan.id, syncError.message);
      await logEnergJobSyncEvent({
        entityType: "plans",
        entityId: localPlan.id,
        action: "create",
        status: "failed",
        requestPayload: payload,
        errorMessage: syncError.message,
      });

      return NextResponse.json(
        {
          success: false,
          local: localPlan,
          syncStatus: "failed",
          error: syncError.message,
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/energjob/plans]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create plan" },
      { status: 500 }
    );
  }
}
