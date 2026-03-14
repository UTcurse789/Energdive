/**
 * System Logger — stores structured event logs in the database.
 *
 * Event types:
 *   OTP_SENT, OTP_VERIFIED
 *   MAGIC_LINK_CREATED, MAGIC_LINK_CLICKED
 *   CRM_SYNC_SUCCESS, CRM_SYNC_FAILED
 *   BREVO_SYNC_SUCCESS, BREVO_SYNC_FAILED
 */

import { query } from "./db";

export type EventType =
    | "OTP_SENT"
    | "OTP_VERIFIED"
    | "MAGIC_LINK_CREATED"
    | "MAGIC_LINK_CLICKED"
    | "CRM_SYNC_SUCCESS"
    | "CRM_SYNC_FAILED"
    | "BREVO_SYNC_SUCCESS"
    | "BREVO_SYNC_FAILED"
    | "MEMBERSHIP_GENERATED"
    | "USER_VERIFIED"
    | "WEBHOOK_RECEIVED"
    | string;

/**
 * Log a system event to the `system_logs` table.
 *
 * @param eventType - Event type identifier
 * @param email - Associated email (optional)
 * @param detail - Human-readable detail string
 * @param metadata - Optional JSON metadata
 */
export async function logEvent(
    eventType: EventType,
    email?: string,
    detail?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        await query(
            `INSERT INTO system_logs (event_type, email, detail, metadata, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [eventType, email || null, detail || null, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (err: any) {
        // Never let logging failures crash the main flow
        console.error(`[SYSTEM_LOG] Failed to write log (${eventType}):`, err.message);
    }
}
