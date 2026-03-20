import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/membership/decline
 *
 * Opt-out endpoint for users who don't want to proceed with
 * free EnergClub membership.
 *
 * Sets drip_opted_out on pending_verifications and
 * reminder_opted_out on users table.
 *
 * Body: { email: string, token: string }
 * Token is an HMAC of the email to prevent abuse.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = (body.email || "").trim().toLowerCase();
        const token = (body.token || "").trim();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Validate HMAC token
        if (!CRON_SECRET) {
            return NextResponse.json({ error: "Service not configured" }, { status: 500 });
        }

        const expectedToken = crypto
            .createHmac("sha256", CRON_SECRET)
            .update(email)
            .digest("hex")
            .slice(0, 32);

        if (token !== expectedToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 403 });
        }

        // ── Opt out from drip emails (pending_verifications) ─────────────
        const pvResult = await query(
            `UPDATE pending_verifications
             SET drip_opted_out = true, updated_at = NOW()
             WHERE email = $1 AND (drip_opted_out IS NULL OR drip_opted_out = false)`,
            [email]
        );

        // ── Opt out from weekly reminders (users) ────────────────────────
        const userResult = await query(
            `UPDATE users
             SET reminder_opted_out = true, updated_at = NOW()
             WHERE email = $1 AND (reminder_opted_out IS NULL OR reminder_opted_out = false)`,
            [email]
        );

        console.log(`[DECLINE] User opted out: ${email} (pv: ${pvResult.rowCount}, users: ${userResult.rowCount})`);

        return NextResponse.json({
            success: true,
            message: "You have been opted out of EnergClub membership emails.",
        });
    } catch (error: any) {
        console.error("[DECLINE] Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
