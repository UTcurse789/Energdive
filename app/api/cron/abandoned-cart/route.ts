import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createMagicLink } from "@/lib/magic-link-db";
import { sendDripEmail, calculateNextDripSend } from "@/lib/abandoned-cart-emails";
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/cron/abandoned-cart
 *
 * Cron job: Process the abandoned cart drip email sequence.
 * Sends timed emails to CRM leads (pending_verifications) who haven't
 * completed portal login.
 *
 * 6-step drip schedule:
 *   Step 1: 1 hr after signup     — Friendly reminder
 *   Step 2: 4 hrs after signup    — "Just 30 sec left"
 *   Step 3: Next day 10:30 AM IST — Benefits explain
 *   Step 4: Day 3, 11:00 AM IST   — Social proof
 *   Step 5: Day 6, 11:00 AM IST   — Urgency
 *   Step 6: Day 15, 4:00 PM IST   — Final call
 *
 * Protected by CRON_SECRET header.
 * Should be called every 15-30 minutes by an external cron service.
 */
export async function POST(req: NextRequest) {
    // ── Auth ─────────────────────────────────────────────────────────────
    const secret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[ABANDONED-CART:${requestId}] ${msg}`);

    try {
        log("Starting abandoned cart drip cron...");

        // ── Query eligible leads ─────────────────────────────────────────
        // Leads who:
        //  - Are still pending verification
        //  - Haven't opted out
        //  - Have reached their next send time
        //  - Haven't completed all 6 steps
        const result = await query<{
            id: number;
            email: string;
            name: string;
            phone: string | null;
            company: string | null;
            drip_step: number;
            drip_started_at: string;
        }>(`
            SELECT id, email, name, phone, company,
                   COALESCE(drip_step, 0) as drip_step,
                   drip_started_at
            FROM pending_verifications
            WHERE verification_status = 'pending'
              AND (drip_opted_out IS NULL OR drip_opted_out = false)
              AND drip_next_send_at IS NOT NULL
              AND drip_next_send_at <= NOW()
              AND COALESCE(drip_step, 0) < 7
            ORDER BY drip_next_send_at ASC
            LIMIT 50
        `);

        log(`Found ${result.rows.length} eligible leads`);
        let sent = 0;
        let errors = 0;

        for (const lead of result.rows) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
                const nextStep = (lead.drip_step || 0) + 1;

                // Generate fresh magic link
                const { token } = await createMagicLink(
                    lead.email,
                    lead.name,
                    lead.phone || undefined,
                    lead.company || undefined,
                    "drip_reminder"
                );
                const magicLink = `${appUrl}/verify-account?token=${encodeURIComponent(token)}`;

                // Generate decline link with HMAC token
                const declineToken = crypto
                    .createHmac("sha256", CRON_SECRET)
                    .update(lead.email.toLowerCase())
                    .digest("hex")
                    .slice(0, 32);
                const declineLink = `${appUrl}/membership-decline?email=${encodeURIComponent(lead.email)}&token=${declineToken}`;

                // Send the drip email
                await sendDripEmail({
                    to: lead.email,
                    name: lead.name || "Member",
                    magicLink,
                    declineLink,
                    step: nextStep,
                });

                // Calculate next send time
                const dripStartedAt = new Date(lead.drip_started_at);
                const nextSendAt = calculateNextDripSend(dripStartedAt, nextStep);

                // Update drip tracking
                await query(`
                    UPDATE pending_verifications
                    SET drip_step = $1,
                        drip_next_send_at = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [nextStep, nextSendAt, lead.id]);

                sent++;
                log(`Sent drip step ${nextStep} to ${lead.email}`);
            } catch (err: any) {
                errors++;
                console.error(`[ABANDONED-CART:${requestId}] Failed for ${lead.email}:`, err.message);
            }
        }

        log(`Done. Sent: ${sent}, Errors: ${errors}`);

        return NextResponse.json({
            success: true,
            processed: result.rows.length,
            sent,
            errors,
        });
    } catch (error: any) {
        console.error(`[ABANDONED-CART:${requestId}] Fatal error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
