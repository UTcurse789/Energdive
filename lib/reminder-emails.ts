/**
 * Verification reminder email templates.
 *
 * For users in `users` table with verification_status = 'pending_verification'.
 * Sends up to 4 total reminder emails, then stops permanently unless data is reset manually.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "ENERGDIVE";
const REMINDER_TIME_ZONE = "Asia/Kolkata";
const REMINDER_START_MINUTES = 6 * 60; // 6:00 AM IST
const REMINDER_END_MINUTES = 19 * 60; // 7:00 PM IST

interface ReminderEmailParams {
    to: string;
    firstName: string;
    magicLink: string;
    declineLink: string;
    reminderNumber: number; // 1-4
}

interface ReminderSendWindowStatus {
    allowed: boolean;
    currentMinutes: number;
    localTimeLabel: string;
    timeZone: string;
    windowLabel: string;
}

function getReminderTimeParts(date: Date, timeZone: string): { hour: number; minute: number } {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || "0");
    const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");

    return { hour, minute };
}

export function getReminderSendWindowStatus(date: Date = new Date()): ReminderSendWindowStatus {
    const { hour, minute } = getReminderTimeParts(date, REMINDER_TIME_ZONE);
    const currentMinutes = (hour * 60) + minute;

    return {
        allowed: currentMinutes >= REMINDER_START_MINUTES && currentMinutes <= REMINDER_END_MINUTES,
        currentMinutes,
        localTimeLabel: new Intl.DateTimeFormat("en-IN", {
            timeZone: REMINDER_TIME_ZONE,
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }).format(date),
        timeZone: REMINDER_TIME_ZONE,
        windowLabel: "6:00 AM to 7:00 PM IST",
    };
}

export function isWithinReminderSendWindow(date: Date = new Date()): boolean {
    return getReminderSendWindowStatus(date).allowed;
}

function getLogoUrl(): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
    return `${appUrl}/logo2-removebg-preview.png`;
}

function emailWrapper(subject: string, bodyContent: string, to: string): string {
    const logoUrl = getLogoUrl();
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0B0F19;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F19;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <tr>
          <td style="background:#0a2e1f;padding:40px;text-align:center;border-bottom:4px solid #09B697;">
            <img src="${logoUrl}" alt="ENERGDIVE" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">ENERGDIVE Intelligence</p>
            <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;">
              <a href="https://energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
            </p>
            <p style="margin:0;color:#9CA3AF;font-size:11px;">&copy; ${new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, link: string): string {
    return `<a href="${link}" style="display:inline-block;background:#09B697;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;box-shadow:0 4px 12px rgba(9,182,151,0.3);">${text}</a>`;
}

function declineButton(link: string): string {
    return `<p style="margin:24px 0 0;text-align:center;">
      <a href="${link}" style="color:#9CA3AF;font-size:12px;text-decoration:underline;">I do not want to proceed with free ENERGClub membership</a>
    </p>`;
}

// ── Template 1: Friendly Nudge ───────────────────────────────────────────────
function reminder1(firstName: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Hi ${firstName},</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Your <strong>ENERGClub portal</strong> is waiting for you! You're just one click away from accessing exclusive energy intelligence and insights.
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#6B7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">One-Click Access</p>
        ${ctaButton("Access Your Portal &rarr;", magicLink)}
        <p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;">Secure link — no password needed</p>
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
        We noticed you haven't completed your portal setup yet. Click above to get started — it takes less than a minute.
      </p>
      ${declineButton(declineLink)}`;
}

// ── Template 2: Quick Access ─────────────────────────────────────────────────
function reminder2(firstName: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Just 30 seconds, ${firstName} ⏱️</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Your ENERGClub membership is ready — all you need to do is verify your account. It takes just <strong>30 seconds</strong>.
      </p>
      <div style="background:#0a2e1f;border-radius:16px;padding:36px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#09B697;font-size:14px;font-weight:700;">YOUR PORTAL IS READY</p>
        ${ctaButton("Activate Now &rarr;", magicLink)}
        <p style="margin:16px 0 0;color:#6B9E8C;font-size:13px;">One click. No password. Instant access.</p>
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
        Don't miss out on real-time energy sector intelligence curated just for you.
      </p>
      ${declineButton(declineLink)}`;
}

// ── Template 3: Benefits ─────────────────────────────────────────────────────
function reminder3(firstName: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Here's what you're missing, ${firstName}</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        As an <strong>ENERGClub member</strong>, you get access to benefits that help you stay ahead in the energy sector:
      </p>
      <div style="background:#F0FDF9;border:1px solid #09B697;border-radius:12px;padding:24px;margin-bottom:24px;">
        <ul style="margin:0;padding-left:20px;color:#4B5563;font-size:14px;line-height:2.2;">
          <li>📊 <strong>Exclusive research & analysis</strong> on India's energy transition</li>
          <li>🔔 <strong>Curated alerts</strong> tailored to your sector interests</li>
          <li>👥 <strong>Community access</strong> — connect with energy professionals</li>
          <li>📰 <strong>Premium content</strong> — deep dives, reports, and forecasts</li>
          <li>⚡ <strong>Early access</strong> to upcoming features and events</li>
        </ul>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        ${ctaButton("Claim Your Benefits &rarr;", magicLink)}
      </div>
      <p style="margin:0;color:#9CA3AF;font-size:13px;text-align:center;">
        All this is completely <strong>free</strong> for ENERGClub members.
      </p>
      ${declineButton(declineLink)}`;
}

// ── Template 4: Social Proof ─────────────────────────────────────────────────
function reminder4(firstName: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Join 500+ energy professionals, ${firstName}</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Hundreds of professionals across solar, wind, hydrogen, EV, and more have already joined ENERGClub. You're one step away.
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:center;gap:32px;text-align:center;">
          <div style="text-align:center;padding:8px 16px;">
            <p style="margin:0;color:#09B697;font-size:32px;font-weight:900;">500+</p>
            <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">Members</p>
          </div>
          <div style="text-align:center;padding:8px 16px;">
            <p style="margin:0;color:#09B697;font-size:32px;font-weight:900;">12</p>
            <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">Communities</p>
          </div>
          <div style="text-align:center;padding:8px 16px;">
            <p style="margin:0;color:#09B697;font-size:32px;font-weight:900;">Free</p>
            <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">Membership</p>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        ${ctaButton("Join the Community &rarr;", magicLink)}
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;text-align:center;line-height:1.6;">
        Don't get left behind. Complete your verification now.
      </p>
      ${declineButton(declineLink)}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

const SUBJECTS: Record<number, string> = {
    1: "Your ENERGClub portal is waiting 🔓",
    2: "Just 30 seconds to activate your membership ⏱️",
    3: "Here's what you're missing at ENERGClub",
    4: "500+ energy professionals already joined — you?",
};

const TEMPLATES: Record<number, (firstName: string, magicLink: string, declineLink: string) => string> = {
    1: reminder1,
    2: reminder2,
    3: reminder3,
    4: reminder4,
};

export async function sendReminderEmail(params: ReminderEmailParams): Promise<boolean> {
    if (!BREVO_API_KEY) {
        console.error("[REMINDER] BREVO_API_KEY not set — skipping");
        return false;
    }

    if (params.reminderNumber < 1 || params.reminderNumber > 4) {
        console.error(`[REMINDER] Invalid reminder number: ${params.reminderNumber}. Expected 1-4.`);
        return false;
    }

    const sendWindow = getReminderSendWindowStatus();
    if (!sendWindow.allowed) {
        console.log(
            `[REMINDER] Skipping ${params.to} outside send window. Current time: ${sendWindow.localTimeLabel} ${sendWindow.timeZone}. Allowed window: ${sendWindow.windowLabel}.`
        );
        return false;
    }

    const num = params.reminderNumber;
    const subject = SUBJECTS[num];
    const bodyContent = TEMPLATES[num](params.firstName, params.magicLink, params.declineLink);
    const htmlContent = emailWrapper(subject, bodyContent, params.to);

    const body = {
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: params.to, name: params.firstName || params.to }],
        subject,
        htmlContent,
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

    console.log(`[REMINDER] Sent reminder #${num} to ${params.to}`);
    return true;
}
