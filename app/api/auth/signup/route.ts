import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateOtp, setOtp } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/email";

/**
 * POST /api/auth/signup
 *
 * Scenario 2: User signs up directly on the portal (internet / website).
 *
 * Flow:
 *   1. Store user in pending_verifications with source='website'.
 *   2. Send OTP email.
 *   3. Frontend shows OTP form.
 *   4. User submits OTP → POST /api/auth/confirm-otp (same endpoint as Scenario 1).
 *   5. confirm-otp creates user, membership ID, CRM lead, Brevo sync.
 *
 * Body: { email, name, phone?, company? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
    try {
        const { email, name, phone, company } = await req.json();

        if (!email || !name) {
            return NextResponse.json(
                { error: "email and name are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if already a verified user
        const existingUser = await query(
            `SELECT id, verification_status, membership_id FROM users WHERE email = $1 LIMIT 1`,
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0 && existingUser.rows[0].verification_status === "verified") {
            return NextResponse.json(
                { error: "An account with this email already exists. Please log in." },
                { status: 409 }
            );
        }

        // Upsert pending verification
        const result = await query(
            `INSERT INTO pending_verifications
         (email, name, phone, company, source, verification_status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'website','pending',NOW(),NOW())
       ON CONFLICT (email) DO UPDATE SET
         name                = EXCLUDED.name,
         phone               = EXCLUDED.phone,
         company             = EXCLUDED.company,
         source              = 'website',
         verification_status = 'pending',
         otp_verified        = false,
         verified_at         = NULL,
         magic_token         = NULL,
         updated_at          = NOW()
       RETURNING id`,
            [normalizedEmail, name.trim(), phone?.trim() || null, company?.trim() || null]
        );

        const pendingId = result.rows[0].id;

        // Generate + send OTP
        const otp = generateOtp();
        setOtp(normalizedEmail, otp);
        await sendOtpEmail(normalizedEmail, name.trim(), otp);

        console.log(`[signup] OTP sent to ${normalizedEmail}, pending_id=${pendingId}`);

        return NextResponse.json({
            success: true,
            pendingId,
            maskedEmail: maskEmail(normalizedEmail),
            message: "OTP sent to your email",
        });
    } catch (error: any) {
        console.error("[signup] Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}

function maskEmail(email: string): string {
    const [user, domain] = email.split("@");
    const masked = user.slice(0, 2) + "***" + user.slice(-1);
    return `${masked}@${domain}`;
}