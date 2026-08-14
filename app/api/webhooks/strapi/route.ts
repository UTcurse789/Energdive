import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
    sendAbstractAcceptedEmail,
    sendAbstractRejectedEmail,
    sendPaperPublishedEmail,
    sendFinalPaperAcceptedEmail,
    sendFinalPaperRejectedEmail
} from "@/lib/email";

// ─── Content Revalidation Helper ──────────────────────────────────────────────

/**
 * Returns true if the Strapi model uid refers to the main "content" collection.
 */
function isContentModel(model: string): boolean {
    if (!model) return true;
    const lower = model.toLowerCase();
    // Exclude submission models
    if (isSubmissionModel(lower) || isFinalPaperModel(lower)) {
        return false;
    }
    return true;
}


/**
 * Revalidates all pages that depend on the Strapi content collection.
 * Called on entry.publish, entry.update, and entry.unpublish events.
 */
async function revalidateContentPages(slug?: string, contentType?: string) {
    // Bust the fetch Data Cache
    (revalidateTag as any)("strapi-contents");


    const staticPaths = [
        "/",
        "/news",
        "/articles",
        "/analysis",
        "/opinion",
        "/cover-story",
        "/featured-stories",
        "/editorial",
        "/interviews",
        "/reports",
        "/feature",
        "/case-study",
        "/sitemap.xml",
        "/rss.xml",
        "/sitemap-news.xml",
    ];

    for (const p of staticPaths) {
        revalidatePath(p, "layout");
    }

    // Bust the specific article slug if we know it
    if (slug) {
        const slugPaths = [
            `/news/${slug}`,
            `/articles/${slug}`,
            `/analysis/${slug}`,
            `/opinion/${slug}`,
            `/cover-story/${slug}`,
            `/featured-stories/${slug}`,
            `/editorial/${slug}`,
            `/interviews/${slug}`,
            `/reports/${slug}`,
            `/feature/${slug}`,
            `/case-study/${slug}`,
        ];
        for (const p of slugPaths) {
            revalidatePath(p, "page");
        }
    }

    // Also purge Cloudflare CDN cache
    const cfToken = process.env.CF_API_TOKEN;
    const cfZone = process.env.CF_ZONE_ID;
    if (cfToken && cfZone) {
        try {
            const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZone}/purge_cache`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${cfToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ purge_everything: true }),
            });
            const cfJson = await cfRes.json();
            if (!cfJson.success) {
                console.error("[STRAPI-WEBHOOK] Cloudflare purge failed:", JSON.stringify(cfJson.errors));
            }
        } catch (cfErr) {
            console.error("[STRAPI-WEBHOOK] Cloudflare purge error:", cfErr);
        }
    }
}


function getStringValue(...values: unknown[]) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function isFinalPaperModel(value: string) {
    const lower = value.toLowerCase();
    return (
        lower === "final-paper-submission" ||
        lower.endsWith("final-paper-submission") ||
        lower.includes("final-paper-submission.")
    );
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

function isRejected(status: string): boolean {
    if (!status) return false;
    const lower = status.trim().toLowerCase();
    return (
        lower === "rejected" ||
        lower === "reject" ||
        lower === "declined"
    );
}

function isPublished(status: string): boolean {
    if (!status) return false;
    const lower = status.trim().toLowerCase();
    return (
        lower === "published" ||
        lower === "publish" ||
        lower === "final accepted"
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

        // ── On-demand ISR revalidation for content articles ──────────────────
        // Fires on publish, update, or unpublish of any content entry.
        if (isContentModel(model) && (
            !event ||
            event.includes("publish") ||
            event.includes("update") ||
            event.includes("create") ||
            event.includes("delete") ||
            event.includes("unpublish") ||
            event === "trigger"
        )) {

            const slug = entry ? getStringValue(entry.slug) : undefined;
            await revalidateContentPages(slug || undefined);
            return NextResponse.json({
                success: true,
                message: `Cache revalidated for content entry (slug: ${slug || "unknown"})`,
                event,
                model,
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        if (!entry) {
            console.log("[STRAPI-WEBHOOK] No entry data found in payload. Keys:", Object.keys(body));
            return NextResponse.json({ success: true, message: "No entry data in payload" });
        }

        // Log all entry fields to help debug field name issues
        console.log("[STRAPI-WEBHOOK] Entry keys:", Object.keys(entry));
        console.log("[STRAPI-WEBHOOK] Entry id:", entry.id, "| documentId:", entry.documentId);

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

        // --- FINAL PAPER WORKFLOW ---
        if (isFinalPaperModel(model)) {
            console.log("[STRAPI-WEBHOOK] Processing Final Paper model");

            // Prevent duplicate emails by only triggering on entry.update
            if (event !== "entry.update") {
                console.log("[STRAPI-WEBHOOK] Final Paper event ignored (not update):", event);
                return NextResponse.json({ success: true, message: "Ignored Final Paper event" });
            }

            if (!authorEmail || !title) {
                console.warn("[STRAPI-WEBHOOK] Final Paper submission missing email/title");
                return NextResponse.json({ success: true, message: "Submission missing email or title" });
            }

            const finalStatus = getStringValue(entry.final_status, entry.finalStatus, entry.status).toLowerCase();

            if (isAccepted(finalStatus)) {
                console.log(`[STRAPI-WEBHOOK] ✅ Final Paper "${title}" accepted! Sending notification to ${authorEmail}`);
                await sendFinalPaperAcceptedEmail(authorEmail, authorName, title);
                console.log(`[STRAPI-WEBHOOK] ✅ Final Paper Accepted Email sent successfully to ${authorEmail}`);
                return NextResponse.json({ success: true, message: "Final Paper Accepted email sent successfully" });
            }

            if (isRejected(finalStatus)) {
                console.log(`[STRAPI-WEBHOOK] ❌ Final Paper "${title}" rejected! Sending notification to ${authorEmail}`);
                await sendFinalPaperRejectedEmail(authorEmail, authorName, title);
                console.log(`[STRAPI-WEBHOOK] ✅ Final Paper Rejected Email sent successfully to ${authorEmail}`);
                return NextResponse.json({ success: true, message: "Final Paper Rejected email sent successfully" });
            }

            console.log("[STRAPI-WEBHOOK] Final Paper not in a target state. Status found:", JSON.stringify(finalStatus));
            return NextResponse.json({ success: true, message: "Final Paper not in a target state for email" });
        }
        // --- END FINAL PAPER WORKFLOW ---

        const isAbstractModel = isSubmissionModel(model);

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

        console.log("[STRAPI-WEBHOOK] Parsed abstract entry → paperStatus:", paperStatus, "| authorEmail:", authorEmail ? "✓" : "✗", "| title:", title ? "✓" : "✗", "| model match:", isAbstractModel);

        if (!isAbstractModel) {
            console.log("[STRAPI-WEBHOOK] Ignored non-submission model:", model || "(missing)");
            return NextResponse.json({ success: true, message: "Ignored non-submission model" });
        }


        if (event && event !== "entry.update" && event !== "entry.publish" && event !== "entry.create") {
            console.log("[STRAPI-WEBHOOK] Ignored event:", event);
            return NextResponse.json({ success: true, message: "Ignored event" });
        }

        if (!authorEmail || !title) {
            console.warn("[STRAPI-WEBHOOK] Accepted submission missing email/title:", {
                model,
                event,
                authorEmail: Boolean(authorEmail),
                title: Boolean(title),
                entryKeys: Object.keys(entry),
            });
            return NextResponse.json({ success: true, message: "Submission missing email or title" });
        }

        if (isAccepted(paperStatus)) {
            console.log(`[STRAPI-WEBHOOK] ✅ Abstract "${title}" accepted! Sending notification to ${authorEmail}`);
            await sendAbstractAcceptedEmail(authorEmail, authorName, title);
            console.log(`[STRAPI-WEBHOOK] ✅ Accepted Email sent successfully to ${authorEmail}`);
            return NextResponse.json({ success: true, message: "Accepted email sent successfully" });
        } 
        
        if (isRejected(paperStatus)) {
            console.log(`[STRAPI-WEBHOOK] ❌ Abstract "${title}" rejected! Sending notification to ${authorEmail}`);
            await sendAbstractRejectedEmail(authorEmail, authorName, title);
            console.log(`[STRAPI-WEBHOOK] ✅ Rejected Email sent successfully to ${authorEmail}`);
            return NextResponse.json({ success: true, message: "Rejected email sent successfully" });
        }

        if (isPublished(paperStatus)) {
            console.log(`[STRAPI-WEBHOOK] 🎉 Final Paper "${title}" published! Sending notification to ${authorEmail}`);
            await sendPaperPublishedEmail(authorEmail, authorName, title);
            console.log(`[STRAPI-WEBHOOK] ✅ Published Email sent successfully to ${authorEmail}`);
            return NextResponse.json({ success: true, message: "Published email sent successfully" });
        }

        console.log("[STRAPI-WEBHOOK] Submission not in a target state. Status found:", JSON.stringify(paperStatus));
        console.log("[STRAPI-WEBHOOK] Status field values → paper_status:", entry.paper_status, "| paperStatus:", entry.paperStatus, "| status:", entry.status);
        return NextResponse.json({ success: true, message: "Submission not in a target state for email" });
    } catch (error) {
        console.error("[STRAPI-WEBHOOK] ❌ Error processing webhook:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
