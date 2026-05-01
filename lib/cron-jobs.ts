import { query } from "@/lib/db";
import { createMagicLink } from "@/lib/magic-link-db";
import { sendDripEmail, calculateNextDripSend } from "@/lib/abandoned-cart-emails";
import { sendReminderEmail } from "@/lib/reminder-emails";
import { processPreferenceDigests } from "@/lib/preference-digests";
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * Process the abandoned cart drip email sequence.
 * 5-step drip schedule.
 */
export async function processAbandonedCartDrip() {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[ABANDONED-CART:${requestId}] ${msg}`);
    let sent = 0;
    let errors = 0;
    let processed = 0;

    try {
        log("Starting abandoned cart drip cron...");

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
              AND COALESCE(drip_step, 0) < 5
            ORDER BY drip_next_send_at ASC
            LIMIT 50
        `);

        processed = result.rows.length;
        log(`Found ${processed} eligible leads`);

        for (const lead of result.rows) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
                const nextStep = (lead.drip_step || 0) + 1;

                const { token } = await createMagicLink(
                    lead.email,
                    lead.name,
                    lead.phone || undefined,
                    lead.company || undefined,
                    "drip_reminder"
                );
                const magicLink = `${appUrl}/verify-account?token=${encodeURIComponent(token)}`;

                const declineToken = crypto
                    .createHmac("sha256", CRON_SECRET)
                    .update(lead.email.toLowerCase())
                    .digest("hex")
                    .slice(0, 32);
                const declineLink = `${appUrl}/membership-decline?email=${encodeURIComponent(lead.email)}&token=${declineToken}`;

                await sendDripEmail({
                    to: lead.email,
                    name: lead.name || "Member",
                    magicLink,
                    declineLink,
                    step: nextStep,
                });

                const dripStartedAt = new Date(lead.drip_started_at);
                const nextSendAt = calculateNextDripSend(dripStartedAt, nextStep);

                await query(`
                    UPDATE pending_verifications
                    SET drip_step = $1,
                        drip_next_send_at = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [nextStep, nextSendAt, lead.id]);

                sent++;
                log(`Sent drip step ${nextStep} to ${lead.email}`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                errors++;
                console.error(`[ABANDONED-CART:${requestId}] Failed for ${lead.email}:`, message);
            }
        }

        log(`Done. Sent: ${sent}, Errors: ${errors}`);
        return { success: true, processed, sent, errors };
    } catch (error: unknown) {
        console.error(`[ABANDONED-CART:${requestId}] Fatal error:`, error);
        throw error;
    }
}

/**
 * Send reminder emails to users with verification_status = 'pending_verification'.
 * Maximum 4 emails per week per user. Resets weekly count every 7 days.
 */
export async function processWeeklyReminders() {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[WEEKLY-REMINDER:${requestId}] ${msg}`);
    let sent = 0;
    let errors = 0;
    let processed = 0;

    try {
        log("Starting weekly reminder cron...");

        await query(`
            UPDATE users
            SET reminder_email_count = 0,
                reminder_week_start = NOW()
            WHERE verification_status = 'pending_verification'
              AND reminder_opted_out = false
              AND reminder_week_start IS NOT NULL
              AND reminder_week_start < NOW() - INTERVAL '7 days'
        `);

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

        processed = result.rows.length;
        log(`Found ${processed} eligible users`);

        for (const user of result.rows) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
                const firstName = user.first_name || "Member";

                const { token } = await createMagicLink(
                    user.email,
                    `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                    undefined, undefined,
                    "reminder",
                    undefined
                );
                const magicLink = `${appUrl}/verify-account?token=${encodeURIComponent(token)}`;

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
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                errors++;
                console.error(`[WEEKLY-REMINDER:${requestId}] Failed for ${user.email}:`, message);
            }
        }

        log(`Done. Sent: ${sent}, Errors: ${errors}`);
        return { success: true, processed, sent, errors };
    } catch (error: unknown) {
        console.error(`[WEEKLY-REMINDER:${requestId}] Fatal error:`, error);
        throw error;
    }
}

/**
 * Send personalized content digests based on onboarding subscription preferences.
 * Users receive at most one digest per daily/weekly/monthly period, and only
 * when new matching content exists since their previous digest.
 */
export async function processContentPreferenceDigests(limit = 100) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[CONTENT-DIGEST:${requestId}] ${msg}`);

    try {
        log(`Starting content digest cron with limit ${limit}...`);
        const result = await processPreferenceDigests({ limit });
        log(`Done. Due: ${result.due}, Sent: ${result.sent}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
        return result;
    } catch (error: unknown) {
        console.error(`[CONTENT-DIGEST:${requestId}] Fatal error:`, error);
        throw error;
    }
}
