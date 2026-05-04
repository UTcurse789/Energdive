/**
 * Abandoned cart drip email templates.
 *
 * For CRM leads in `pending_verifications` table who signed up via Zoho
 * but never completed portal login.
 *
 * 5-step drip sequence:
 *   Step 1: 1 hr     — Friendly reminder
 *   Step 2: 4 hrs    — "Just 30 sec left"
 *   Step 3: Next day 10:30 AM IST — Benefits explain
 *   Step 4: Day 3    11:00 AM IST — Social proof
 *   Step 5: Day 6    11:00 AM IST — Urgency
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "ENERGDIVE";

export interface DripEmailParams {
    to: string;
    name: string;
    magicLink: string;
    declineLink: string;
    step: number; // 1-5
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
            <img src="${logoUrl}" alt="EnergDive" width="180" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:48px 40px;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #F3F4F6;">
            <p style="margin:0 0 8px;color:#111827;font-size:13px;font-weight:700;">EnergDive Intelligence</p>
            <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;">
              <a href="https://www.energdive.com/unsubscribe?email=${encodeURIComponent(to)}" style="color:#9CA3AF;text-decoration:underline;">Unsubscribe</a>
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

function declineSection(link: string): string {
    return `<div style="margin-top:32px;padding-top:24px;border-top:1px solid #F3F4F6;text-align:center;">
      <a href="${link}" style="display:inline-block;background:#F3F4F6;color:#6B7280;font-size:13px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;border:1px solid #E5E7EB;">
        I do not want to proceed with free ENERGClub membership
      </a>
    </div>`;
}

// ── Step 1: Friendly Reminder (1 hr) ─────────────────────────────────────────
function step1(name: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Hi ${name},</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Thanks for signing up with <strong>ENERGClub</strong>! Your free membership portal is ready — just click below to complete your setup.
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#6B7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Complete Your Setup</p>
        ${ctaButton("Access Your Portal &rarr;", magicLink)}
        <p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;">Secure link — no password needed</p>
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
        It only takes a few seconds to verify and start exploring.
      </p>
      ${declineSection(declineLink)}`;
}

// ── Step 2: "Just 30 sec left" (4 hrs) ───────────────────────────────────────
function step2(name: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Just 30 seconds, ${name} ⏱️</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        You're <strong>almost there!</strong> Your ENERGClub membership is 90% complete — just one quick verification step left.
      </p>
      <div style="background:#0a2e1f;border-radius:16px;padding:36px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#09B697;font-size:48px;font-weight:900;">30 sec</p>
        <p style="margin:0 0 20px;color:#6B9E8C;font-size:14px;">That's all it takes to finish</p>
        ${ctaButton("Complete Verification &rarr;", magicLink)}
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;text-align:center;">
        Click the button. Verify your email. Done!
      </p>
      ${declineSection(declineLink)}`;
}

// ── Step 3: Benefits Explain (Next day 10:30 AM) ─────────────────────────────
function step3(name: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Here's what you're missing, ${name}</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Your ENERGClub membership unlocks some powerful benefits — all completely <strong>free</strong>:
      </p>
      <div style="background:#F0FDF9;border:1px solid #09B697;border-radius:12px;padding:28px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #D1FAE5;">
              <p style="margin:0;color:#065F46;font-size:15px;font-weight:600;">📊 Exclusive Research & Analysis</p>
              <p style="margin:4px 0 0;color:#4B5563;font-size:13px;">Deep dives into India's energy transition, policy shifts, and market trends</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #D1FAE5;">
              <p style="margin:0;color:#065F46;font-size:15px;font-weight:600;">🔔 Curated Sector Alerts</p>
              <p style="margin:4px 0 0;color:#4B5563;font-size:13px;">Stay ahead with alerts tailored to your industry — solar, wind, hydrogen, EV, and more</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #D1FAE5;">
              <p style="margin:0;color:#065F46;font-size:15px;font-weight:600;">👥 Professional Community</p>
              <p style="margin:4px 0 0;color:#4B5563;font-size:13px;">Connect with 500+ energy professionals across 12 communities</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <p style="margin:0;color:#065F46;font-size:15px;font-weight:600;">⚡ Early Access</p>
              <p style="margin:4px 0 0;color:#4B5563;font-size:13px;">Priority access to upcoming features, events, and reports</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        ${ctaButton("Unlock All Benefits &rarr;", magicLink)}
      </div>
      ${declineSection(declineLink)}`;
}

// ── Step 4: Social Proof (Day 3, 11 AM) ──────────────────────────────────────
function step4(name: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">${name}, you're in good company</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Over <strong>1000+ energy professionals</strong> from across India are already using ENERGClub to stay ahead. Here's what they value most:
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:24px;margin-bottom:24px;">
        <div style="border-left:4px solid #09B697;padding-left:16px;margin-bottom:20px;">
          <p style="margin:0;color:#374151;font-size:14px;font-style:italic;line-height:1.6;">
            "ENERGDIVE has become my go-to source for energy sector intelligence. The curated content saves me hours every week."
          </p>
          <p style="margin:8px 0 0;color:#9CA3AF;font-size:12px;font-weight:600;">— Energy sector professional</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="text-align:center;">
          <tr>
            <td style="padding:12px;">
              <p style="margin:0;color:#09B697;font-size:28px;font-weight:900;">1000+</p>
              <p style="margin:4px 0 0;color:#6B7280;font-size:11px;font-weight:600;">MEMBERS</p>
            </td>
            <td style="padding:12px;">
              <p style="margin:0;color:#09B697;font-size:28px;font-weight:900;">12</p>
              <p style="margin:4px 0 0;color:#6B7280;font-size:11px;font-weight:600;">COMMUNITIES</p>
            </td>
            <td style="padding:12px;">
              <p style="margin:0;color:#09B697;font-size:28px;font-weight:900;">100%</p>
              <p style="margin:4px 0 0;color:#6B7280;font-size:11px;font-weight:600;">FREE</p>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        ${ctaButton("Join the Community &rarr;", magicLink)}
      </div>
      ${declineSection(declineLink)}`;
}

// ── Step 5: Urgency (Day 6, 11 AM) ──────────────────────────────────────────
function step5(name: string, magicLink: string, declineLink: string): string {
    return `
      <h2 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">${name}, your access link is expiring soon</h2>
      <p style="margin:0 0 24px;color:#4B5563;font-size:16px;line-height:1.7;">
        Your free ENERGClub membership invitation won't be open forever. <strong>Complete your verification now</strong> before you lose access.
      </p>
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 8px;color:#991B1B;font-size:14px;font-weight:700;">⏰ Don't let your invitation expire</p>
        <p style="margin:0;color:#7F1D1D;font-size:13px;line-height:1.6;">
          Your portal access has been reserved but needs verification to stay active.
        </p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        ${ctaButton("Verify Now — Keep My Access &rarr;", magicLink)}
      </div>
      <p style="margin:0;color:#6B7280;font-size:14px;text-align:center;line-height:1.6;">
        It takes just 30 seconds. Click → Verify → You're in.
      </p>
      ${declineSection(declineLink)}`;
}


// ── Public API ───────────────────────────────────────────────────────────────

const SUBJECTS: Record<number, string> = {
    1: "Your ENERGClub access is ready",
    2: "30 seconds to activate your membership",
    3: "Here's what you're missing at ENERGClub",
    4: "500+ professionals already joined ENERGClub",
    5: "Your ENERGClub access link is expiring soon",
};

const TEMPLATES: Record<number, (name: string, magicLink: string, declineLink: string) => string> = {
    1: step1,
    2: step2,
    3: step3,
    4: step4,
    5: step5,
};

export async function sendDripEmail(params: DripEmailParams): Promise<void> {
    if (!BREVO_API_KEY) {
        console.error("[DRIP] BREVO_API_KEY not set — skipping");
        return;
    }

    const step = params.step;
    if (step < 1 || step > 5) {
        console.error(`[DRIP] Invalid step: ${step}`);
        return;
    }

    const subject = SUBJECTS[step];
    const bodyContent = TEMPLATES[step](params.name, params.magicLink, params.declineLink);
    const htmlContent = emailWrapper(subject, bodyContent, params.to);

    const body = {
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: params.to, name: params.name || params.to }],
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

    console.log(`[DRIP] Sent step ${step} to ${params.to}`);
}

// ── Drip Schedule Calculator ─────────────────────────────────────────────────

/**
 * Calculate the next send time for a given drip step.
 * All times are in IST (Asia/Kolkata).
 *
 * Step 1: drip_started_at + 1 hr
 * Step 2: drip_started_at + 4 hrs
 * Step 3: Next day at 10:30 AM IST
 * Step 4: Day 3 at 11:00 AM IST
 * Step 5: Day 6 at 11:00 AM IST
 */
export function calculateNextDripSend(dripStartedAt: Date, currentStep: number): Date | null {
    if (currentStep >= 5) return null; // drip complete

    const nextStep = currentStep + 1;
    const startMs = dripStartedAt.getTime();

    // Helper: create a date at a specific IST time, N days after start
    const istDate = (daysAfter: number, hour: number, minute: number): Date => {
        // Get the start date in IST
        const startInIST = new Date(startMs);
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const startUTC = startInIST.getTime();
        const startIST = new Date(startUTC + istOffset);

        // Set to midnight IST of start day + daysAfter
        const targetIST = new Date(startIST);
        targetIST.setUTCDate(targetIST.getUTCDate() + daysAfter);
        targetIST.setUTCHours(hour, minute, 0, 0);

        // Convert back to UTC
        return new Date(targetIST.getTime() - istOffset);
    };

    switch (nextStep) {
        case 1:
            return new Date(startMs + 1 * 60 * 60 * 1000); // +1 hr
        case 2:
            return new Date(startMs + 4 * 60 * 60 * 1000); // +4 hrs
        case 3:
            return istDate(1, 10, 30); // Next day 10:30 AM IST
        case 4:
            return istDate(3, 11, 0);  // Day 3 11:00 AM IST
        case 5:
            return istDate(6, 11, 0);  // Day 6 11:00 AM IST
        default:
            return null;
    }
}
