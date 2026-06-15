import { processAbandonedCartDrip, processContentPreferenceDigests, processWeeklyReminders } from "./cron-jobs";

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

    // Run preference digests once daily at 4 PM IST (10:30 UTC)
    // Check every 5 minutes, fire only inside the 4 PM IST window
    let lastDigestDate = "";
    const digestCheckIntervalMs = 5 * 60 * 1000;
    const digestTimer = setInterval(async () => {
        try {
            // Current time in IST
            const nowUtc = new Date();
            const istMs = nowUtc.getTime() + 5.5 * 60 * 60 * 1000;
            const istDate = new Date(istMs);
            const istHour = istDate.getUTCHours();
            const todayKey = istDate.toISOString().slice(0, 10); // YYYY-MM-DD

            // Only fire between 16:00–16:59 IST, once per day
            if (istHour === 16 && lastDigestDate !== todayKey) {
                lastDigestDate = todayKey;
                console.log(`[CRON-SCHEDULER] Firing daily preference digest at 4 PM IST (${todayKey})...`);
                await processContentPreferenceDigests();
            }
        } catch (error) {
            console.error("[CRON-SCHEDULER] Preference digest processing failed:", error);
        }
    }, digestCheckIntervalMs);
    digestTimer.unref?.();
}
