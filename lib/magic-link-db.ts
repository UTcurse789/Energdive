/**
 * Magic Link system.
 *
 * Tokens are stored as SHA256 hashes in the database.
 * Tokens are single-use and expire after 24 hours.
 */

import crypto from "crypto";
import { query } from "./db";
import { logEvent } from "./system-logger";

const TOKEN_EXPIRY_HOURS = 168; // 1 week

/** Generate a SHA256 hash of a token string. */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

/** Optional enrichment fields from Zoho Form submissions. */
export interface EnrichmentData {
    communities?: string[];
    subCommunities?: string[];
}

/**
 * Generate a magic link token and store its hash in pending_verifications.
 *
 * @param email - The user's email address
 * @param name - The user's name
 * @param phone - Phone number (optional)
 * @param company - Company name (optional)
 * @param source - Lead source ('zoho_form' | 'website')
 * @param crmLeadId - Original CRM lead ID (for Zoho Form leads)
 * @param enrichment - Optional enrichment fields from Zoho Form
 * @returns The raw token (to be included in the magic link URL)
 */
export async function createMagicLink(
    email: string,
    name: string,
    phone?: string,
    company?: string,
    source: string = "zoho_form",
    crmLeadId?: string,
    enrichment?: EnrichmentData
): Promise<{ token: string; expiresAt: Date; pendingId: number }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Generate cryptographically secure random token
    const rawToken = crypto.randomBytes(48).toString("base64url");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Upsert pending_verification row
    // ON CONFLICT: refresh token (invalidates old one)
    const result = await query(
        `INSERT INTO pending_verifications
           (email, name, phone, company, source, verification_status,
            crm_lead_id, magic_token_hash, magic_token_expires_at,
            token_used, otp_verified, otp_attempts,
            communities, sub_communities,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,false,false,0,$9,$10,NOW(),NOW())
         ON CONFLICT (email) DO UPDATE SET
           name                    = EXCLUDED.name,
           phone                   = EXCLUDED.phone,
           company                 = EXCLUDED.company,
           crm_lead_id             = COALESCE(EXCLUDED.crm_lead_id, pending_verifications.crm_lead_id),
           magic_token_hash        = EXCLUDED.magic_token_hash,
           magic_token_expires_at  = EXCLUDED.magic_token_expires_at,
           token_used              = false,
           verification_status     = 'pending',
           otp_verified            = false,
           otp_attempts            = 0,
           communities             = COALESCE(EXCLUDED.communities, pending_verifications.communities),
           sub_communities         = COALESCE(EXCLUDED.sub_communities, pending_verifications.sub_communities),
           updated_at              = NOW()
         RETURNING id`,
        [
            normalizedEmail, name, phone || null, company || null, source, crmLeadId || null, tokenHash, expiresAt,
            enrichment?.communities?.length ? JSON.stringify(enrichment.communities) : null,
            enrichment?.subCommunities?.length ? JSON.stringify(enrichment.subCommunities) : null,
        ]
    );

    const pendingId = result.rows[0].id;

    await logEvent("MAGIC_LINK_CREATED", normalizedEmail, `Token created, expires ${expiresAt.toISOString()}`);

    return { token: rawToken, expiresAt, pendingId };
}

/**
 * Validate a magic link token.
 *
 * Checks:
 * 1. Token hash exists in DB
 * 2. Token hasn't been used (single-use)
 * 3. Token hasn't expired (24hr)
 *
 * Does NOT mark as used — that happens after successful OTP verification.
 *
 * @returns The pending verification record, or null if invalid
 */
export interface PendingVerificationRow {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    company: string | null;
    source: string;
    crm_lead_id: string | null;
    verification_status: string;
    magic_token_expires_at: string;
    token_used: boolean;
    otp_verified: boolean;
    job_title: string | null;
    industry: string | null;
    community_portal: string | null;
    city: string | null;
    country: string | null;
}

export async function validateMagicToken(rawToken: string): Promise<Omit<PendingVerificationRow, 'magic_token_expires_at' | 'token_used' | 'otp_verified'> | null> {
    const tokenHash = hashToken(rawToken);

    const result = await query<PendingVerificationRow>(
        `SELECT id, email, name, phone, company, source, crm_lead_id,
                verification_status, magic_token_expires_at, token_used, otp_verified
         FROM pending_verifications
         WHERE magic_token_hash = $1
         LIMIT 1`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    // Single-use check
    if (row.token_used) {
        return null;
    }

    // Expiry check
    if (new Date() > new Date(row.magic_token_expires_at)) {
        return null;
    }

    // Already verified — return info but no need for OTP
    if (row.verification_status === "verified") {
        return row;
    }

    await logEvent("MAGIC_LINK_CLICKED", row.email, "Token validated, OTP step pending");

    return row;
}

/**
 * Mark a magic link token as used (after successful OTP verification).
 */
export async function markTokenUsed(pendingId: number): Promise<void> {
    await query(
        `UPDATE pending_verifications SET token_used = true, updated_at = NOW() WHERE id = $1`,
        [pendingId]
    );
}
