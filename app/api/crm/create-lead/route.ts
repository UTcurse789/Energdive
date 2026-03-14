import { NextRequest, NextResponse } from "next/server";
import { createZohoLead, upsertZohoLead, ZohoLeadData } from "@/lib/zoho-leads";
import { query } from "@/lib/db";
import { logEvent } from "@/lib/system-logger";

const INTERNAL_SECRET = process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/crm/create-lead
 *
 * Internal utility endpoint to create a Zoho CRM lead.
 * Can be called directly or by the webhook flow.
 *
 * Body: {
 *   email, firstName, lastName, phone?, company?,
 *   leadSource?, mode?: "create" | "upsert",
 *   secret: string   (must match ZOHO_WEBHOOK_SECRET)
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate internal secret
        if (body.secret !== INTERNAL_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, firstName, lastName, phone, company, leadSource, mode } = body;

        if (!email || !lastName) {
            return NextResponse.json(
                { error: "email and lastName are required" },
                { status: 400 }
            );
        }

        const leadData: ZohoLeadData = {
            First_Name: firstName || "",
            Last_Name: lastName,
            Email: email,
            Phone: phone || undefined,
            Company: company || undefined,
            Lead_Source: leadSource || "Website",
        };

        let result;
        if (mode === "upsert") {
            result = await upsertZohoLead(leadData);
        } else {
            result = await createZohoLead(leadData);
        }

        // Update user record with CRM lead ID
        await query(
            `UPDATE users SET crm_lead_id = $1, updated_at = NOW() WHERE email = $2`,
            [result.id, email.trim().toLowerCase()]
        );

        await logEvent("CRM_SYNC_SUCCESS", email, `CRM lead ${result.action}: ${result.id}`);

        return NextResponse.json({
            success: true,
            leadId: result.id,
            action: result.action,
        });
    } catch (error: any) {
        await logEvent("CRM_SYNC_FAILED", "", `Create lead failed: ${error.message}`);
        console.error("[CRM_CREATE_LEAD] Error:", error);
        return NextResponse.json(
            { error: "Failed to create CRM lead", details: error.message },
            { status: 500 }
        );
    }
}
