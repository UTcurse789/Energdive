import { NextRequest, NextResponse } from "next/server";
import { syncVerifiedUserToBrevo, VerifiedUserBrevoPayload } from "@/lib/brevoSync";
import { query } from "@/lib/db";
import { logEvent } from "@/lib/system-logger";

const INTERNAL_SECRET = process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/brevo/sync-contact
 *
 * Syncs a verified user to Brevo contacts list.
 * Includes membership_id as a Brevo contact attribute.
 *
 * Body: {
 *   email, name?, phone?, company?, membershipId?, source?,
 *   secret: string
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.secret !== INTERNAL_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, name, phone, company, membershipId, source } = body;

        if (!email) {
            return NextResponse.json({ error: "email is required" }, { status: 400 });
        }

        const payload: VerifiedUserBrevoPayload = {
            email,
            name,
            phone,
            company,
            membershipId,
            source,
        };

        await syncVerifiedUserToBrevo(payload);

        // Store Brevo sync status on user record
        await query(
            `UPDATE users SET brevo_contact_id = 'synced', updated_at = NOW() WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        await logEvent("BREVO_SYNC_SUCCESS", email, `Contact synced to Brevo. Membership: ${membershipId || "N/A"}`);

        return NextResponse.json({
            success: true,
            message: "Contact synced to Brevo",
        });
    } catch (error: any) {
        await logEvent("BREVO_SYNC_FAILED", "", `Brevo sync failed: ${error.message}`);
        console.error("[BREVO_SYNC] Error:", error);
        return NextResponse.json(
            { error: "Failed to sync contact to Brevo", details: error.message },
            { status: 500 }
        );
    }
}
