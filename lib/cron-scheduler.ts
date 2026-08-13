import { processAbandonedCartDrip, processContentPreferenceDigests, processWeeklyReminders } from "./cron-jobs";
import { sendDailySignupReport } from "./daily-signup-report";

const globalForCron = globalThis as unknown as { isStarted?: boolean };

/**
 * Starts the internal background timer for cron jobs.
 * Uses a guard so it only runs once per Node process even in dev mode.
 */
export function startCronScheduler() {
    // Disable background cron scheduler in development mode by default to prevent DB connection timeout clutter.
    // If you need to test cron jobs locally, set ENABLE_CRON_IN_DEV=true in your environment/.env file.
    if (process.env.NODE_ENV === "development" && !process.env.ENABLE_CRON_IN_DEV) {
        console.log("[CRON-SCHEDULER] Background timers disabled in development mode.");
        return;
    }

    if (globalForCron.isStarted) {
        return;
    }
    globalForCron.isStarted = true;
    
    console.log("[CRON-SCHEDULER] Starting background timers...");

    // Run abandoned cart drip processing every 5 minutes
    const abandonedCartIntervalMs = 5 * 60 * 1000;
    const abandonedCartTimer = setInterval(async () => {
        try {
            console.log("[CRON-SCHEDULER] Firing abandoned cart drip processor...");
            await processAbandonedCartDrip();
        } catch (error) {
            console.error("[CRON-SCHEDULER] Abandoned cart processing failed:", error);
        }
    }, abandonedCartIntervalMs);
    abandonedCartTimer.unref?.();

    // Run weekly reminders every 6 hours
    const weeklyRemindersIntervalMs = 6 * 60 * 60 * 1000;
    const weeklyRemindersTimer = setInterval(async () => {
        try {
            console.log("[CRON-SCHEDULER] Firing weekly reminders processor...");
            await processWeeklyReminders();
        } catch (error) {
            console.error("[CRON-SCHEDULER] Weekly reminders processing failed:", error);
        }
    }, weeklyRemindersIntervalMs);
    weeklyRemindersTimer.unref?.();

    // Run preference digests once daily at 5 PM IST (11:30 UTC)
    // Check every 5 minutes, fire only inside the 5 PM IST window. A failed
    // attempt remains eligible for a retry during that same hour.
    let lastDigestDate = "";
    let isDigestRunning = false;
    const digestCheckIntervalMs = 5 * 60 * 1000;
    const runDailyDigestCheck = async () => {
        if (isDigestRunning) return;

        try {
            // Current time in IST
            const nowUtc = new Date();
            const istMs = nowUtc.getTime() + 5.5 * 60 * 60 * 1000;
            const istDate = new Date(istMs);
            const istHour = istDate.getUTCHours();
            const istMinute = istDate.getUTCMinutes();
            const todayKey = istDate.toISOString().slice(0, 10); // YYYY-MM-DD
            // Daily Briefing always starts at 5:00 PM IST.
            const digestStartMinute = 0;

            // Only fire between 17:00–17:59 IST, once per day
            if (istHour === 17 && istMinute >= digestStartMinute && lastDigestDate !== todayKey) {
                isDigestRunning = true;
                console.log(`[CRON-SCHEDULER] Firing daily preference digest at 5:${String(digestStartMinute).padStart(2, "0")} PM IST (${todayKey})...`);
                await processContentPreferenceDigests();
                lastDigestDate = todayKey;
            }
        } catch (error) {
            console.error("[CRON-SCHEDULER] Preference digest processing failed:", error);
        } finally {
            isDigestRunning = false;
        }
    };
    // Check immediately as well as on the five-minute interval. This prevents
    // a restart during the delivery window from missing today's send.
    void runDailyDigestCheck();
    const digestTimer = setInterval(runDailyDigestCheck, digestCheckIntervalMs);
    digestTimer.unref?.();

    // Send the team signup report once daily at 6 PM IST. Its query uses a
    // fixed 6 PM cutoff, even if this five-minute timer fires slightly later.
    let lastSignupReportDate = "";
    const signupReportTimer = setInterval(async () => {
        try {
            const nowUtc = new Date();
            const istDate = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);
            const istHour = istDate.getUTCHours();
            const todayKey = istDate.toISOString().slice(0, 10);

            if (istHour === 18 && lastSignupReportDate !== todayKey) {
                console.log(`[CRON-SCHEDULER] Sending daily signup report at 6 PM IST (${todayKey})...`);
                await sendDailySignupReport();
                lastSignupReportDate = todayKey;
            }
        } catch (error) {
            console.error("[CRON-SCHEDULER] Daily signup report failed:", error);
        }
    }, digestCheckIntervalMs);
    signupReportTimer.unref?.();
}
