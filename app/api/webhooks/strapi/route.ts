import { NextRequest, NextResponse } from "next/server";
import { sendAbstractAcceptedEmail } from "@/lib/email";

function getStringValue(...values: unknown[]) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function isSubmissionModel(value: string) {
    return (
        value === "abstract-submission" ||
        value === "paper-submission" ||
        value.endsWith("abstract-submission") ||
        value.endsWith("paper-submission") ||
        value.includes("abstract-submission.") ||
        value.includes("paper-submission.")
    );
}

/**
 * POST /api/webhooks/strapi
 * Receives update events from Strapi CMS.
 * Triggers an email notification if an abstract is approved/accepted.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("[STRAPI-WEBHOOK] Received payload:", JSON.stringify(body, null, 2));

        const event = getStringValue(
            request.headers.get("x-strapi-event"),
            body.event,
            body.action
        ).toLowerCase();
        const model = getStringValue(
            body.model,
            body.uid,
            body.contentType,
            body.contentType?.uid,
            body.schema?.uid
        );
        const entry = body.entry ?? body.result ?? body.data ?? body;
        const isAbstractModel = isSubmissionModel(model);
        const paperStatus = getStringValue(entry?.paper_status, entry?.paperStatus, entry?.status).toLowerCase();
        const authorEmail = getStringValue(entry?.author_email, entry?.authorEmail, entry?.email);
        const authorName = getStringValue(entry?.author_name, entry?.authorName, entry?.name) || "Author";
        const title = getStringValue(entry?.title);

        if (!isAbstractModel) {
            console.log("[STRAPI-WEBHOOK] Ignored non-submission model:", model || "(missing)");
            return NextResponse.json({ success: true, message: "Ignored non-submission model" });
        }

        if (event && event !== "entry.update" && event !== "entry.publish") {
            console.log("[STRAPI-WEBHOOK] Ignored event:", event);
            return NextResponse.json({ success: true, message: "Ignored event" });
        }

        if (paperStatus !== "accepted") {
            console.log("[STRAPI-WEBHOOK] Submission not accepted yet:", { model, event, paperStatus });
            return NextResponse.json({ success: true, message: "Submission not accepted" });
        }

        if (!authorEmail || !title) {
            console.warn("[STRAPI-WEBHOOK] Accepted submission missing email/title:", {
                model,
                event,
                authorEmail: Boolean(authorEmail),
                title: Boolean(title),
            });
            return NextResponse.json({ success: true, message: "Accepted submission missing email or title" });
        }

        console.log(`[STRAPI-WEBHOOK] Abstract "${title}" accepted. Sending notification to ${authorEmail}`);
        await sendAbstractAcceptedEmail(authorEmail, authorName, title);
        return NextResponse.json({ success: true, message: "Accepted email sent successfully" });
    } catch (error) {
        console.error("[STRAPI-WEBHOOK] Error processing webhook:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
