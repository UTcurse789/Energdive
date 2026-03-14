import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

/**
 * POST /api/auth/send-otp
 *
 * Sends an OTP to the given email address.
 * Used by both Scenario 1 (after magic link validation) and Scenario 2 (website signup).
 *
 * For Scenario 2 (website signup), also creates a pending_verifications record.
 *
 * Body: { email, name?, phone?, company?, source? }
 *
 * Source defaults to "website" for direct signups.
 * If called by the magic-link flow, the pending record already exists.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = (body.email || "").trim().toLowerCase();
        const name = (body.name || "").trim();
        const phone = (body.phone || "").trim();
        const company = (body.company || "").trim();
        const source = body.source || "website";

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Check if already a verified user
        const existingUser = await query(
            `SELECT id, verification_status, membership_id FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (existingUser.rows.length > 0 && existingUser.rows[0].verification_status === "verified") {
            return NextResponse.json(
                { error: "An account with this email already exists. Please log in." },
                { status: 409 }
            );
        }

        // For website signups (Scenario 2), upsert pending_verifications
        if (source === "website" && name) {
            await query(
                `INSERT INTO pending_verifications
                   (email, name, phone, company, source, verification_status,
                    otp_verified, otp_attempts, created_at, updated_at)
                 VALUES ($1,$2,$3,$4,$5,'pending',false,0,NOW(),NOW())
                 ON CONFLICT (email) DO UPDATE SET
                   name                = EXCLUDED.name,
                   phone               = EXCLUDED.phone,
                   company             = EXCLUDED.company,
                   source              = EXCLUDED.source,
                   verification_status = 'pending',
                   otp_verified        = false,
                   otp_attempts        = 0,
                   updated_at          = NOW()`,
                [email, name, phone || null, company || null, source]
            );
        }

        // Generate and send OTP
        const { otp, expiresAt } = await createOtp(email);

        // Get name from pending verification if not provided
        let displayName = name;
        if (!displayName) {
            const pending = await query(
                `SELECT name FROM pending_verifications WHERE email = $1 LIMIT 1`,
                [email]
            );
            displayName = pending.rows[0]?.name || "Member";
        }

        await sendOtpEmail(email, displayName, otp);

        return NextResponse.json({
            success: true,
            maskedEmail: maskEmail(email),
            expiresAt: expiresAt.toISOString(),
            message: "OTP sent to your email",
        });
    } catch (error: any) {
        // Handle rate limiting errors specifically
        if (error.message?.includes("Too many OTP requests")) {
            return NextResponse.json({ error: error.message }, { status: 429 });
        }

        console.error("[SEND-OTP] Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
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
