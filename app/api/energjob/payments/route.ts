import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createCmsPayment,
  fetchCmsPayments,
  updateCmsRecruiterRelations,
} from "@/lib/energjob-cms";
import { paymentCreateSchema } from "@/lib/energjob-schemas";
import {
  createEnergJobPayment,
  getEnergJobPlanById,
  getEnergJobRecruiterById,
  logEnergJobSyncEvent,
  markEnergJobEntitySyncFailed,
  markEnergJobEntitySynced,
} from "@/lib/queries/energjob";

export async function GET() {
  try {
    const data = await fetchCmsPayments();
    return NextResponse.json({ success: true, source: "cms", ...data });
  } catch (error: any) {
    console.error("[GET /api/energjob/payments]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments" },
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
    const payload = paymentCreateSchema.parse(body);

    const localPayment = await createEnergJobPayment(payload);
    const recruiter = localPayment.recruiter_id
      ? await getEnergJobRecruiterById(localPayment.recruiter_id)
      : null;
    const plan = localPayment.plan_id
      ? await getEnergJobPlanById(localPayment.plan_id)
      : null;

    try {
      const cmsResult = await createCmsPayment(
        {
          razorpay_order_id: localPayment.razorpay_order_id,
          razorpay_payment_id: localPayment.razorpay_payment_id,
          amount: Number(localPayment.amount),
          payment_status: localPayment.payment_status,
          expires_at: localPayment.expires_at,
        },
        {
          plan: plan
            ? {
                cms_id: plan.cms_id,
                cms_document_id: plan.cms_document_id,
              }
            : null,
        }
      );

      await markEnergJobEntitySynced("payments", localPayment.id, {
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
            currentPlan: plan
              ? {
                  cms_id: plan.cms_id,
                  cms_document_id: plan.cms_document_id,
                }
              : null,
            payments: [
              {
                cms_id: cmsResult.id,
                cms_document_id: cmsResult.documentId,
              },
            ],
            jobsRemaining: recruiter.jobs_remaining,
            plansExpiresAt: recruiter.plans_expires_at,
          }
        );
      }

      await logEnergJobSyncEvent({
        entityType: "payments",
        entityId: localPayment.id,
        action: "create",
        status: "success",
        requestPayload: payload,
        responsePayload: cmsResult.raw,
      });

      return NextResponse.json({
        success: true,
        local: localPayment,
        cms: cmsResult,
      });
    } catch (syncError: any) {
      await markEnergJobEntitySyncFailed(
        "payments",
        localPayment.id,
        syncError.message
      );
      await logEnergJobSyncEvent({
        entityType: "payments",
        entityId: localPayment.id,
        action: "create",
        status: "failed",
        requestPayload: payload,
        errorMessage: syncError.message,
      });

      return NextResponse.json(
        {
          success: false,
          local: localPayment,
          syncStatus: "failed",
          error: syncError.message,
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/energjob/payments]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
