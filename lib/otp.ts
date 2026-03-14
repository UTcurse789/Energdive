/**
 * Database-backed OTP system.
 *
 * OTPs are stored in the `otp_codes` table (not in-memory) to support
 * multiple server instances. Includes rate limiting, attempt tracking,
 * and automatic expiry.
 */

import crypto from "crypto";
import { query } from "./db";
import { logEvent } from "./system-logger";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const MAX_OTP_REQUESTS_PER_HOUR = 5;

/** Generate a cryptographically random 4-digit OTP. */
export function generateOtp(): string {
    // Use crypto.randomInt for uniform distribution
    return crypto.randomInt(1000, 9999).toString();
}

/**
 * Create and store an OTP for the given email.
 * Enforces rate limiting: max 5 OTP requests per email per hour.
 */
export async function createOtp(email: string): Promise<{ otp: string; expiresAt: Date }> {
    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit check: count OTPs sent in the last hour
    const rateCheck = await query(
        `SELECT COUNT(*) AS cnt FROM otp_codes
         WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [normalizedEmail]
    );

    const recentCount = parseInt(rateCheck.rows[0]?.cnt || "0", 10);
    if (recentCount >= MAX_OTP_REQUESTS_PER_HOUR) {
        throw new Error("Too many OTP requests. Please try again later.");
    }

    // Invalidate any existing unused OTPs for this email
    await query(
        `UPDATE otp_codes SET used = true WHERE email = $1 AND used = false`,
        [normalizedEmail]
    );

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await query(
        `INSERT INTO otp_codes (email, otp, expires_at, attempts, used, created_at)
         VALUES ($1, $2, $3, 0, false, NOW())`,
        [normalizedEmail, otp, expiresAt]
    );

    await logEvent("OTP_SENT", normalizedEmail, `OTP sent (expires ${expiresAt.toISOString()})`);

    return { otp, expiresAt };
}

/**
 * Verify an OTP for the given email.
 * Returns true if valid. Enforces max 5 attempts.
 */
export async function verifyOtp(email: string, otp: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();

    // Find the latest unused OTP for this email
    const result = await query(
        `SELECT id, otp, expires_at, attempts FROM otp_codes
         WHERE email = $1 AND used = false
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
    );

    if (result.rows.length === 0) {
        return false;
    }

    const record = result.rows[0];

    // Check max attempts
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
        await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [record.id]);
        return false;
    }

    // Increment attempt counter
    await query(
        `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
        [record.id]
    );

    // Check expiry
    if (new Date() > new Date(record.expires_at)) {
        await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [record.id]);
        return false;
    }

    // Check OTP match
    if (record.otp !== otp) {
        return false;
    }

    // Success — mark as used
    await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [record.id]);

    await logEvent("OTP_VERIFIED", normalizedEmail, "OTP verified successfully");

    return true;
}
