import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const DAILY_SIGNUP_REPORT_RECIPIENTS = [
    "kunal@itenmedia.in",
    "utkarsh@encis.in",
    "sankalp@itenmedia.in",
] as const;

export const DAILY_SIGNUP_REPORT_TEST_RECIPIENT = "utkarsh@encis.in";

interface SignupReportUser {
    name: string;
    designation: string | null;
    company: string | null;
    community: string | null;
    fullySignedUp: boolean;
}

export interface DailySignupReportResult {
    totalUsers: number;
    fullySignedUp: number;
    partiallySignedUp: number;
    reportDate: string;
}

function escapeHtml(value: string | null | undefined): string {
    return (value || "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getSignupReportWindow(now = new Date()) {
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const year = istNow.getUTCFullYear();
    const month = istNow.getUTCMonth();
    const day = istNow.getUTCDate();

    return {
        start: new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MS),
        // The report is fixed at 6 PM IST even if the web timer runs a few
        // minutes later, so it cannot include registrations after the cutoff.
        cutoff: new Date(Date.UTC(year, month, day, 18, 0, 0) - IST_OFFSET_MS),
        reportDate: new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Kolkata",
        }).format(now),
    };
}

async function loadSignupReportUsers(start: Date, cutoff: Date): Promise<SignupReportUser[]> {
    const result = await query<{
        name: string;
        designation: string | null;
        company: string | null;
        community: string | null;
        fully_signed_up: boolean;
        registered_at: Date;
    }>(
        `WITH portal_users AS (
            SELECT
                COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email) AS name,
                NULLIF(BTRIM(u.job_title), '') AS designation,
                NULLIF(BTRIM(u.organization), '') AS company,
                NULLIF(BTRIM(STRING_AGG(DISTINCT c.name, ', ')), '') AS community,
                COALESCE(u.onboarding_completed, false) AS fully_signed_up,
                u.created_at AS registered_at
            FROM users u
            LEFT JOIN user_communities uc ON uc.user_id = u.id
            LEFT JOIN communities c ON c.id = uc.community_id
            WHERE u.created_at >= $1
              AND u.created_at < $2
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.job_title, u.organization, u.onboarding_completed, u.created_at
        ), pending_signups AS (
            SELECT
                COALESCE(NULLIF(BTRIM(pv.name), ''), pv.email) AS name,
                NULLIF(BTRIM(pv.job_title), '') AS designation,
                NULLIF(BTRIM(pv.company), '') AS company,
                COALESCE(
                    NULLIF(BTRIM(pv.community_portal), ''),
                    NULLIF((
                        SELECT STRING_AGG(community.value, ', ' ORDER BY community.value)
                        FROM JSONB_ARRAY_ELEMENTS_TEXT(COALESCE(pv.communities, '[]'::jsonb)) AS community(value)
                    ), '')
                ) AS community,
                false AS fully_signed_up,
                pv.created_at AS registered_at
            FROM pending_verifications pv
            WHERE pv.created_at >= $1
              AND pv.created_at < $2
              -- A verified portal user has the richer canonical record above.
              AND NOT EXISTS (
                  SELECT 1
                  FROM users u
                  WHERE LOWER(u.email) = LOWER(pv.email)
              )
        )
        SELECT name, designation, company, community, fully_signed_up, registered_at
        FROM portal_users
        UNION ALL
        SELECT name, designation, company, community, fully_signed_up, registered_at
        FROM pending_signups
        ORDER BY registered_at ASC`,
        [start, cutoff]
    );

    return result.rows.map((row) => ({
        name: row.name,
        designation: row.designation,
        company: row.company,
        community: row.community,
        fullySignedUp: row.fully_signed_up,
    }));
}

function buildDailySignupReportHtml(reportDate: string, users: SignupReportUser[]): string {
    const fullySignedUp = users.filter((user) => user.fullySignedUp).length;
    const partiallySignedUp = users.length - fullySignedUp;
    const registrationRows = users.map((user) => `<tr>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;">${escapeHtml(user.name)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#475467;font-size:13px;">${escapeHtml(user.designation)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#475467;font-size:13px;">${escapeHtml(user.company)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#475467;font-size:13px;">${escapeHtml(user.community)}</td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:${user.fullySignedUp ? "#087a66" : "#b54708"};font-size:13px;font-weight:700;">${user.fullySignedUp ? "Fully Signed Up" : "Partially Signed Up"}</td>
    </tr>`).join("");

    const registrationsBlock = users.length > 0
        ? `<h2 style="margin:28px 0 12px;color:#101828;font-size:18px;line-height:1.3;">New User Registrations</h2>
           <div style="overflow-x:auto;">
             <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;border-spacing:0;min-width:620px;">
                 <tr style="background:#f8fafc;">
                     <th align="left" style="padding:12px;border-bottom:1px solid #e5e7eb;color:#344054;font-size:12px;">Name</th>
                     <th align="left" style="padding:12px;border-bottom:1px solid #e5e7eb;color:#344054;font-size:12px;">Designation</th>
                     <th align="left" style="padding:12px;border-bottom:1px solid #e5e7eb;color:#344054;font-size:12px;">Company</th>
                     <th align="left" style="padding:12px;border-bottom:1px solid #e5e7eb;color:#344054;font-size:12px;">Community</th>
                     <th align="left" style="padding:12px;border-bottom:1px solid #e5e7eb;color:#344054;font-size:12px;">Signup Status</th>
                 </tr>
                 ${registrationRows}
             </table>
           </div>`
        : `<p style="margin:28px 0 0;padding:16px;background:#f8fafc;border-left:4px solid #0b6b55;color:#475467;font-size:14px;line-height:1.5;">No new user registrations were recorded today.</p>`;

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>ENERGDIVE Daily User Signup Report</title></head>
<body style="margin:0;padding:0;background:#f3f5f4;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f5f4;"><tr><td align="center" style="padding:24px 12px;">
        <table width="760" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:760px;background:#ffffff;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:28px 32px 24px;border-bottom:4px solid #0b6b55;">
                <p style="margin:0 0 16px;color:#101828;font-size:15px;line-height:1.5;">Hi Team,</p>
                <p style="margin:0;color:#475467;font-size:14px;line-height:1.6;">I hope you&apos;re doing well.</p>
                <p style="margin:14px 0 0;color:#475467;font-size:14px;line-height:1.6;">Please find below the <strong style="color:#101828;">ENERGDIVE Daily User Signup Report</strong> for <strong style="color:#101828;">${escapeHtml(reportDate)}</strong> (till <strong style="color:#101828;">6:00 PM</strong>).</p>
            </td></tr>
            <tr><td style="padding:28px 32px 32px;">
                <h1 style="margin:0 0 14px;color:#101828;font-size:20px;line-height:1.3;">Today&apos;s Summary</h1>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
                    <td width="33.33%" style="padding:0 6px 0 0;"><div style="padding:14px;background:#edf7f2;border-radius:8px;"><p style="margin:0 0 5px;color:#087a66;font-size:11px;font-weight:700;text-transform:uppercase;">Total New Users</p><p style="margin:0;color:#101828;font-size:24px;font-weight:800;">${users.length}</p></div></td>
                    <td width="33.33%" style="padding:0 3px;"><div style="padding:14px;background:#f0f9ff;border-radius:8px;"><p style="margin:0 0 5px;color:#026aa2;font-size:11px;font-weight:700;text-transform:uppercase;">Fully Signed Up</p><p style="margin:0;color:#101828;font-size:24px;font-weight:800;">${fullySignedUp}</p></div></td>
                    <td width="33.33%" style="padding:0 0 0 6px;"><div style="padding:14px;background:#fff7ed;border-radius:8px;"><p style="margin:0 0 5px;color:#b54708;font-size:11px;font-weight:700;text-transform:uppercase;">Partially Signed Up</p><p style="margin:0;color:#101828;font-size:24px;font-weight:800;">${partiallySignedUp}</p></div></td>
                </tr></table>
                ${registrationsBlock}
                <p style="margin:28px 0 0;color:#475467;font-size:14px;line-height:1.5;">Regards,<br /><strong style="color:#101828;">ENERGDIVE Automation</strong></p>
            </td></tr>
        </table>
    </td></tr></table>
</body>
</html>`;
}

export async function sendDailySignupReport(
    recipients: readonly string[] = DAILY_SIGNUP_REPORT_RECIPIENTS,
    now = new Date()
): Promise<DailySignupReportResult> {
    const { start, cutoff, reportDate } = getSignupReportWindow(now);
    const users = await loadSignupReportUsers(start, cutoff);
    const fullySignedUp = users.filter((user) => user.fullySignedUp).length;
    const htmlContent = buildDailySignupReportHtml(reportDate, users);
    const subject = `ENERGDIVE Daily User Signup Report – ${reportDate}`;

    for (const recipient of recipients) {
        await sendEmail({
            to: recipient,
            subject,
            htmlContent,
            sender: {
                email: process.env.FROM_EMAIL || "no-reply@info.energdive.com",
                name: "ENERGDIVE Automation",
            },
            tags: ["daily-user-signup-report"],
        });
    }

    return {
        totalUsers: users.length,
        fullySignedUp,
        partiallySignedUp: users.length - fullySignedUp,
        reportDate,
    };
}

export async function sendTestDailySignupReport(): Promise<DailySignupReportResult> {
    return sendDailySignupReport([DAILY_SIGNUP_REPORT_TEST_RECIPIENT]);
}
