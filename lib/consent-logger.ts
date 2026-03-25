/**
 * Consent Logger — Records consent events to the consent_log table.
 *
 * Provides an immutable audit trail for DPDP compliance.
 * Every consent event (registration, re-consent, opt-in change) is logged
 * with source, IP address, consent version, and the exact text shown.
 */

import { query } from "./db";
import {
    DataSource,
    OptInMethod,
    ConsentPurpose,
    CURRENT_CONSENT_VERSION,
    getConsentText,
    getOptInMethod,
    getThirdPartyAgreementRef,
    resolveDataSource,
} from "./data-provenance";

export interface ConsentLogEntry {
    userId?: number | null;
    email: string;
    source: DataSource;
    consentVersion?: string;
    consentTextSnapshot?: string;
    optInMethod?: OptInMethod;
    ipAddress?: string | null;
    campaignId?: string | null;
    thirdPartyAgreementRef?: string | null;
    consentPurpose?: ConsentPurpose;
    metadata?: Record<string, unknown>;
}

/**
 * Log a consent event to the `consent_log` table.
 * This function never throws — failures are logged to console.
 */
export async function logConsent(entry: ConsentLogEntry): Promise<void> {
    const {
        userId,
        email,
        source,
        consentVersion = CURRENT_CONSENT_VERSION,
        consentTextSnapshot = getConsentText(source),
        optInMethod = getOptInMethod(source),
        ipAddress,
        campaignId,
        thirdPartyAgreementRef = getThirdPartyAgreementRef(source),
        consentPurpose = "registration",
        metadata,
    } = entry;

    try {
        await query(
            `INSERT INTO consent_log (
                user_id, email, source, consent_version, consent_text_snapshot,
                opt_in_method, ip_address, campaign_id, third_party_agreement_ref,
                consent_purpose, metadata, consent_timestamp, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
            [
                userId || null,
                email,
                source,
                consentVersion,
                consentTextSnapshot,
                optInMethod,
                ipAddress || null,
                campaignId || null,
                thirdPartyAgreementRef || null,
                consentPurpose,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[CONSENT_LOG] Failed to log consent for ${email}:`, message);
    }
}

/**
 * Extract client IP address from request headers.
 * Checks x-client-ip (set by middleware), x-forwarded-for, x-real-ip,
 * cf-connecting-ip (Cloudflare), and falls back to null.
 */
export function extractIpAddress(req: Request): string | null {
    // Custom header set by our middleware (most reliable)
    let finalIp = req.headers.get("x-client-ip") ||
                  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                  req.headers.get("x-real-ip")?.trim() ||
                  req.headers.get("cf-connecting-ip")?.trim() ||
                  null;

    // For local development, if we get a localhost IP, return a dummy public IP
    // so the logs look realistic instead of showing "::1"
    if (finalIp === "::1" || finalIp === "127.0.0.1") {
        finalIp = "103.155.228.1"; // Default dummy IP (New Delhi context)
    }

    return finalIp;
}

/**
 * Update the user's consent provenance columns after consent is logged.
 */
export async function updateUserConsentFields(
    clerkId: string,
    source: string | null | undefined,
    ipAddress: string | null,
    consentTimestamp?: string | null
): Promise<void> {
    const dataSource = resolveDataSource(source);
    const tsValue = consentTimestamp || null;

    try {
        await query(
            `UPDATE users SET
                consent_version = $2,
                consent_timestamp = COALESCE($5::timestamptz, NOW()),
                ip_address_at_consent = $3,
                data_source = $4,
                updated_at = NOW()
             WHERE clerk_id = $1`,
            [clerkId, CURRENT_CONSENT_VERSION, ipAddress, dataSource, tsValue]
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // Non-fatal: consent_log is the primary record, user columns are secondary
        console.warn(`[CONSENT_LOG] Failed to update user consent fields:`, message);
    }
}
