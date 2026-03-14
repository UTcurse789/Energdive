import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateOtp, setOtp } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/email";

/**
 * GET /api/auth/verify-account?token=xyz
 *
 * Step 1 of double opt-in: validates the magic token from the email link.
 * If valid, sends an OTP to the user's email and returns the pending record
 * info so the frontend can show the OTP entry form.
 *
 * Does NOT create any CRM lead or user account yet.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    // ── 1. Look up the pending_verification by token ─────────────────
    const result = await query(
      `SELECT id, email, name, phone, verification_status,
              magic_token_expires_at, otp_verified
       FROM pending_verifications
       WHERE magic_token = $1
       LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or already used verification link" },
        { status: 404 }
      );
    }

    const pending = result.rows[0];

    // ── 2. Check expiry ──────────────────────────────────────────────
    if (new Date() > new Date(pending.magic_token_expires_at)) {
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // ── 3. Check if already verified ────────────────────────────────
    if (pending.verification_status === "verified") {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        email: pending.email,
        message: "Already verified. You can log in.",
      });
    }

    // ── 4. Generate & send OTP to email ─────────────────────────────
    const otp = generateOtp();
    setOtp(pending.email, otp);

    await sendOtpEmail(pending.email, pending.name || "Member", otp);

    console.log(`[verify-account] OTP sent to ${pending.email}, pending_id=${pending.id}`);

    return NextResponse.json({
      success: true,
      pendingId: pending.id,
      email: pending.email,
      // Partially masked for UI display
      maskedEmail: maskEmail(pending.email),
      message: "OTP sent to your email",
    });
  } catch (error: any) {
    console.error("[verify-account] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  const masked = user.slice(0, 2) + "***" + user.slice(-1);
  return `${masked}@${domain}`;
}