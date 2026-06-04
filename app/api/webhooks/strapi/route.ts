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
    const lower = value.toLowerCase();
    return (
        lower === "abstract-submission" ||
        lower === "paper-submission" ||
        lower.endsWith("abstract-submission") ||
        lower.endsWith("paper-submission") ||
        lower.includes("abstract-submission.") ||
        lower.includes("paper-submission.")
    );
}

/**
 * Extracts the entry object from any Strapi webhook payload shape
 * (v4 and v5 both supported).
 */
function extractEntry(body: any): Record<string, any> | null {
    // Strapi v4: body.entry
    if (body.entry && typeof body.entry === "object") return body.entry;
    // Strapi v5: body.result or body.data
    if (body.result && typeof body.result === "object") return body.result;
    if (body.data && typeof body.data === "object") {
        // Could be { data: { entry: ... } } or { data: { ... } }
        if (body.data.entry && typeof body.data.entry === "object") return body.data.entry;
        return body.data;
    }
    return null;
}

/**
 * Check if a status value means "accepted".
 */
function isAccepted(value: string): boolean {
    const lower = value.toLowerCase();
    return (
        lower === "accepted" ||
        lower === "approved" ||
        lower === "accept" ||
        lower === "approve"
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

        // Log full payload for debugging
        console.log("[STRAPI-WEBHOOK] ===== WEBHOOK RECEIVED =====");
        console.log("[STRAPI-WEBHOOK] Headers x-strapi-event:", request.headers.get("x-strapi-event"));
        console.log("[STRAPI-WEBHOOK] Full payload:", JSON.stringify(body, null, 2));

        const event = getStringValue(
            request.headers.get("x-strapi-event"),
            body.event,
            body.action
        ).toLowerCase();

        const model = getStringValue(
            body.model,
            body.uid,
            body.contentType,
            typeof body.contentType === "object" ? body.contentType?.uid : "",
            body.schema?.uid
        );

        const entry = extractEntry(body);

        console.log("[STRAPI-WEBHOOK] Parsed → event:", event, "| model:", model, "| has entry:", !!entry);

        if (!entry) {
            console.log("[STRAPI-WEBHOOK] No entry data found in payload. Keys:", Object.keys(body));
            return NextResponse.json({ success: true, message: "No entry data in payload" });
        }

        const isAbstractModel = isSubmissionModel(model);

        // Log all entry fields to help debug field name issues
        console.log("[STRAPI-WEBHOOK] Entry keys:", Object.keys(entry));
        console.log("[STRAPI-WEBHOOK] Entry id:", entry.id, "| documentId:", entry.documentId);

        // Try all possible status field names
        const paperStatus = getStringValue(
            entry.paper_status,
            entry.paperStatus,
            entry.status,
            entry.paper_Status,
            entry.Paper_status,
            entry.abstractStatus,
            entry.abstract_status,
            entry.submission_status,
            entry.submissionStatus
        ).toLowerCase();

        const authorEmail = getStringValue(
            entry.author_email,
            entry.authorEmail,
            entry.email,
            entry.author_Email,
            entry.Author_email
        );

        const authorName = getStringValue(
            entry.author_name,
            entry.authorName,
            entry.name,
            entry.author_Name,
            entry.Author_name
        ) || "Author";

        const title = getStringValue(entry.title, entry.Title);

        console.log("[STRAPI-WEBHOOK] Parsed entry → paperStatus:", paperStatus, "| authorEmail:", authorEmail ? "✓" : "✗", "| title:", title ? "✓" : "✗", "| model match:", isAbstractModel);

        if (!isAbstractModel) {
            console.log("[STRAPI-WEBHOOK] Ignored non-submission model:", model || "(missing)");
            return NextResponse.json({ success: true, message: "Ignored non-submission model" });
        }

        if (event && event !== "entry.update" && event !== "entry.publish" && event !== "entry.create") {
            console.log("[STRAPI-WEBHOOK] Ignored event:", event);
            return NextResponse.json({ success: true, message: "Ignored event" });
        }

        if (!isAccepted(paperStatus)) {
            console.log("[STRAPI-WEBHOOK] Submission not accepted yet. Status found:", JSON.stringify(paperStatus));
            // Log what the status fields actually contain for debugging
            console.log("[STRAPI-WEBHOOK] Status field values → paper_status:", entry.paper_status, "| paperStatus:", entry.paperStatus, "| status:", entry.status);
            return NextResponse.json({ success: true, message: "Submission not accepted" });
        }

        if (!authorEmail || !title) {
            console.warn("[STRAPI-WEBHOOK] Accepted submission missing email/title:", {
                model,
                event,
                authorEmail: Boolean(authorEmail),
                title: Boolean(title),
                entryKeys: Object.keys(entry),
            });
            return NextResponse.json({ success: true, message: "Accepted submission missing email or title" });
        }

        console.log(`[STRAPI-WEBHOOK] ✅ Abstract "${title}" accepted! Sending notification to ${authorEmail}`);
        await sendAbstractAcceptedEmail(authorEmail, authorName, title);
        console.log(`[STRAPI-WEBHOOK] ✅ Email sent successfully to ${authorEmail}`);
        return NextResponse.json({ success: true, message: "Accepted email sent successfully" });
    } catch (error) {
        console.error("[STRAPI-WEBHOOK] ❌ Error processing webhook:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
