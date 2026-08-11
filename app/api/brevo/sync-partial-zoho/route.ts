import { NextRequest, NextResponse } from "next/server";
import { syncPartialZohoLeadToBrevo } from "@/lib/brevoSync";

const WEBHOOK_SECRET = process.env.ZOHO_FORM_WEBHOOK_SECRET || process.env.ZOHO_WEBHOOK_SECRET || "";
const PARTIAL_ZOHO_VIEW_ID = "651593000023479260";

function toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
}

/**
 * Accepts leads only from Zoho CRM custom view 651593000023479260 and adds
 * them to Brevo list #21 (Partial Zoho). Other Zoho leads are rejected.
 */
export async function POST(req: NextRequest) {
    try {
        if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (String(body.zoho_custom_view_id || "") !== PARTIAL_ZOHO_VIEW_ID) {
            return NextResponse.json(
                { error: "Lead is not from the Partial Zoho custom view" },
                { status: 403 }
            );
        }

        const email = String(body.email || "").trim().toLowerCase();
        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        await syncPartialZohoLeadToBrevo({
            email,
            name: String(body.name || "").trim() || undefined,
            phone: String(body.phone || body.Mobile || body.Phone || "").trim() || undefined,
            company: String(body.company || body.Company || "").trim() || undefined,
            jobTitle: String(body.job_title || body.Designation || "").trim() || undefined,
            communities: toStringArray(body.Community || body.community),
            subCommunities: toStringArray(body.Sub_Community || body.sub_community),
            industry: String(body.industry || body.Industry || "").trim() || undefined,
        });

        return NextResponse.json({
            success: true,
            email,
            brevoListId: 21,
            zohoCustomViewId: PARTIAL_ZOHO_VIEW_ID,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[PARTIAL-ZOHO-BREVO] Sync failed:", error);
        return NextResponse.json({ error: "Partial Zoho sync failed", details: message }, { status: 500 });
    }
}
