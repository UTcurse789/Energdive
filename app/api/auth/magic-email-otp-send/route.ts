import { NextResponse } from "next/server";
import { generateOtp, setOtp } from "@/lib/otp-store";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "ENERGDIVE";

/**
 * POST /api/auth/magic-email-otp-send
 *
 * Sends an OTP to the user's email during the magic link login flow.
 * Called after the magic link is clicked but before session creation.
 * NO auth required (user isn't signed in yet).
 *
 * Body: { email: string }
 */
export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Valid email is required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Reject dummy emails
        if (normalizedEmail.endsWith("@phone.energdive.com")) {
            return NextResponse.json(
                { error: "Please provide a real email address" },
                { status: 400 }
            );
        }

        if (!BREVO_API_KEY) {
            console.error("[MAGIC_EMAIL_OTP] BREVO_API_KEY not set");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Generate OTP and store it keyed by email
        const otp = generateOtp();
        setOtp(normalizedEmail, otp);

        console.log(`[MAGIC_EMAIL_OTP] Sending OTP to: ${normalizedEmail}, otp: ${otp}`);

        // Send via Brevo transactional email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
        const logoUrl = `${appUrl}/logo2-removebg-preview.png`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background:#0a2e1f;padding:40px 40px 32px;text-align:center;border-bottom:4px solid #09B697;">
                            <img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:48px 40px;">
                            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">
                                Verify Your Login
                            </h2>
                            <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
                                Use the verification code below to complete your sign-in to EnergDive.
                            </p>
                            <div style="background-color:#F0FDF9;border:2px solid #09B697;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
                                <p style="margin:0 0 8px;color:#6B7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">
                                    Your Verification Code
                                </p>
                                <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#09B697;font-family:monospace;">
                                    ${otp}
                                </p>
                            </div>
                            <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.6;">
                                This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0;color:#9CA3AF;font-size:11px;">
                                &copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        const res = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                sender: { name: FROM_NAME, email: FROM_EMAIL },
                to: [{ email: normalizedEmail }],
                subject: `${otp} — Your EnergDive Login Code`,
                htmlContent,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[MAGIC_EMAIL_OTP] Brevo error: ${res.status} ${errorText}`);
            return NextResponse.json(
                { error: "Failed to send verification email" },
                { status: 500 }
            );
        }

        console.log(`[MAGIC_EMAIL_OTP] OTP sent successfully to: ${normalizedEmail}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[MAGIC_EMAIL_OTP] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
