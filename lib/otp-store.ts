/**
 * In-memory OTP store with automatic expiry.
 * For production, swap this out for Redis or similar.
 */

interface OtpEntry {
    otp: string;
    expiresAt: number;
}

const store = new Map<string, OtpEntry>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/** Generate a random 4-digit OTP */
export function generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Store OTP for a given mobile number */
export function setOtp(mobile: string, otp: string): void {
    store.set(mobile, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
    });
}

/** Verify OTP for a given mobile number. Returns true if valid. */
export function verifyOtp(mobile: string, otp: string): boolean {
    const entry = store.get(mobile);
    if (!entry) return false;

    // Expired
    if (Date.now() > entry.expiresAt) {
        store.delete(mobile);
        return false;
    }

    // Match
    if (entry.otp === otp) {
        store.delete(mobile); // One-time use
        return true;
    }

    return false;
}
