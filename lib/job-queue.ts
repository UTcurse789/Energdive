/**
 * Lightweight in-process background job queue.
 *
 * Designed for Next.js serverless/server environments.
 * Jobs run asynchronously after the HTTP response is sent.
 *
 * Features:
 * - 3 retry attempts with exponential backoff
 * - Structured logging
 * - Non-blocking execution
 *
 * Retry schedule:
 *   Attempt 1 → immediate
 *   Attempt 2 → 2 seconds
 *   Attempt 3 → 10 seconds
 */

import { logEvent } from "./system-logger";

interface Job {
    name: string;
    fn: () => Promise<void>;
    attempt: number;
    maxRetries: number;
    email?: string;
}

const MAX_RETRIES = 3;
const BACKOFF_SCHEDULE_MS = [0, 2000, 10000]; // immediate, 2s, 10s

// Use globalThis to survive hot reloads in dev
const globalForQueue = globalThis as unknown as { _jobQueue?: Job[] };
if (!globalForQueue._jobQueue) {
    globalForQueue._jobQueue = [];
}
const queue = globalForQueue._jobQueue;

let processing = false;

/**
 * Enqueue a background job.
 * The job will execute asynchronously — the calling function returns immediately.
 *
 * @param name - Human-readable job name (e.g., "CRM_SYNC", "BREVO_SYNC")
 * @param fn - Async function to execute
 * @param email - Optional email for logging context
 */
export function enqueueJob(name: string, fn: () => Promise<void>, email?: string): void {
    queue.push({
        name,
        fn,
        attempt: 0,
        maxRetries: MAX_RETRIES,
        email,
    });

    console.log(`[JOB_QUEUE] Enqueued: ${name}${email ? ` (${email})` : ""}`);

    // Kick off processing if not already running
    if (!processing) {
        processQueue();
    }
}

async function processQueue(): Promise<void> {
    if (processing) return;
    processing = true;

    while (queue.length > 0) {
        const job = queue.shift()!;
        await executeJob(job);
    }

    processing = false;
}

async function executeJob(job: Job): Promise<void> {
    try {
        console.log(`[JOB_QUEUE] Running: ${job.name} (attempt ${job.attempt + 1}/${job.maxRetries})`);

        await job.fn();

        console.log(`[JOB_QUEUE] ✅ Completed: ${job.name}`);

        // Log success based on job name
        const successEvent = job.name.includes("CRM") ? "CRM_SYNC_SUCCESS"
            : job.name.includes("BREVO") ? "BREVO_SYNC_SUCCESS"
            : `${job.name}_SUCCESS`;
        await logEvent(successEvent, job.email || "", `Job ${job.name} completed successfully`);

    } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.error(`[JOB_QUEUE] ❌ Failed: ${job.name} (attempt ${job.attempt + 1}): ${errorMsg}`);

        job.attempt += 1;

        if (job.attempt < job.maxRetries) {
            // Schedule retry with backoff
            const delay = BACKOFF_SCHEDULE_MS[job.attempt] || 10000;
            console.log(`[JOB_QUEUE] Retrying ${job.name} in ${delay}ms...`);

            setTimeout(() => {
                queue.push(job);
                if (!processing) {
                    processQueue();
                }
            }, delay);
        } else {
            // Final failure — log it
            const failEvent = job.name.includes("CRM") ? "CRM_SYNC_FAILED"
                : job.name.includes("BREVO") ? "BREVO_SYNC_FAILED"
                : `${job.name}_FAILED`;
            await logEvent(failEvent, job.email || "", `Job ${job.name} failed after ${job.maxRetries} attempts: ${errorMsg}`);

            console.error(`[JOB_QUEUE] 🔴 Permanently failed: ${job.name} after ${job.maxRetries} attempts`);
        }
    }
}
