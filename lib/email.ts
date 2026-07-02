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
const DIGEST_FROM_EMAIL =
    process.env.DIGEST_FROM_EMAIL || "insights@updates.energdive.com";
const DIGEST_FROM_NAME = process.env.DIGEST_FROM_NAME || "ENERGDIVE Intelligence";

import { buildMembershipCardHtml } from "./_card-template";
import { generateMembershipCardPdf } from "./membership-pdf";

interface SendEmailOptions {
    to: string;
    toName?: string;
    subject: string;
    htmlContent: string;
    attachment?: { name: string; content: string }[];
    sender?: { email: string; name: string };
    tags?: string[];
}

interface MembershipWelcomeEmailDetails {
    company?: string | null;
    community?: string | null;
    joinedAt?: string | Date | null;
    accessToken?: string | null;
}

interface PreferenceDigestSection {
    format: string;
    items: Array<{
        title: string;
        href: string;
        crispLine: string;
        imageUrl: string | null;
        badge: string;
        publishedAt: Date;
    }>;
}

interface EnergJobApplicationEmailPayload {
    applicantEmail: string;
    applicantName: string;
    companyName: string;
    coverNote?: string | null;
    jobTitle: string;
    jobUrl: string;
    phone?: string | null;
    recruiterEmail?: string | null;
    recruiterName?: string | null;
    resumeUrl?: string | null;
    applicationViewUrl?: string | null;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatMembershipDate(value?: string | Date | null): string {
    const date = value ? new Date(value) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(safeDate);
}

function getEnergdiveLogoUrl() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    return `${appUrl}/Energdive-Logo.png`;
}

function buildEnergJobEmailShell(subject: string, body: string) {
    const logoUrl = getEnergdiveLogoUrl();

    return `
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
                <table width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background:#0a2e1f;padding:32px 40px;text-align:center;border-bottom:4px solid #09B697;">
                            <img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px;">
                            ${body}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDIVE</p>
                            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
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

    const body: Record<string, unknown> = {
        sender: options.sender || { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: options.to, name: options.toName || options.to }],
        subject: options.subject,
        htmlContent: options.htmlContent,
    };
    if (options.attachment && options.attachment.length > 0) {
        body.attachment = options.attachment;
    }
    if (options.tags && options.tags.length > 0) {
        body.tags = options.tags;
    }

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

    const result = (await res.json()) as { messageId?: string };
    console.log(
        `[EMAIL] Sent "${options.subject}" to ${options.to}${result.messageId ? ` (${result.messageId})` : ""
        }`
    );
}

export async function sendPortalAccessEmail(
    to: string,
    firstName: string,
    magicLink: string
): Promise<void> {
    const subject = "Your ENERGDive Portal Access is Ready";

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
                                Your exclusive access to the <strong>ENERGDive Intelligence Portal</strong> is now active.
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
                                ENERGDive Intelligence
                            </p>
                            <p style="margin:0 0 12px;color:#9CA3AF;font-size:12px;">
                                <a href="https://www.energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
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

export async function sendEnergJobApplicationApplicantEmail(
    payload: EnergJobApplicationEmailPayload
): Promise<void> {
    const subject = `Application received for ${payload.jobTitle}`;
    const recruiterLabel = payload.recruiterName || payload.companyName;
    const logoUrl = getEnergdiveLogoUrl();
    const yr = new Date().getFullYear();
    const appliedDate = new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(new Date());

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <!--[if mso]><style>table{border-collapse:collapse;}td{border-collapse:collapse;}</style><![endif]-->
    <style type="text/css">
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        @media only screen and (max-width: 640px) {
            .email-wrap { width: 100% !important; }
            .content-pad { padding: 28px 20px !important; }
            .header-pad { padding: 24px 20px !important; }
            .footer-pad { padding: 20px !important; }
            .job-card-td { padding: 20px !important; }
            .step-table { width: 100% !important; }
            .step-td { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; text-align: center !important; }
            .cta-btn { display: block !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 16px;">
        <tr>
            <td align="center">
                <table class="email-wrap" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- ═══ LOGO HEADER ═══ -->
                    <tr>
                        <td class="header-pad" style="padding:28px 40px;background:#ffffff;border-bottom:1px solid #e8ecf1;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <img src="${logoUrl}" alt="ENERGDIVE" width="160" style="display:block;max-width:160px;height:auto;" />
                                    </td>
                                    <td align="right" style="color:#6b7280;font-size:12px;font-weight:600;">
                                        EnergJob
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ SUCCESS BANNER ═══ -->
                    <tr>
                        <td style="padding:0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#091d3a 0%,#0d3150 100%);">
                                <tr>
                                    <td class="content-pad" style="padding:40px;text-align:center;">
                                        <div style="font-size:48px;line-height:1;margin-bottom:16px;">🚀</div>
                                        <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.3px;">Application Submitted!</h1>
                                        <p style="margin:0;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.5;">Your application has been successfully received</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ GREETING ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:32px 40px 0;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:18px;font-weight:700;">Hi ${escapeHtml(payload.applicantName)},</p>
                            <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
                                Thank you for applying. Your application for the position below has been received and shared with <strong>${escapeHtml(recruiterLabel)}</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ JOB DETAILS CARD ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:24px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                                <tr>
                                    <td style="background:#09B697;padding:3px 0;font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="job-card-td" style="padding:24px 28px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <p style="margin:0 0 4px;color:#09B697;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Position Applied</p>
                                                    <h2 style="margin:0 0 16px;color:#091d3a;font-size:20px;font-weight:800;line-height:1.3;">${escapeHtml(payload.jobTitle)}</h2>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="50%" valign="top" style="padding:0 8px 12px 0;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Company</p>
                                                                <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${escapeHtml(payload.companyName)}</p>
                                                            </td>
                                                            <td width="50%" valign="top" style="padding:0 0 12px 8px;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Applied On</p>
                                                                <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${appliedDate}</p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td width="50%" valign="top" style="padding:0 8px 0 0;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Phone</p>
                                                                <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${escapeHtml(payload.phone || "Not provided")}</p>
                                                            </td>
                                                            <td width="50%" valign="top" style="padding:0 0 0 8px;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Resume</p>
                                                                <p style="margin:0;font-size:14px;font-weight:600;">${payload.resumeUrl ? `<a href="${payload.resumeUrl}" style="color:#09B697;text-decoration:underline;">View Resume</a>` : `<span style="color:#374151;">Not provided</span>`}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ WHAT'S NEXT ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:0 40px 8px;">
                            <p style="margin:0 0 16px;color:#091d3a;font-size:16px;font-weight:700;">What happens next?</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-pad" style="padding:0 40px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding:0 0 16px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="36" valign="top">
                                                    <div style="width:32px;height:32px;background:#e6f9f4;border-radius:50%;text-align:center;line-height:32px;color:#09B697;font-size:14px;font-weight:800;">1</div>
                                                </td>
                                                <td valign="top" style="padding-left:12px;">
                                                    <p style="margin:0 0 2px;color:#091d3a;font-size:14px;font-weight:700;">Application Received</p>
                                                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">Your application has been saved and synced with the hiring workflow.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0 0 16px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="36" valign="top">
                                                    <div style="width:32px;height:32px;background:#e6f9f4;border-radius:50%;text-align:center;line-height:32px;color:#09B697;font-size:14px;font-weight:800;">2</div>
                                                </td>
                                                <td valign="top" style="padding-left:12px;">
                                                    <p style="margin:0 0 2px;color:#091d3a;font-size:14px;font-weight:700;">Recruiter Review</p>
                                                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">The hiring team at ${escapeHtml(payload.companyName)} will review your profile.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="36" valign="top">
                                                    <div style="width:32px;height:32px;background:#e6f9f4;border-radius:50%;text-align:center;line-height:32px;color:#09B697;font-size:14px;font-weight:800;">3</div>
                                                </td>
                                                <td valign="top" style="padding-left:12px;">
                                                    <p style="margin:0 0 2px;color:#091d3a;font-size:14px;font-weight:700;">Next Steps</p>
                                                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">If shortlisted, you'll be contacted directly for further rounds.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ CTA BUTTON ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:0 40px 32px;text-align:center;">
                            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td align="center" style="border-radius:8px;background:#09B697;">
                                        <a class="cta-btn" href="${payload.jobUrl}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">View Job Details &rarr;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ DIVIDER ═══ -->
                    <tr>
                        <td style="padding:0 40px;">
                            <div style="border-top:1px solid #e8ecf1;"></div>
                        </td>
                    </tr>

                    <!-- ═══ FOOTER ═══ -->
                    <tr>
                        <td class="footer-pad" style="padding:24px 40px 32px;text-align:center;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:13px;font-weight:700;">ENERGDIVE</p>
                            <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;line-height:1.5;">India's leading energy intelligence platform</p>
                            <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${yr} ENERGDIVE. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to: payload.applicantEmail,
        toName: payload.applicantName,
        subject,
        htmlContent,
        tags: ["energjob", "application", "applicant"],
    });
}

export async function sendEnergJobApplicationRecruiterEmail(
    payload: EnergJobApplicationEmailPayload
): Promise<void> {
    if (!payload.recruiterEmail) {
        return;
    }

    const subject = `New application for ${payload.jobTitle}`;
    const logoUrl = getEnergdiveLogoUrl();
    const yr = new Date().getFullYear();
    const appliedDate = new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(new Date());
    const initials = payload.applicantName
        .split(" ")
        .map((n) => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <!--[if mso]><style>table{border-collapse:collapse;}td{border-collapse:collapse;}</style><![endif]-->
    <style type="text/css">
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        @media only screen and (max-width: 640px) {
            .email-wrap { width: 100% !important; }
            .content-pad { padding: 24px 20px !important; }
            .header-pad { padding: 24px 20px !important; }
            .footer-pad { padding: 20px !important; }
            .profile-card-td { padding: 20px !important; }
            .cta-table { width: 100% !important; }
            .cta-td { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; text-align: center !important; }
            .cta-td a { display: block !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 16px;">
        <tr>
            <td align="center">
                <table class="email-wrap" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- ═══ LOGO HEADER ═══ -->
                    <tr>
                        <td class="header-pad" style="padding:28px 40px;background:#ffffff;border-bottom:1px solid #e8ecf1;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <img src="${logoUrl}" alt="ENERGDIVE" width="160" style="display:block;max-width:160px;height:auto;" />
                                    </td>
                                    <td align="right" style="color:#6b7280;font-size:12px;font-weight:600;">
                                        EnergJob &middot; Recruiter
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ NOTIFICATION BAR ═══ -->
                    <tr>
                        <td style="padding:0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#091d3a;">
                                <tr>
                                    <td style="padding:16px 40px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;">📩 New Application Received</p>
                                                </td>
                                                <td align="right">
                                                    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">${appliedDate}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ GREETING ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:28px 40px 0;">
                            <p style="margin:0 0 4px;color:#091d3a;font-size:16px;font-weight:700;">Hi ${escapeHtml(payload.recruiterName || "Hiring Manager")},</p>
                            <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
                                A new candidate has applied for <strong style="color:#091d3a;">${escapeHtml(payload.jobTitle)}</strong> at <strong style="color:#091d3a;">${escapeHtml(payload.companyName)}</strong>. Here's the applicant profile summary:
                            </p>
                        </td>
                    </tr>

                    <!-- ═══ CANDIDATE PROFILE CARD ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:24px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                                <!-- Card Header -->
                                <tr>
                                    <td style="background:linear-gradient(135deg,#09B697 0%,#07a085 100%);padding:20px 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="52" valign="middle">
                                                    <div style="width:48px;height:48px;background:#ffffff;border-radius:50%;text-align:center;line-height:48px;color:#09B697;font-size:18px;font-weight:800;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${initials}</div>
                                                </td>
                                                <td valign="middle" style="padding-left:14px;">
                                                    <p style="margin:0 0 2px;color:#ffffff;font-size:18px;font-weight:800;">${escapeHtml(payload.applicantName)}</p>
                                                    <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;">Applicant for ${escapeHtml(payload.jobTitle)}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Card Body -->
                                <tr>
                                    <td class="profile-card-td" style="padding:0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <!-- Email -->
                                            <tr>
                                                <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="24" valign="top" style="color:#09B697;font-size:16px;">✉️</td>
                                                            <td valign="top" style="padding-left:10px;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email Address</p>
                                                                <p style="margin:0;font-size:14px;"><a href="mailto:${payload.applicantEmail}" style="color:#09B697;text-decoration:none;font-weight:600;">${escapeHtml(payload.applicantEmail)}</a></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Phone -->
                                            <tr>
                                                <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="24" valign="top" style="color:#09B697;font-size:16px;">📱</td>
                                                            <td valign="top" style="padding-left:10px;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Phone Number</p>
                                                                <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${escapeHtml(payload.phone || "Not provided")}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Resume -->
                                            <tr>
                                                <td style="padding:16px 24px;border-bottom:1px solid #f3f4f6;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="24" valign="top" style="color:#09B697;font-size:16px;">📄</td>
                                                            <td valign="top" style="padding-left:10px;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Resume / Profile</p>
                                                                <p style="margin:0;font-size:14px;font-weight:600;">${payload.resumeUrl ? `<a href="${payload.resumeUrl}" style="color:#09B697;text-decoration:underline;">Download Resume</a>` : `<span style="color:#374151;">Not provided</span>`}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <!-- Cover Note -->
                                            <tr>
                                                <td style="padding:16px 24px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="24" valign="top" style="color:#09B697;font-size:16px;">💬</td>
                                                            <td valign="top" style="padding-left:10px;">
                                                                <p style="margin:0 0 2px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Cover Note</p>
                                                                <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${escapeHtml(payload.coverNote || "No cover note provided.")}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ CTA BUTTONS ═══ -->
                    <tr>
                        <td class="content-pad" style="padding:0 40px 32px;">
                            <table class="cta-table" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td class="cta-td" style="padding-right:8px;">
                                        <a href="${payload.applicationViewUrl || payload.jobUrl}" style="display:inline-block;padding:13px 28px;background:#09B697;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">View Applicant &rarr;</a>
                                    </td>
                                    <td class="cta-td">
                                        <a href="${payload.jobUrl}" style="display:inline-block;padding:13px 28px;background:#091d3a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">Open Job Page &rarr;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- ═══ DIVIDER ═══ -->
                    <tr>
                        <td style="padding:0 40px;">
                            <div style="border-top:1px solid #e8ecf1;"></div>
                        </td>
                    </tr>

                    <!-- ═══ FOOTER ═══ -->
                    <tr>
                        <td class="footer-pad" style="padding:24px 40px 32px;text-align:center;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:13px;font-weight:700;">ENERGDIVE</p>
                            <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;line-height:1.5;">India's leading energy intelligence platform</p>
                            <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${yr} ENERGDIVE. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to: payload.recruiterEmail,
        toName: payload.recruiterName || payload.companyName,
        subject,
        htmlContent,
        tags: ["energjob", "application", "recruiter"],
    });
}

export interface AbstractSubmissionAdminNotificationPayload {
    title: string;
    authorName: string;
    authorEmail: string;
    coAuthor?: string;
    institution?: string;
    profession?: string;
    sectors?: string[];
    abstractText: string;
    pdfFileName?: string;
    pdfBase64?: string; // Base64 encoded content
    pdfUrl?: string; // Clickable download/view link
}

export async function sendAbstractSubmissionAdminNotification(
    payload: AbstractSubmissionAdminNotificationPayload
): Promise<void> {
    const adminEmails = ["utkarsh@encis.in", "sankalp@itenmedia.in"];
    const subject = `New Abstract Submission: ${payload.title}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">New Abstract Submitted</h2>
        <p>A new abstract has been submitted to the ENERGDIVE Insights Exchange.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 150px;">Title</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(payload.title || "")}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Author Name</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(payload.authorName || "")}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Author Email</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${escapeHtml(payload.authorEmail || "")}">${escapeHtml(payload.authorEmail || "")}</a></td>
            </tr>
            ${payload.coAuthor ? `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Co-Author</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(payload.coAuthor)}</td>
            </tr>
            ` : ""}
            ${payload.institution ? `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Institution/Company</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(payload.institution)}</td>
            </tr>
            ` : ""}
            ${payload.profession ? `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Designation</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${escapeHtml(payload.profession)}</td>
            </tr>
            ` : ""}
        </table>

        <div style="margin-top: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Abstract Description</h3>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 4px; color: #555; white-space: pre-wrap;">${escapeHtml(payload.abstractText || "No description provided.")}</div>
        </div>

        <p style="margin-top: 25px; margin-bottom: 15px;">
            ${payload.pdfUrl ? `
            <strong style="display: block; margin-bottom: 8px; color: #333;">Submitted PDF Document:</strong>
            <a href="${payload.pdfUrl}" target="_blank" style="display: inline-block; background-color: #00A651; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(0, 166, 81, 0.25);">View / Download PDF</a>
            ` : payload.pdfBase64 ? `
            <span style="color: #666;">The submitted PDF document is attached to this email.</span>
            ` : `
            <span style="color: #666; font-style: italic;">No PDF document was attached to this submission.</span>
            `}
        </p>
    </div>
</body>
</html>`;

    const attachment = payload.pdfBase64 && payload.pdfFileName ? [
        { name: payload.pdfFileName, content: payload.pdfBase64 }
    ] : undefined;

    // Send to all admins
    for (const email of adminEmails) {
        try {
            await sendEmail({
                to: email,
                subject,
                htmlContent,
                attachment,
                tags: ["abstract-submission", "admin-notification"]
            });
        } catch (error) {
            console.error(`[EMAIL] Failed to send abstract notification to ${email}:`, error);
        }
    }
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
                                <a href="https://www.energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
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

export async function sendNewsletterSubscriptionThanksEmail(to: string): Promise<void> {
    const subject = "Thanks for subscribing to ENERGDIVE Daily Briefing";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const isDev = process.env.NODE_ENV === "development";
    
    // In dev/local testing, fallback to temporary CDN urls so images render properly in user email clients.
    // In production, use standard public path urls served by the next app.
    const logoUrl = isDev 
        ? "https://tmpfiles.org/dl/wMwTWkdz090m/energdive-logo-white-rr.png"
        : `${appUrl}/energdive-logo-white-rr.png`;
    const headerBgUrl = isDev
        ? "https://tmpfiles.org/dl/w2wHWodM0ko8/email_header_bg.png"
        : `${appUrl}/images/email_header_bg.png`;
    const envelopeUrl = isDev
        ? "https://tmpfiles.org/dl/wpwkWidZ0bcU/newsletter_envelope.png"
        : `${appUrl}/images/newsletter_envelope.png`;

    const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(to)}`;
    const year = new Date().getFullYear();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
        <tr>
            <td align="center">
                <!-- Container Card -->
                <table width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color:#05131b; background-image:url('${headerBgUrl}'); background-size:cover; background-position:center; padding:32px 40px; text-align:left; border-bottom:4px solid #00C49A;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <img src="${logoUrl}" alt="ENERGDIVE" width="160" style="display:block; max-width:160px; height:auto; margin-bottom:6px;" />
                                        <div style="color:rgba(255,255,255,0.7); font-size:11px; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; letter-spacing:0.5px;">Insights and Market Intelligence</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Body Container -->
                    <tr>
                        <td style="padding:40px 32px 32px 32px; background-color:#ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <!-- Left Text Column -->
                                    <td width="320" valign="top" style="padding-right:20px; text-align:left;">
                                        
                                        <!-- Subscription Confirmed Pill -->
                                        <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                                            <tr>
                                                <td style="background-color:#e6f7ed; border:1px solid #ccefdc; border-radius:20px; padding:6px 14px;">
                                                    <table cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="background-color:#00A651; color:#ffffff; width:16px; height:16px; border-radius:50%; text-align:center; font-size:10px; line-height:16px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">✔</td>
                                                            <td style="color:#00A651; font-size:11px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; font-family:'Segoe UI',Roboto,sans-serif; padding-left:6px; line-height:16px;">Subscription Confirmed</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Heading -->
                                        <h1 style="margin:0 0 12px 0; color:#111827; font-size:32px; font-weight:800; line-height:1.2; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Thanks for subscribing!</h1>
                                        
                                        <!-- Green accent bar -->
                                        <div style="width:44px; height:3px; background-color:#00A651; margin-bottom:24px;"></div>
                                        
                                        <!-- Description -->
                                        <p style="margin:0 0 16px 0; color:#4b5563; font-size:14px; line-height:1.6; font-family:'Segoe UI',Roboto,sans-serif;">
                                            You are now subscribed to the ENERGDIVE Daily Briefing newsletter.
                                        </p>
                                        <p style="margin:0 0 28px 0; color:#4b5563; font-size:14px; line-height:1.6; font-family:'Segoe UI',Roboto,sans-serif;">
                                            We'll send you concise energy news, market updates, policy moves, and expert insights—straight to your inbox.
                                        </p>
                                        
                                        <!-- Read Latest News Button -->
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background-color:#00A651; border-radius:8px; padding:12px 20px;">
                                                    <a href="${appUrl}/news" style="color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; display:inline-block;">
                                                        <table cellpadding="0" cellspacing="0">
                                                            <tr>
                                                                <td style="padding-right:8px; line-height:1;"><span style="font-size:16px;">📰</span></td>
                                                                <td style="line-height:1; font-size:14px; font-weight:bold; color:#ffffff; font-family:'Segoe UI',Roboto,sans-serif;">Read latest news</td>
                                                                <td style="padding-left:8px; line-height:1;"><span style="font-size:16px;">→</span></td>
                                                            </tr>
                                                        </table>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                    
                                    <!-- Right Image Column -->
                                    <td width="200" align="center" valign="middle" style="text-align:center;">
                                        <img src="${envelopeUrl}" alt="Newsletter Subscription" width="200" style="display:block; max-width:200px; height:auto; margin:0 auto;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Features Band -->
                    <tr>
                        <td style="background-color:#f9fafb; border-top:1px solid #f3f4f6; border-bottom:1px solid #f3f4f6; padding:24px 32px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <!-- Feature 1 -->
                                    <td width="33%" valign="top" style="padding-right:12px;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td valign="top" style="padding-right:8px;">
                                                    <div style="width:32px; height:32px; border-radius:50%; background-color:#e6f7ed; text-align:center; line-height:32px;">
                                                        <span style="color:#00A651; font-size:16px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">⚡</span>
                                                    </div>
                                                </td>
                                                <td valign="top">
                                                    <h4 style="margin:0 0 2px 0; color:#111827; font-size:12px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">Timely Updates</h4>
                                                    <p style="margin:0; color:#6b7280; font-size:11px; line-height:1.4; font-family:'Segoe UI',Roboto,sans-serif;">Stay ahead with the latest energy news.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <!-- Feature 2 -->
                                    <td width="33%" valign="top" style="padding-right:12px;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td valign="top" style="padding-right:8px;">
                                                    <div style="width:32px; height:32px; border-radius:50%; background-color:#e6f7ed; text-align:center; line-height:32px;">
                                                        <span style="color:#00A651; font-size:16px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">📈</span>
                                                    </div>
                                                </td>
                                                <td valign="top">
                                                    <h4 style="margin:0 0 2px 0; color:#111827; font-size:12px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">Market Intelligence</h4>
                                                    <p style="margin:0; color:#6b7280; font-size:11px; line-height:1.4; font-family:'Segoe UI',Roboto,sans-serif;">Actionable insights you can trust.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <!-- Feature 3 -->
                                    <td width="33%" valign="top">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td valign="top" style="padding-right:8px;">
                                                    <div style="width:32px; height:32px; border-radius:50%; background-color:#e6f7ed; text-align:center; line-height:32px;">
                                                        <span style="color:#00A651; font-size:16px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">📄</span>
                                                    </div>
                                                </td>
                                                <td valign="top">
                                                    <h4 style="margin:0 0 2px 0; color:#111827; font-size:12px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">Expert Analysis</h4>
                                                    <p style="margin:0; color:#6b7280; font-size:11px; line-height:1.4; font-family:'Segoe UI',Roboto,sans-serif;">In-depth perspectives from industry experts.</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color:#f3f4f6; padding:32px 40px; text-align:center;">
                            <p style="margin:0 0 8px 0; color:#111827; font-size:13px; font-weight:bold; font-family:'Segoe UI',Roboto,sans-serif;">
                                ENERGDive Intelligence
                            </p>
                            <p style="margin:0 0 16px 0; color:#6b7280; font-size:12px; font-family:'Segoe UI',Roboto,sans-serif;">
                                You can unsubscribe at any time. <a href="${unsubscribeUrl}" style="color:#00A651; text-decoration:underline; font-weight:bold;">Unsubscribe</a>
                            </p>
                            
                            <!-- Social Media Icons -->
                            <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px auto;">
                                <tr>
                                    <td style="padding:0 6px;">
                                        <a href="https://www.linkedin.com/company/energdive/" style="display:inline-block; width:28px; height:28px; border-radius:50%; background-color:#111827; text-align:center; line-height:28px; text-decoration:none;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/linkedin.png" alt="LinkedIn" width="14" style="vertical-align:middle; width:14px; height:14px; display:inline-block; border:0;" />
                                        </a>
                                    </td>
                                    <td style="padding:0 6px;">
                                        <a href="https://x.com/energdive" style="display:inline-block; width:28px; height:28px; border-radius:50%; background-color:#111827; text-align:center; line-height:28px; text-decoration:none;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/twitter.png" alt="Twitter" width="14" style="vertical-align:middle; width:14px; height:14px; display:inline-block; border:0;" />
                                        </a>
                                    </td>
                                    <td style="padding:0 6px;">
                                        <a href="${appUrl}" style="display:inline-block; width:28px; height:28px; border-radius:50%; background-color:#111827; text-align:center; line-height:28px; text-decoration:none;">
                                            <img src="https://img.icons8.com/ios-filled/50/ffffff/globe.png" alt="Website" width="14" style="vertical-align:middle; width:14px; height:14px; display:inline-block; border:0;" />
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin:0; color:#9ca3af; font-size:11px; font-family:'Segoe UI',Roboto,sans-serif;">
                                &copy; ${year} ENERGDIVE. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to,
        toName: to,
        subject,
        htmlContent,
        sender: {
            email: DIGEST_FROM_EMAIL,
            name: DIGEST_FROM_NAME,
        },
        tags: ["newsletter-subscription", "daily-briefing"],
    });
}

export async function sendPreferenceDigestEmail(
    to: string,
    firstName: string,
    frequency: string,
    sections: PreferenceDigestSection[],
    sponsor?: { imageUrl: string; targetUrl: string } | null
): Promise<void> {
    const displayFrequency = `${frequency.charAt(0).toUpperCase()}${frequency.slice(1)}`;
    const subject = `Your ENERGDIVE ${displayFrequency} Briefing`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/Energdive-Logo.png`;
    const bannerUrl = `https://cdn.energdive.com/email_banner_removebg_preview_80e2da0393.png`;
    const manageUrl = `${appUrl}/dashboard/settings`;
    const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(to)}`;
    const yr = new Date().getFullYear();

    const todayDate = new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(new Date()).toUpperCase();

    /* ── Separate sections by format ─────────────────────────────── */
    const newsSection = sections.find((s) => s.format === "News Briefing");
    const opinionSection = sections.find((s) => s.format === "Opinion");
    const insightsSection = sections.find((s) => s.format === "Insights");
    const otherSections = sections.filter(
        (s) => s.format !== "News Briefing" && s.format !== "Opinion" && s.format !== "Insights"
    );

    /* ── Top Stories: 3-column numbered cards ────────────────────── */
    const categoryLabels = ["POLICY", "MARKET", "ENERGY SECURITY", "INDUSTRY", "RENEWABLES", "TECH"];
    let topStoriesHtml = "";
    if (newsSection && newsSection.items.length > 0) {
        const topItems = newsSection.items;

        const rowsHtml = [];
        for (let i = 0; i < topItems.length; i += 3) {
            const rowItems = topItems.slice(i, i + 3);
            const cols = rowItems.map((item, idx) => {
                return `<td class="story-col" width="33%" valign="top" style="padding:0 ${idx === 1 ? '8' : '0'}px; padding-bottom:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                        <tr><td style="position:relative;">
                            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="186" style="display:block;width:100%;height:140px;object-fit:cover;border-top-left-radius:12px;border-top-right-radius:12px;" />` : `<div style="width:100%;height:140px;background:#f3f4f6;border-top-left-radius:12px;border-top-right-radius:12px;"></div>`}
                        </td></tr>
                        <tr><td style="padding:16px;">
                            <p style="margin:0 0 12px;color:#111827;font-size:13px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
                            <a href="${item.href}" style="display:inline-block;padding:6px 12px;background-color:#0a6c4c;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;border-radius:4px;">Read more &rarr;</a>
                        </td></tr>
                    </table>
                </td>`;
            }).join("");

            let filler = "";
            if (rowItems.length < 3) {
                for (let f = rowItems.length; f < 3; f++) {
                    filler += `<td class="story-col" width="33%" valign="top" style="padding:0"></td>`;
                }
            }
            rowsHtml.push(`<tr>${cols}${filler}</tr>`);
        }

        topStoriesHtml = `
            <tr><td class="section-pad" style="padding:0 40px 16px;">
                <h3 style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:800;">Top Stories</h3>
                <table width="100%" cellpadding="0" cellspacing="0">${rowsHtml.join("")}</table>
                <div style="text-align:center;margin-top:16px;margin-bottom:16px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.energdive.com'}/news" style="display:inline-block;padding:12px 24px;background-color:#111827;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;">Check more</a>
                </div>
            </td></tr>`;
    }

    /* ── Opinion: 2-column with circular images ──────────────────── */
    let opinionHtml = "";
    if (opinionSection && opinionSection.items.length > 0) {
        const opItems = opinionSection.items.slice(0, 2);
        const opCols = opItems
            .map((item) => `<td class="opinion-col" width="50%" valign="top" style="padding:0 8px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="72" valign="top" style="padding-right:16px;">
                            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:12px;" />` : `<div style="width:72px;height:72px;background:#f3f4f6;border-radius:12px;"></div>`}
                        </td>
                        <td valign="top">
                            <p style="margin:0 0 10px;color:#111827;font-size:13px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
                            <a href="${item.href}" style="display:inline-block;padding:6px 12px;background-color:#0a6c4c;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;border-radius:4px;">Read more &rarr;</a>
                        </td>
                    </tr>
                </table>
            </td>`)
            .join("");

        opinionHtml = `
            <tr><td class="section-pad" style="padding:0 32px 32px;">
                <h3 style="margin:0 8px 20px;color:#111827;font-size:18px;font-weight:800;">Opinion</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f3f4f6;padding-bottom:32px;"><tr>${opCols}</tr></table>
            </td></tr>`;
    }

    /* ── Insights: full-width horizontal cards ────────────────────── */
    let insightsHtml = "";
    if (insightsSection && insightsSection.items.length > 0) {
        const insightCards = insightsSection.items
            .map((item) => {
                const badgeLabel = escapeHtml(item.badge).toUpperCase();
                return `<tr><td style="padding:0 0 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;overflow:hidden;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                        <tr>
                            ${item.imageUrl ? `<td class="insight-img" width="160" style="padding:0;"><img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="160" style="display:block;width:160px;height:120px;object-fit:cover;" /></td>` : ""}
                            <td class="insight-text" style="padding:16px 20px;" valign="middle">
                                <p style="margin:0 0 6px;color:#111827;font-size:14px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
                                <p style="margin:0 0 12px;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(item.crispLine)}</p>
                                <a href="${item.href}" style="display:inline-block;padding:6px 12px;background-color:#0a6c4c;color:#ffffff;font-size:11px;font-weight:700;text-decoration:none;border-radius:4px;">Read more &rarr;</a>
                            </td>
                        </tr>
                    </table>
                </td></tr>`;
            })
            .join("");

        insightsHtml = `
            <tr><td class="section-pad" style="padding:0 40px 32px;">
                <h3 style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:800;">Insights</h3>
                <table width="100%" cellpadding="0" cellspacing="0">${insightCards}</table>
            </td></tr>`;
    }

    /* ── Other sections: fallback list layout ─────────────────────── */
    const otherHtml = otherSections
        .map((section) => {
            const cards = section.items
                .map((item) => `<tr><td style="padding:0 0 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;overflow:hidden;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                        <tr>
                            ${item.imageUrl ? `<td class="other-img" width="140" style="padding:0;"><img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="140" style="display:block;width:140px;height:auto;object-fit:contain;" /></td>` : ""}
                            <td class="other-text" style="padding:16px 20px;" valign="middle">
                                <p style="margin:0 0 10px;color:#111827;font-size:14px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
                                <p style="margin:0 0 12px;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(item.crispLine)}</p>
                                <a href="${item.href}" style="display:inline-block;padding:6px 12px;background-color:#0a6c4c;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;border-radius:4px;">Read more &rarr;</a>
                            </td>
                        </tr>
                    </table>
                </td></tr>`)
                .join("");
            return `<tr><td class="section-pad" style="padding:0 40px 32px;">
                <h3 style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:800;">${escapeHtml(section.format)}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">${cards}</table>
            </td></tr>`;
        })
        .join("");

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <!--[if mso]><style>table{border-collapse:collapse;}td{border-collapse:collapse;}</style><![endif]-->
    <style type="text/css">
        /* Reset */
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        /* Responsive */
        @media only screen and (max-width: 640px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .stack-col { display: block !important; width: 100% !important; max-width: 100% !important; }
            .hero-text { padding: 28px 24px 16px 24px !important; }
            .hero-img { text-align: center !important; padding: 0 24px 20px !important; }
            .hero-img img { width: 80% !important; max-width: 280px !important; margin: 0 auto !important; }
            .section-pad { padding-left: 20px !important; padding-right: 20px !important; }
            .story-col { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
            .story-col table { width: 100% !important; }
            .opinion-col { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
            .insight-img { display: block !important; width: 100% !important; padding: 16px !important; box-sizing: border-box !important; }
            .insight-img img { width: 100% !important; height: auto !important; max-height: 180px !important; border-radius: 8px !important; }
            .insight-text { display: block !important; width: 100% !important; padding: 0 16px 16px !important; box-sizing: border-box !important; }
            .footer-left { display: block !important; width: 100% !important; text-align: center !important; padding-bottom: 20px !important; }
            .footer-left img { margin: 0 auto 12px !important; }
            .footer-left p { text-align: center !important; }
            .footer-left table { margin: 0 auto !important; }
            .footer-right { display: block !important; width: 100% !important; text-align: center !important; }
            .footer-right p { text-align: center !important; }
            .other-img { display: block !important; width: 100% !important; padding: 16px !important; box-sizing: border-box !important; }
            .other-img img { width: 100% !important; height: auto !important; max-height: 160px !important; border-radius: 8px !important; object-fit: contain !important; }
            .other-text { display: block !important; width: 100% !important; padding: 0 16px 16px !important; box-sizing: border-box !important; }
            h1 { font-size: 26px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 12px;">
        <tr><td align="center">
            <table class="email-container" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background-color:#ffffff;overflow:hidden;">

                <!-- ═══ HERO BANNER ═══ -->
                <tr><td style="background:#ffffff;padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td class="stack-col hero-text" valign="top" style="padding:40px 0 20px 40px;width:50%;">
                            <img src="${logoUrl}" alt="ENERGDIVE" width="220" style="display:block;max-width:220px;height:auto;margin-bottom:32px;" />
                            <h1 style="margin:0 0 12px;color:#0a6c4c;font-size:18px;font-weight:900;line-height:1.15;letter-spacing:-0.5px;">${displayFrequency} Briefing</h1>
                            <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.5;">Essential updates for a<br/>changing energy world.</p>
                            <p style="margin:0;color:#0a6c4c;font-size:12px;font-weight:800;letter-spacing:0.5px;">${todayDate}</p>
                        </td>
                        <td class="stack-col hero-img" valign="bottom" align="right" style="width:50%;padding:0;">
                            <img src="${bannerUrl}" alt="Energy Banner" width="300" style="display:block;width:100%;max-width:320px;height:auto;" />
                        </td>
                    </tr></table>
                </td></tr>

                <!-- ═══ SPACING ═══ -->
                <tr><td style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>

                <!-- ═══ TOP STORIES ═══ -->
                ${topStoriesHtml}

                <!-- ═══ OPINION ═══ -->
                ${opinionHtml}

                <!-- ═══ INSIGHTS ═══ -->
                ${insightsHtml}

                <!-- ═══ OTHER SECTIONS ═══ -->
                ${otherHtml}

                <!-- ═══ FOOTER ═══ -->
                <tr><td style="background:#ffffff;padding:24px 40px 40px;" class="section-pad">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #f3f4f6;padding-top:32px;">
                        ${sponsor ? `
                        <!-- SPONSOR BANNER -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border:1px solid #f3f4f6;border-radius:12px;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.02);overflow:hidden;">
                            <tr><td style="padding:8px 16px;border-bottom:1px solid #f3f4f6;">
                                <p style="margin:0;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Sponsored</p>
                            </td></tr>
                            <tr><td style="padding:0;">
                                <a href="${sponsor.targetUrl}" target="_blank" style="display:block;">
                                    <img src="${sponsor.imageUrl}" alt="Sponsor Banner" style="display:block;width:100%;max-width:100%;height:auto;" />
                                </a>
                            </td></tr>
                        </table>
                        ` : ""}
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td class="footer-left" valign="top" style="width:60%;">
                                    <img src="${logoUrl}" alt="ENERGDIVE" width="140" style="display:block;max-width:140px;height:auto;margin-bottom:12px;" />
                                    <p style="margin:0 0 16px;color:#6b7280;font-size:11px;line-height:1.6;">Your daily update on energy, markets<br/>and policy that matters.</p>
                                    <table cellpadding="0" cellspacing="0"><tr>
                                        <td style="padding-right:8px;"><a href="${appUrl}" style="display:inline-block;width:24px;height:24px;background:#0a6c4c;border-radius:50%;color:#ffffff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;font-family:sans-serif;font-weight:bold;">in</a></td>
                                        <td style="padding-right:8px;"><a href="${appUrl}" style="display:inline-block;width:24px;height:24px;background:#0a6c4c;border-radius:50%;color:#ffffff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;font-family:sans-serif;font-weight:bold;">X</a></td>
                                        <td><a href="${appUrl}" style="display:inline-block;width:24px;height:24px;background:#0a6c4c;border-radius:50%;color:#ffffff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;font-family:sans-serif;font-weight:bold;">W</a></td>
                                    </tr></table>
                                </td>
                                <td class="footer-right" valign="bottom" align="right" style="width:40%;">
                                    <p style="margin:0 0 12px;color:#6b7280;font-size:11px;">
                                        <a href="${manageUrl}" style="color:#6b7280;text-decoration:underline;">Manage Preferences</a>
                                        &nbsp;|&nbsp;
                                        <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                                    </p>
                                    <p style="margin:0;color:#6b7280;font-size:11px;">
                                        &copy; ${yr} ENERGDIVE. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td></tr></table>
                </td></tr>

            </table>
        </td></tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to,
        toName: firstName,
        subject,
        htmlContent,
        sender: {
            email: DIGEST_FROM_EMAIL,
            name: DIGEST_FROM_NAME,
        },
        tags: ["preference-digest", `digest-${frequency.toLowerCase()}`],
    });
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
    const subject = "Verify your ENERGClub membership";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F19;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          <tr>
            <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
              ${logoUrl
            ? `<img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />`
            : `<h1 style="color:#ffffff;margin:0;font-size:24px;">ENERGDIVE</h1>`
        }
            </td>
          </tr>
          <tr>
            <td style="padding:48px 40px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Hi ${name},</h2>
              <p style="margin:0 0 20px;color:#4B5563;font-size:16px;line-height:1.7;">
                Please confirm your email to continue your ENERGClub membership setup.
              </p>
              <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;color:#111827;font-size:14px;font-weight:700;">Step 1 of 2</p>
                <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.7;">
                  Click the secure link below. We will then send a 4-digit verification code to complete your sign-up.
                </p>
              </div>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${magicLink}" style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;box-shadow:0 4px 12px rgba(9,182,151,0.3);">
                  Verify Email &rarr;
                </a>
              </div>
              <p style="margin:0 0 24px;color:#9CA3AF;font-size:13px;line-height:1.6;">
                This is a single-use verification link. If you did not request this, you can ignore this email.
              </p>
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:24px 0;" />
              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                Copy and paste this link into your browser:<br />
                <a href="${magicLink}" style="color:#09B697;text-decoration:underline;">${magicLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
              <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDive Intelligence</p>
              <p style="margin:0 0 12px;color:#9CA3AF;font-size:12px;">
                <a href="https://www.energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
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
    const subject = "Your ENERGClub verification code";
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
              Here is your <strong>one-time verification code</strong> to complete your ENERGClub membership:
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
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDive Intelligence</p>
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
    const subject = `Welcome to ENERGClub — Your Membership ID: ${membershipId}`;
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
            <h2 style="margin:0 0 8px;color:#111827;font-size:28px;font-weight:900;">Welcome to ENERGClub, ${name}! 🎉</h2>
            <p style="margin:0 0 32px;color:#4B5563;font-size:16px;line-height:1.7;">
              Your membership has been verified. Here is your official ENERGClub Membership ID:
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
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDive Intelligence</p>
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

export async function sendMembershipWelcomeCardEmail(
    to: string,
    name: string,
    membershipId: string,
    details: MembershipWelcomeEmailDetails = {}
): Promise<void> {
    const subject = `Welcome to ENERGClub — Your Membership ID: ${membershipId}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/energclub.png`;
    const supportEmail = process.env.SUPPORT_EMAIL || "info@energdive.com";
    const memberName = escapeHtml(name.trim() || "Member");
    const company = escapeHtml((details.company || "Not provided").trim());
    const community = escapeHtml((details.community || "Member Community").trim());
    const safeMembershipId = escapeHtml(membershipId);
    const joinDate = formatMembershipDate(details.joinedAt);
    const dashboardUrl = details.accessToken
        ? `${appUrl}/membership-access?token=${encodeURIComponent(details.accessToken)}`
        : `${appUrl}/dashboard`;
    // ── QR Code generation ──────────────────────────────────────────
    // QR encodes the Membership ID for quick identity verification.
    // Email clients block base64 data: URIs → use public QR API for email.
    // PDF uses locally generated data URI (works fine in PDFs).

    const qrData = safeMembershipId;

    // Public QR URL for email HTML
    const qrPublicUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(qrData)}`;

    // Local data URI for PDF
    let qrDataUri: string | null = null;
    try {
        const QRCode = await import("qrcode");
        qrDataUri = await QRCode.toDataURL(qrData, {
            type: "image/png",
            errorCorrectionLevel: "M",
            margin: 1,
            width: 360,
            color: { dark: "#111111", light: "#FFFFFF" },
        });
    } catch (qrErr) {
        console.error("[EMAIL] QR generation failed (non-fatal):", qrErr);
    }

    const qrBlock = `<img src="${qrPublicUrl}" alt="Membership QR" width="160" height="160" style="display:block;width:160px;height:160px;border:0;" />`;

    const htmlContent = buildMembershipCardHtml({
        memberName,
        company,
        community,
        membershipId: safeMembershipId,
        joinDate,
        qrBlock,
        dashboardUrl,
        logoUrl,
        supportEmail,
        appUrl,
        toEmail: to,
        subject,
    });

    // Generate PDF attachment
    let attachment: { name: string; content: string }[] | undefined;
    try {
        const pdfBase64 = await generateMembershipCardPdf({
            memberName,
            company,
            community,
            membershipId: safeMembershipId,
            joinDate,
            qrImageUrl: qrDataUri,
        });
        attachment = [
            {
                name: `EnergClub-Membership-${safeMembershipId}.pdf`,
                content: pdfBase64,
            },
        ];
        console.log(`[EMAIL] PDF membership card generated for ${safeMembershipId}`);
    } catch (pdfErr) {
        // Non-fatal — send email without PDF if generation fails
        console.error("[EMAIL] PDF generation failed (sending email without attachment):", pdfErr);
    }

    await sendEmail({ to, toName: name, subject, htmlContent, attachment });
}

export async function sendApplicationViewedEmail(
    payload: EnergJobApplicationEmailPayload
): Promise<void> {
    const subject = `Your application has been viewed — ${payload.jobTitle}`;
    const logoUrl = getEnergdiveLogoUrl();
    const yr = new Date().getFullYear();

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <!--[if mso]><style>table{border-collapse:collapse;}td{border-collapse:collapse;}</style><![endif]-->
    <style type="text/css">
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        @media only screen and (max-width: 640px) {
            .email-wrap { width: 100% !important; }
            .content-pad { padding: 28px 20px !important; }
            .header-pad { padding: 24px 20px !important; }
            .footer-pad { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 16px;">
        <tr>
            <td align="center">
                <table class="email-wrap" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- LOGO HEADER -->
                    <tr>
                        <td class="header-pad" style="padding:28px 40px;background:#ffffff;border-bottom:1px solid #e8ecf1;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <img src="${logoUrl}" alt="ENERGDIVE" width="160" style="display:block;max-width:160px;height:auto;" />
                                    </td>
                                    <td align="right" style="color:#6b7280;font-size:12px;font-weight:600;">
                                        EnergJob Update
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- BANNER -->
                    <tr>
                        <td style="padding:0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #09B697 0%, #0d463d 100%);">
                                <tr>
                                    <td class="content-pad" style="padding:40px;text-align:center;">
                                        <div style="font-size:48px;line-height:1;margin-bottom:16px;">👁️</div>
                                        <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.3px;">Application Viewed</h1>
                                        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;line-height:1.5;">Good news! The recruiter has opened your profile</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- GREETING -->
                    <tr>
                        <td class="content-pad" style="padding:32px 40px 0;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:18px;font-weight:700;">Hi ${escapeHtml(payload.applicantName)},</p>
                            <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
                                We are pleased to inform you that the hiring team at <strong>${escapeHtml(payload.companyName)}</strong> has viewed your application for the position of <strong style="color:#091d3a;">${escapeHtml(payload.jobTitle)}</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- INFO CARD -->
                    <tr>
                        <td class="content-pad" style="padding:24px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;background-color:#fafcfb;padding:20px 24px;">
                                <tr>
                                    <td>
                                        <p style="margin:0 0 4px;color:#09B697;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Job Title</p>
                                        <h3 style="margin:0 0 12px;color:#091d3a;font-size:16px;font-weight:800;">${escapeHtml(payload.jobTitle)}</h3>
                                        <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Company</p>
                                        <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${escapeHtml(payload.companyName)}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- TIPS / WHAT'S NEXT -->
                    <tr>
                        <td class="content-pad" style="padding:0 40px 32px;">
                            <p style="margin:0 0 12px;color:#091d3a;font-size:15px;font-weight:700;">What does this mean?</p>
                            <p style="margin:0 0 16px;color:#4b5563;font-size:13px;line-height:1.6;">
                                The recruiter has reviewed your resume and profile details. If they find your qualifications fit their requirements, they will reach out to you directly or update your status to shortlist.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin:0;">
                                <tr>
                                    <td align="center" style="border-radius:8px;background:#09B697;">
                                        <a href="${payload.jobUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View Job Details &rarr;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- DIVIDER -->
                    <tr>
                        <td style="padding:0 40px;">
                            <div style="border-top:1px solid #e8ecf1;"></div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td class="footer-pad" style="padding:24px 40px 32px;text-align:center;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:13px;font-weight:700;">ENERGDIVE</p>
                            <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;line-height:1.5;">India's leading energy intelligence platform</p>
                            <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${yr} ENERGDIVE. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to: payload.applicantEmail,
        toName: payload.applicantName,
        subject,
        htmlContent,
        tags: ["energjob", "application", "status-update", "viewed"],
    });
}

export async function sendApplicationShortlistedEmail(
    payload: EnergJobApplicationEmailPayload
): Promise<void> {
    const subject = `Congratulations! You've been shortlisted — ${payload.jobTitle}`;
    const logoUrl = getEnergdiveLogoUrl();
    const yr = new Date().getFullYear();

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <!--[if mso]><style>table{border-collapse:collapse;}td{border-collapse:collapse;}</style><![endif]-->
    <style type="text/css">
        body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        @media only screen and (max-width: 640px) {
            .email-wrap { width: 100% !important; }
            .content-pad { padding: 28px 20px !important; }
            .header-pad { padding: 24px 20px !important; }
            .footer-pad { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:32px 16px;">
        <tr>
            <td align="center">
                <table class="email-wrap" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    
                    <!-- LOGO HEADER -->
                    <tr>
                        <td class="header-pad" style="padding:28px 40px;background:#ffffff;border-bottom:1px solid #e8ecf1;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <img src="${logoUrl}" alt="ENERGDIVE" width="160" style="display:block;max-width:160px;height:auto;" />
                                    </td>
                                    <td align="right" style="color:#6b7280;font-size:12px;font-weight:600;">
                                        EnergJob Status
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- BANNER -->
                    <tr>
                        <td style="padding:0;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #10b981 0%, #064e3b 100%);">
                                <tr>
                                    <td class="content-pad" style="padding:40px;text-align:center;">
                                        <div style="font-size:48px;line-height:1;margin-bottom:16px;">🎉</div>
                                        <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.3px;">Congratulations!</h1>
                                        <p style="margin:0;color:rgba(255,255,255,0.9);font-size:14px;line-height:1.5;">You've been shortlisted by the recruiter</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- GREETING -->
                    <tr>
                        <td class="content-pad" style="padding:32px 40px 0;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:18px;font-weight:700;">Dear ${escapeHtml(payload.applicantName)},</p>
                            <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
                                Great news! The hiring team at <strong>${escapeHtml(payload.companyName)}</strong> has reviewed your application and <strong>shortlisted</strong> you for the role of <strong style="color:#091d3a;">${escapeHtml(payload.jobTitle)}</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- INFO CARD -->
                    <tr>
                        <td class="content-pad" style="padding:24px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;background-color:#f0fdf4;padding:20px 24px;">
                                <tr>
                                    <td>
                                        <p style="margin:0 0 4px;color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Role Shortlisted</p>
                                        <h3 style="margin:0 0 12px;color:#091d3a;font-size:16px;font-weight:800;">${escapeHtml(payload.jobTitle)}</h3>
                                        <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;">Company</p>
                                        <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${escapeHtml(payload.companyName)}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- WHAT'S NEXT -->
                    <tr>
                        <td class="content-pad" style="padding:0 40px 32px;">
                            <p style="margin:0 0 12px;color:#091d3a;font-size:15px;font-weight:700;">What's next?</p>
                            <p style="margin:0 0 16px;color:#4b5563;font-size:13px;line-height:1.6;">
                                The recruiter will contact you shortly via email or phone to discuss the interview schedule and further assessment steps. Please keep your phone reachable and check your emails regularly.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin:0;">
                                <tr>
                                    <td align="center" style="border-radius:8px;background:#10b981;">
                                        <a href="${payload.jobUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">View Job Details &rarr;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- DIVIDER -->
                    <tr>
                        <td style="padding:0 40px;">
                            <div style="border-top:1px solid #e8ecf1;"></div>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td class="footer-pad" style="padding:24px 40px 32px;text-align:center;">
                            <p style="margin:0 0 6px;color:#091d3a;font-size:13px;font-weight:700;">ENERGDIVE</p>
                            <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;line-height:1.5;">India's leading energy intelligence platform</p>
                            <p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${yr} ENERGDIVE. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to: payload.applicantEmail,
        toName: payload.applicantName,
        subject,
        htmlContent,
        tags: ["energjob", "application", "status-update", "shortlisted"],
    });
}

export async function sendAbstractAcceptedEmail(
    email: string,
    name: string,
    title: string
): Promise<void> {
    const subject = `Your abstract submission has been accepted! — ${title}`;
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
                        <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
                            <img src="${logoUrl}" alt="EnergDive Logo" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:48px 40px;">
                            <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                                Congratulations, ${escapeHtml(name)}! 🎉
                            </h2>
                            <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
                                We are pleased to inform you that your abstract submission titled <strong style="color:#111827;">"${escapeHtml(title)}"</strong> has been accepted.
                            </p>
                            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;">
                                <p style="margin:0 0 8px;color:#111827;font-size:14px;font-weight:700;">What happens next?</p>
                                <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.7;">
                                    Our editorial/review board will reach out to you with details regarding presentation schedules, formatting guidelines, and next steps for the conference or publication.
                                </p>
                            </div>
                            <div style="text-align:center;margin-bottom:24px;">
                                <a href="${appUrl}/dashboard" style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;box-shadow:0 4px 12px rgba(9,182,151,0.3);">
                                    Go to Dashboard &rarr;
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDIVE Intelligence</p>
                            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    await sendEmail({
        to: email,
        toName: name,
        subject,
        htmlContent,
    });
}

