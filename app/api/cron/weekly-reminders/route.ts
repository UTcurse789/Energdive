import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createMagicLink } from "@/lib/magic-link-db";
import { sendReminderEmail } from "@/lib/reminder-emails";
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/cron/weekly-reminders
 *
 * Cron job: Send reminder emails to users with verification_status = 'pending_verification'.
 * Maximum 4 emails per week per user, cycling through 4 template strategies.
 * Resets the weekly count every 7 days.
 *
 * Protected by CRON_SECRET header.
 * Should be called every ~6 hours by an external cron service.
 */
export async function POST(req: NextRequest) {
    // ── Auth ─────────────────────────────────────────────────────────────
    const secret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[WEEKLY-REMINDER:${requestId}] ${msg}`);

    try {
        log("Starting weekly reminder cron...");

        // ── 1. Reset weekly counts for users whose week has elapsed ───────
        await query(`
            UPDATE users
            SET reminder_email_count = 0,
                reminder_week_start = NOW()
            WHERE verification_status = 'pending_verification'
              AND reminder_opted_out = false
              AND reminder_week_start IS NOT NULL
              AND reminder_week_start < NOW() - INTERVAL '7 days'
        `);

        // ── 2. Query eligible users ──────────────────────────────────────
        // Users who:
        //  - Have pending_verification status
        //  - Haven't opted out
        //  - Haven't reached 4 emails this week
        //  - Last email was sent > 24 hours ago (or never sent)
        const result = await query<{
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            reminder_email_count: number;
        }>(`
            SELECT id, email, first_name, last_name, COALESCE(reminder_email_count, 0) as reminder_email_count
            FROM users
            WHERE verification_status = 'pending_verification'
              AND (reminder_opted_out IS NULL OR reminder_opted_out = false)
              AND COALESCE(reminder_email_count, 0) < 4
              AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at < NOW() - INTERVAL '24 hours')
            ORDER BY last_reminder_sent_at ASC NULLS FIRST
            LIMIT 50
        `);

        log(`Found ${result.rows.length} eligible users`);
        let sent = 0;
        let errors = 0;

        for (const user of result.rows) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
                const firstName = user.first_name || "Member";

                // Generate fresh magic link
                const { token } = await createMagicLink(
                    user.email,
                    `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                    undefined, undefined,
                    "reminder",
                    undefined
                );
                const magicLink = `${appUrl}/verify-account?token=${encodeURIComponent(token)}`;

                // Generate decline link with HMAC token
                const declineToken = crypto
                    .createHmac("sha256", CRON_SECRET)
                    .update(user.email.toLowerCase())
                    .digest("hex")
                    .slice(0, 32);
                const declineLink = `${appUrl}/membership-decline?email=${encodeURIComponent(user.email)}&token=${declineToken}`;

                const reminderNumber = (user.reminder_email_count || 0) + 1;

                await sendReminderEmail({
                    to: user.email,
                    firstName,
                    magicLink,
                    declineLink,
                    reminderNumber,
                });

                // Update tracking
                await query(`
                    UPDATE users
                    SET reminder_email_count = COALESCE(reminder_email_count, 0) + 1,
                        last_reminder_sent_at = NOW(),
                        reminder_week_start = COALESCE(reminder_week_start, NOW()),
                        updated_at = NOW()
                    WHERE id = $1
                `, [user.id]);

                sent++;
                log(`Sent reminder #${reminderNumber} to ${user.email}`);
            } catch (err: any) {
                errors++;
                console.error(`[WEEKLY-REMINDER:${requestId}] Failed for ${user.email}:`, err.message);
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
        console.error(`[WEEKLY-REMINDER:${requestId}] Fatal error:`, error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
