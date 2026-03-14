/**
 * Brevo (Sendinblue) transactional email utility.
 *
 * Uses the Brevo REST API to send transactional emails.
 * No SDK required — just fetch().
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "ENERGDIVE";
import fs from 'fs';
import path from 'path';

interface SendEmailOptions {
    to: string;
    toName?: string;
    subject: string;
    htmlContent: string;
}

/**
 * Send a transactional email via Brevo.
 * Throws on failure so callers can handle/log.
 */
async function sendEmail(options: SendEmailOptions): Promise<void> {
    if (!BREVO_API_KEY) {
        console.error("[EMAIL] BREVO_API_KEY is not set — skipping email send");
        return;
    }

    const body = {
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: options.to, name: options.toName || options.to }],
        subject: options.subject,
        htmlContent: options.htmlContent,
    };

    const res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Brevo API ${res.status}: ${errorText}`);
    }

    console.log(`[EMAIL] Sent "${options.subject}" to ${options.to}`);
}

export async function sendPortalAccessEmail(
    to: string,
    firstName: string,
    magicLink: string
): Promise<void> {
    const subject = "Your EnergDive Portal Access is Ready";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    
                    <tr>
                        <td style="background:#0a2e1f;padding:40px 40px 32px;text-align:center;border-bottom:4px solid #09B697;">
                            ${logoUrl
            ? `<img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />`
            : `<h1 style="color:#ffffff;margin:0;font-size:24px;">ENERGDive</h1>`
        }
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:48px 40px;">
                            <h2 style="margin:0 0 16px;color:#111827;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
                                Hello ${firstName},
                            </h2>
                            <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
                                Your exclusive access to the <strong>EnergDive Intelligence Portal</strong> is now active.
                            </p>

                            <div style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
                                <p style="margin:0 0 20px;color:#6B7280;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                                    One-Click Secure Access
                                </p>
                                <a href="${magicLink}"
                                   style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;box-shadow:0 4px 12px rgba(9,182,151,0.3);">
                                    Access Your Portal &rarr;
                                </a>
                                <p style="margin:20px 0 0;color:#9CA3AF;font-size:12px;">
                                    This secure link will expire in 24 hours.
                                </p>
                            </div>

                            <p style="margin:0 0 32px;color:#6B7280;font-size:14px;line-height:1.6;font-style:italic;">
                                <strong>Tip:</strong> You don't need a password.
                            </p>

                            <hr style="border:none;border-top:1px solid #F3F4F6;margin:0 0 24px;" />

                            <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                                Copy and paste this link:<br/>
                                <a href="${magicLink}" style="color:#09B697;text-decoration:underline;">${magicLink}</a>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#F9FAFB;padding:32px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">
                                EnergDive Intelligence
                            </p>
                            <p style="margin:0 0 12px;color:#9CA3AF;font-size:12px;">
                                <a href="https://energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
                            </p>
                            <p style="margin:0;color:#9CA3AF;font-size:11px;">
                                &copy; ${new Date().getFullYear()} ENERGDIVE.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({ to, toName: firstName, subject, htmlContent });
}

/**
 * Send a welcome email to a newly onboarded user.
 */
export async function sendWelcomeEmail(
    to: string,
    firstName: string,
    frequency?: string,
    preferences?: string[]
): Promise<void> {
    const subject = "Welcome to ENERGDIVE!";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;
    const dashboardUrl = `${appUrl}/dashboard`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    
                    <tr>
                        <td style="background:#0a2e1f;padding:40px 40px 32px;text-align:center;border-bottom:4px solid #09B697;">
                            ${logoUrl
            ? `<img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />`
            : `<h1 style="color:#ffffff;margin:0;font-size:24px;">ENERGDIVE</h1>`
        }
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:48px 40px;">
                            <h2 style="margin:0 0 16px;color:#111827;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
                                Welcome aboard, ${firstName}! 
                            </h2>
                            <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
                                Welcome to <strong> ENERGClub — the member community of ENERGDIVE.</strong> Your registration is now confirmed, and you can begin exploring insights, analysis, and perspectives shaping India’s energy transition and the broader global energy ecosystem.
                            </p>

                            <div style="background-color:#F0FDF9;border:1px solid #09B697;border-radius:12px;padding:24px;margin-bottom:24px;">
                                <p style="margin:0 0 8px;color:#065F46;font-size:14px;font-weight:700;">Here's what you can do:</p>
                                <ul style="margin:0;padding-left:20px;color:#4B5563;font-size:14px;line-height:2;">
                                    <li>You can update your Community, Sub-Community, and communication preferences anytime by logging into your account and managing your profile settings.</li>
                                    <li>We will also be introducing several new features within ENERGClub in the coming months — including deeper research access, enhanced community engagement tools, and additional member benefits. We look forward to bringing you more value as the platform evolves.</li>
                                    <li>To stay informed about the latest updates, insights, and announcements, we encourage you to follow ENERGDIVE on our social media channels.</li>
                                    <li>If you need any assistance our team will be glad to support you.</li>
                                </ul>
                            </div>

                            ${(frequency || (preferences && preferences.length > 0)) ? `
                            <div style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;">
                                <p style="margin:0 0 12px;color:#374151;font-size:15px;font-weight:700;">Your Subscription Preferences:</p>
                                ${frequency ? `<p style="margin:0 0 8px;color:#4B5563;font-size:14px;"><strong>Frequency:</strong> <span style="text-transform: capitalize;">${frequency}</span></p>` : ''}
                                ${preferences && preferences.length > 0 ? `<p style="margin:0;color:#4B5563;font-size:14px;"><strong>Content:</strong> ${preferences.join(', ')}</p>` : ''}
                            </div>
                            ` : ''}

                        
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#F9FAFB;padding:32px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">
                                ENERGDIVE Intelligence
                            </p>
                            <p style="margin:0 0 12px;color:#9CA3AF;font-size:12px;">
                                <a href="https://energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
                            </p>
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

    await sendEmail({ to, toName: firstName, subject, htmlContent });
}

/**
 * Send an admin notification email to info@energdive.com
 * when a new user completes the full onboarding.
 */
export async function sendNewUserNotification(
    firstName: string,
    lastName: string,
    email: string
): Promise<void> {
    const ADMIN_EMAIL = "info@energdive.com";
    const subject = `New User Registered — ${firstName} ${lastName}`;
    const registeredAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "long",
        timeStyle: "short",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">

                    <tr>
                        <td style="background:#0a2e1f;padding:40px 40px 32px;text-align:center;border-bottom:4px solid #09B697;">
                            ${logoUrl
            ? `<img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />`
            : `<h1 style="color:#ffffff;margin:0;font-size:24px;">ENERGDIVE</h1>`
        }
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:48px 40px;">
                            <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">
                                🎉 New User Registered
                            </h2>
                            <p style="margin:0 0 28px;color:#6B7280;font-size:14px;">
                                A new user has completed onboarding on ENERGDIVE.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                                <tr>
                                    <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
                                        <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">First Name</p>
                                        <p style="margin:0;color:#111827;font-size:16px;font-weight:600;">${firstName}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
                                        <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Last Name</p>
                                        <p style="margin:0;color:#111827;font-size:16px;font-weight:600;">${lastName}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
                                        <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                                        <p style="margin:0;color:#111827;font-size:16px;font-weight:600;">
                                            <a href="mailto:${email}" style="color:#09B697;text-decoration:none;">${email}</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Registered At</p>
                                        <p style="margin:0;color:#111827;font-size:16px;font-weight:600;">${registeredAt}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#F9FAFB;padding:32px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">
                                ENERGDIVE Intelligence
                            </p>
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

    await sendEmail({ to: ADMIN_EMAIL, toName: "ENERGDIVE Admin", subject, htmlContent });
}
// ── Double Opt-In Email Helpers ───────────────────────────────────────────────

/**
 * Send magic link email (Scenario 1 — Zoho Form users).
 * Prompts user to click the link to start verification.
 */
export async function sendMagicLinkEmail(
    to: string,
    name: string,
    magicLink: string
): Promise<void> {
    const subject = "Verify your EnergClub membership";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F19;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <tr>
          <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
            <img src="${logoUrl}" alt="EnergDive" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Hi ${name},</h2>
            <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
              Thank you for registering with <strong>EnergClub</strong>. Click the button below to verify your membership and get access to the portal.
            </p>
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 16px;color:#6B7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Step 1 of 2 — Click to Verify</p>
              <a href="${magicLink}" style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;">
                Verify My Membership &rarr;
              </a>
              <p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;">This link expires in 24 hours.</p>
            </div>
            <p style="margin:0 0 12px;color:#6B7280;font-size:14px;line-height:1.6;">
              After clicking, you'll receive a one-time code to complete your verification.
            </p>
            <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              Can't click? Copy this link:<br/>
              <a href="${magicLink}" style="color:#09B697;">${magicLink}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">EnergDive Intelligence</p>
            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({ to, toName: name, subject, htmlContent });
}

/**
 * Send OTP verification email (both Scenario 1 and 2).
 * Delivers the 4-digit code to complete double opt-in.
 */
export async function sendOtpEmail(
    to: string,
    name: string,
    otp: string
): Promise<void> {
    const subject = "Your EnergClub verification code";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;

    // Format OTP digits with spacing for readability
    const otpDisplay = otp.split("").join(" &nbsp; ");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F19;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <tr>
          <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
            <img src="${logoUrl}" alt="EnergDive" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Hi ${name},</h2>
            <p style="margin:0 0 32px;color:#4B5563;font-size:16px;line-height:1.7;">
              Here is your <strong>one-time verification code</strong> to complete your EnergClub membership:
            </p>
            <div style="background:#0a2e1f;border-radius:16px;padding:40px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 8px;color:#09B697;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <p style="margin:0;color:#ffffff;font-size:52px;font-weight:900;letter-spacing:16px;font-family:'Courier New',monospace;">${otpDisplay}</p>
              <p style="margin:16px 0 0;color:#6B9E8C;font-size:13px;">Valid for 5 minutes</p>
            </div>
            <div style="background:#FEF9EC;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;color:#92400E;font-size:13px;line-height:1.6;">
                <strong>⚠️ Never share this code.</strong> EnergDive staff will never ask for your OTP.
              </p>
            </div>
            <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">EnergDive Intelligence</p>
            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({ to, toName: name, subject, htmlContent });
}

/**
 * Send welcome + membership ID email after successful double opt-in.
 */
export async function sendMembershipWelcomeEmail(
    to: string,
    name: string,
    membershipId: string
): Promise<void> {
    const subject = `Welcome to EnergClub — Your Membership ID: ${membershipId}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;
    const dashboardUrl = `${appUrl}/dashboard`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F19;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <tr>
          <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
            <img src="${logoUrl}" alt="EnergDive" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:28px;font-weight:900;">Welcome to EnergClub, ${name}! 🎉</h2>
            <p style="margin:0 0 32px;color:#4B5563;font-size:16px;line-height:1.7;">
              Your membership has been verified. Here is your official EnergClub Membership ID:
            </p>
            <div style="background:#0a2e1f;border-radius:16px;padding:36px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 12px;color:#09B697;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your Membership ID</p>
              <p style="margin:0;color:#ffffff;font-size:36px;font-weight:900;letter-spacing:6px;font-family:'Courier New',monospace;">${membershipId}</p>
              <p style="margin:16px 0 0;color:#6B9E8C;font-size:13px;">Keep this for your records</p>
            </div>
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${dashboardUrl}" style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:10px;">
                Go to My Dashboard &rarr;
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />
            <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
              <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;">Unsubscribe</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">EnergDive Intelligence</p>
            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({ to, toName: name, subject, htmlContent });
}