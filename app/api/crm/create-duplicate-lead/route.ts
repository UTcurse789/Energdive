import { NextRequest, NextResponse } from "next/server";
import { createZohoDuplicateLead, DuplicateLeadPayload } from "@/lib/zoho-leads";
import { query } from "@/lib/db";
import { logEvent } from "@/lib/system-logger";

const INTERNAL_SECRET = process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/crm/create-duplicate-lead
 *
 * Creates the ITEN MEDIA duplicate lead in Zoho CRM.
 * Called ONLY after successful double opt-in verification.
 *
 * Body: {
 *   email, name?, phone?, company?, source?,
 *   originalLeadId?, membershipId?,
 *   secret: string
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.secret !== INTERNAL_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, name, phone, company, source, originalLeadId, membershipId } = body;

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const payload: DuplicateLeadPayload = {
            email,
            name,
            phone,
            company,
            source,
            originalLeadId,
            membershipId,
        };

        const duplicateLeadId = await createZohoDuplicateLead(payload);

        if (duplicateLeadId) {
            // Store duplicate lead ID and mark as created
            await query(
                `UPDATE users SET
                   crm_duplicate_lead_id = $1,
                   crm_duplicate_id      = $1,
                   duplicate_created     = true,
                   updated_at            = NOW()
                 WHERE email = $2`,
                [duplicateLeadId, email.trim().toLowerCase()]
            );

            await logEvent("CRM_SYNC_SUCCESS", email, `Duplicate lead created: ${duplicateLeadId}`);
        }

        return NextResponse.json({
            success: true,
            duplicateLeadId,
        });
    } catch (error: any) {
        await logEvent("CRM_SYNC_FAILED", "", `Duplicate lead failed: ${error.message}`);
        console.error("[CRM_DUPLICATE_LEAD] Error:", error);
        return NextResponse.json(
            { error: "Failed to create duplicate lead", details: error.message },
            { status: 500 }
        );
    }
}
