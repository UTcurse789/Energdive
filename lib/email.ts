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

interface AbstractAcceptedEmailInput {
    to: string;
    firstName?: string | null;
    paperTitle?: string | null;
    abstractUrl?: string | null;
    downloadUrl?: string | null;
}

export async function sendAbstractAcceptedEmail(
    input: AbstractAcceptedEmailInput
): Promise<void>;
export async function sendAbstractAcceptedEmail(
    to: string,
    firstName?: string | null,
    paperTitle?: string | null,
    abstractUrl?: string | null,
    downloadUrl?: string | null
): Promise<void>;
export async function sendAbstractAcceptedEmail(
    inputOrTo: AbstractAcceptedEmailInput | string,
    firstName?: string | null,
    paperTitle?: string | null,
    abstractUrl?: string | null,
    downloadUrl?: string | null
): Promise<void> {
    const input =
        typeof inputOrTo === "string"
            ? { to: inputOrTo, firstName, paperTitle, abstractUrl, downloadUrl }
            : inputOrTo;

    const to = input.to;
    const safeFirstName = escapeHtml((input.firstName || "Researcher").trim());
    const safePaperTitle = escapeHtml((input.paperTitle || "your paper").trim());
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    const logoUrl = `${appUrl}/logo2-removebg-preview.png`;
    const abstractHref = input.abstractUrl || appUrl;
    const downloadHref = input.downloadUrl || abstractHref;
    const subject = `Your ENERGDIVE abstract has been accepted`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F19;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    <tr>
                        <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
                            <img src="${logoUrl}" alt="ENERGDIVE" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:48px 40px;">
                            <h2 style="margin:0 0 16px;color:#111827;font-size:26px;font-weight:800;line-height:1.2;">
                                Hello ${safeFirstName},
                            </h2>
                            <p style="margin:0 0 20px;color:#4B5563;font-size:16px;line-height:1.7;">
                                Your abstract for <strong>${safePaperTitle}</strong> has been accepted for the ENERGDIVE Knowledge Base.
                            </p>
                            <p style="margin:0 0 28px;color:#4B5563;font-size:16px;line-height:1.7;">
                                The paper is now available to ENERGClub members through the research archive.
                            </p>
                            <div style="text-align:center;margin-bottom:28px;">
                                <a href="${downloadHref}" style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:15px 36px;border-radius:10px;">
                                    View Accepted Paper
                                </a>
                            </div>
                            <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                                If the button does not work, copy and paste this link:<br />
                                <a href="${downloadHref}" style="color:#09B697;text-decoration:underline;">${downloadHref}</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#F9FAFB;padding:28px 40px;text-align:center;border-top:1px solid #F3F4F6;">
                            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDIVE Knowledge Base</p>
                            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE.</p>
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
        toName: input.firstName || to,
        subject,
        htmlContent,
        tags: ["abstract-accepted"],
    });
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
