import { processAbandonedCartDrip, processWeeklyReminders } from "./cron-jobs";

let isStarted = false;

/**
 * Starts the internal background timer for cron jobs.
 * Uses a guard so it only runs once per Node process even in dev mode.
 */
export function startCronScheduler() {
    if (isStarted) {
        return;
    }
    isStarted = true;
    
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
}
