/**
 * Brevo (Sendinblue) transactional email utility.
 *
 * Uses the Brevo REST API to send transactional emails.
 * No SDK required — just fetch().
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "EnergDive";

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

/**
 * Send the "Portal Access Granted" email with a magic login link.
 */
export async function sendPortalAccessEmail(
    to: string,
    firstName: string,
    magicLink: string
): Promise<void> {
    const subject = "Your EnergDive Portal Access is Ready";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#0a2e1f 0%,#1a4731 100%);padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                                EnergDive
                            </h1>
                            <p style="margin:8px 0 0;color:#09B697;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">
                                Energy Intelligence Platform
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 8px;color:#121212;font-size:22px;font-weight:700;">
                                Welcome to EnergDive, ${firstName}!
                            </h2>
                            <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
                                Your portal access has been activated. Click the button below to sign in instantly — no password needed.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 32px;">
                                        <a href="${magicLink}"
                                           style="display:inline-block;background:#09B697;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                                            Access Your Portal →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 16px;color:#999;font-size:13px;line-height:1.5;">
                                This link is valid for <strong>24 hours</strong> and can only be used once. If it expires, contact your account manager for a new link.
                            </p>

                            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />

                            <p style="margin:0;color:#bbb;font-size:12px;line-height:1.5;">
                                If the button doesn't work, copy and paste this URL into your browser:<br/>
                                <a href="${magicLink}" style="color:#09B697;word-break:break-all;">${magicLink}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                            <p style="margin:0;color:#999;font-size:11px;">
                                © ${new Date().getFullYear()} EnergDive. All rights reserved.
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
