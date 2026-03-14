import { NextRequest, NextResponse } from "next/server";
import { validateMagicToken } from "@/lib/magic-link-db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

/**
 * GET /api/auth/magic-link?token=xyz
 *
 * Validates a magic link token from the email.
 * If valid:
 *   1. Validates the SHA256 hash against the DB
 *   2. Checks single-use and 24hr expiry
 *   3. Sends an OTP to the user's email
 *   4. Returns pending record info for the frontend OTP form
 *
 * Does NOT create any user or CRM lead yet.
 */
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    try {
        // ── 1. Validate magic token ──────────────────────────────────────
        const pending = await validateMagicToken(token);

        if (!pending) {
            return NextResponse.json(
                { error: "Invalid, expired, or already used verification link." },
                { status: 404 }
            );
        }

        // ── 2. Already verified — redirect to login ──────────────────────
        if (pending.verification_status === "verified") {
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                email: pending.email,
                message: "Already verified. You can log in.",
            });
        }

        // ── 3. Generate and send OTP ─────────────────────────────────────
        const { otp, expiresAt } = await createOtp(pending.email);
        await sendOtpEmail(pending.email, pending.name || "Member", otp);

        console.log(`[MAGIC-LINK] OTP sent to ${pending.email}, pending_id=${pending.id}`);

        return NextResponse.json({
            success: true,
            pendingId: pending.id,
            email: pending.email,
            maskedEmail: maskEmail(pending.email),
            name: pending.name,
            expiresAt: expiresAt.toISOString(),
            message: "OTP sent to your email",
        });
    } catch (error: any) {
        // Handle rate limiting from OTP creation
        if (error.message?.includes("Too many OTP requests")) {
            return NextResponse.json({ error: error.message }, { status: 429 });
        }

        console.error("[MAGIC-LINK] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function maskEmail(email: string): string {
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const masked = user.slice(0, 2) + "***" + user.slice(-1);
    return `${masked}@${domain}`;
}
