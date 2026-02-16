import crypto from "crypto";

const SECRET = process.env.MAGIC_LINK_SECRET || process.env.CLERK_SECRET_KEY || "dev-fallback-secret";
const TOKEN_EXPIRY_MINUTES = 10;

interface TokenPayload {
    email: string;
    exp: number; // Unix timestamp (ms)
}

/**
 * Generate a self-verifying magic token.
 * Format: base64url(payload).signature
 * No external storage needed — the token is verified via HMAC.
 */
export function generateMagicToken(email: string): { token: string; expiresAt: string } {
    const exp = Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000;
    const payload: TokenPayload = { email: email.toLowerCase(), exp };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(payloadB64)
        .digest("base64url");

    return {
        token: `${payloadB64}.${signature}`,
        expiresAt: new Date(exp).toISOString(),
    };
}

/**
 * Verify a magic token.
 * Returns the email if valid, null if invalid or expired.
 */
export function verifyMagicToken(token: string, expectedEmail: string): boolean {
    try {
        const [payloadB64, signature] = token.split(".");
        if (!payloadB64 || !signature) return false;

        // Verify signature
        const expectedSig = crypto
            .createHmac("sha256", SECRET)
            .update(payloadB64)
            .digest("base64url");

        if (signature !== expectedSig) return false;

        // Decode and validate payload
        const payload: TokenPayload = JSON.parse(
            Buffer.from(payloadB64, "base64url").toString()
        );

        // Check email matches
        if (payload.email !== expectedEmail.toLowerCase()) return false;

        // Check expiry
        if (Date.now() > payload.exp) return false;

        return true;
    } catch {
        return false;
    }
}
