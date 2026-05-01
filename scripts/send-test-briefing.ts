/**
 * Quick script to send a test "Your ENERGDIVE Daily Briefing" email
 * via the Brevo transactional API.
 *
 * Usage:  npx tsx scripts/send-test-briefing.ts
 */

import "dotenv/config";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DIGEST_FROM_EMAIL =
  process.env.DIGEST_FROM_EMAIL || "insights@updates.energdive.com";
const DIGEST_FROM_NAME =
  process.env.DIGEST_FROM_NAME || "ENERGDIVE Intelligence";

const TO_EMAIL = "utkarsh@encis.in";
const TO_NAME = "Utkarsh";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDailyBriefingHtml(): { subject: string; html: string } {
  const displayFrequency = "Daily";
  const subject = `Your ENERGDIVE ${displayFrequency} Briefing`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
  const logoUrl = `${appUrl}/Energdive-Logo.png`;
  const bannerUrl = `${appUrl}/email-banner.jpg`;
  const manageUrl = `${appUrl}/dashboard/settings`;
  const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(TO_EMAIL)}`;
  const yr = new Date().getFullYear();

  const todayDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
    .format(new Date())
    .toUpperCase();

  /* ── Sample items ──────────────────────────────────────────────── */
  const sampleNews = [
    { title: "India's Solar Capacity Crosses 100 GW Milestone Amid Policy Push", href: `${appUrl}/news/india-solar-100gw`, crispLine: "India has officially surpassed 100 GW of installed solar capacity.", imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop", badge: "Renewables" },
    { title: "Global LNG Prices Drop as European Storage Hits Record Highs", href: `${appUrl}/news/lng-prices-drop`, crispLine: "European gas storage levels have reached unprecedented highs.", imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop", badge: "Market" },
    { title: "CERC Proposes New Grid Tariff Framework for Green Hydrogen", href: `${appUrl}/news/cerc-green-hydrogen`, crispLine: "CERC drafts new wheeling and banking regulations for green hydrogen.", imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop", badge: "Policy" },
  ];
  const sampleOpinion = [
    { title: "Why India's Energy Security Depends on Diversifying Beyond Oil", href: `${appUrl}/opinion/energy-security`, crispLine: "A strategic analysis of India's import dependency.", imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop", badge: "Opinion" },
    { title: "The Hidden Cost of Slow EV Charging Infrastructure Rollout", href: `${appUrl}/opinion/ev-charging`, crispLine: "How delays could slow India's electric mobility ambitions.", imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=300&fit=crop", badge: "Opinion" },
  ];
  const sampleInsights = [
    { title: "Battery Storage Economics: When Will Grid Parity Arrive?", href: `${appUrl}/insights/battery-storage`, crispLine: "A deep dive into lithium-ion cost curves and the timeline for storage reaching grid parity in India.", imageUrl: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&h=300&fit=crop", badge: "Analysis" },
    { title: "Carbon Markets 2026: What Traders Need to Know", href: `${appUrl}/insights/carbon-markets`, crispLine: "A comprehensive guide to the evolving landscape of voluntary and compliance carbon markets.", imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop", badge: "Research" },
  ];

  /* ── Top Stories ──────────────────────────────────────────────── */
  const categoryLabels = ["RENEWABLES", "MARKET", "POLICY"];
  const cols = sampleNews.map((item, i) => {
    const label = categoryLabels[i] || escapeHtml(item.badge).toUpperCase();
    return `<td class="story-col" width="33%" valign="top" style="padding:0 ${i === 1 ? "8" : "0"}px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.02);">
        <tr><td style="position:relative;">
          <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="186" style="display:block;width:100%;height:140px;object-fit:cover;border-top-left-radius:12px;border-top-right-radius:12px;" />
          <div style="position:absolute;top:12px;left:12px;width:24px;height:24px;background:#0a6c4c;color:#fff;font-size:11px;font-weight:800;line-height:24px;text-align:center;border-radius:50%;">0${i + 1}</div>
        </td></tr>
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px;color:#0a6c4c;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
          <p style="margin:0 0 12px;color:#111827;font-size:13px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
          <a href="${item.href}" style="color:#0a6c4c;font-size:12px;font-weight:700;text-decoration:none;">Read more &rarr;</a>
        </td></tr>
      </table>
    </td>`;
  }).join("");

  const topStoriesHtml = `<tr><td class="section-pad" style="padding:0 40px 32px;">
    <h3 style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:800;">Top Stories</h3>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>${cols}</tr></table>
  </td></tr>`;

  /* ── Opinion ─────────────────────────────────────────────────── */
  const opCols = sampleOpinion.map((item) => `<td class="opinion-col" width="50%" valign="top" style="padding:0 8px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="72" valign="top" style="padding-right:16px;">
        <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:12px;" />
      </td>
      <td valign="top">
        <p style="margin:0 0 10px;color:#111827;font-size:13px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
        <a href="${item.href}" style="color:#0a6c4c;font-size:12px;font-weight:700;text-decoration:none;">Read more &rarr;</a>
      </td>
    </tr></table>
  </td>`).join("");

  const opinionHtml = `<tr><td class="section-pad" style="padding:0 32px 32px;">
    <h3 style="margin:0 8px 20px;color:#111827;font-size:18px;font-weight:800;">Opinion</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f3f4f6;padding-bottom:32px;"><tr>${opCols}</tr></table>
  </td></tr>`;

  /* ── Insights ────────────────────────────────────────────────── */
  const insightCards = sampleInsights.map((item) => {
    const badgeLabel = escapeHtml(item.badge).toUpperCase();
    return `<tr><td style="padding:0 0 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;overflow:hidden;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.02);">
        <tr>
          <td class="insight-img" width="160" style="padding:0;"><img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" width="160" style="display:block;width:160px;height:120px;object-fit:cover;" /></td>
          <td class="insight-text" style="padding:16px 20px;" valign="middle">
            <p style="margin:0 0 6px;color:#0a6c4c;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">${badgeLabel}</p>
            <p style="margin:0 0 6px;color:#111827;font-size:14px;font-weight:700;line-height:1.4;"><a href="${item.href}" style="color:#111827;text-decoration:none;">${escapeHtml(item.title)}</a></p>
            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">${escapeHtml(item.crispLine)}</p>
          </td>
        </tr>
      </table>
    </td></tr>`;
  }).join("");

  const insightsHtml = `<tr><td class="section-pad" style="padding:0 40px 32px;">
    <h3 style="margin:0 0 20px;color:#111827;font-size:18px;font-weight:800;">Insights</h3>
    <table width="100%" cellpadding="0" cellspacing="0">${insightCards}</table>
  </td></tr>`;

  /* ── Full HTML ─────────────────────────────────────────────────── */
  const html = `<!DOCTYPE html>
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
            .email-container { width: 100% !important; max-width: 100% !important; }
            .stack-col { display: block !important; width: 100% !important; max-width: 100% !important; }
            .hero-text { padding: 28px 24px 16px 24px !important; }
            .hero-img { text-align: center !important; padding: 0 24px 20px !important; }
            .hero-img img { width: 80% !important; max-width: 280px !important; margin: 0 auto !important; }
            .section-pad { padding-left: 20px !important; padding-right: 20px !important; }
            .story-col { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
            .story-col table { width: 100% !important; }
            .opinion-col { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }
            .insight-img { display: block !important; width: 100% !important; }
            .insight-img img { width: 100% !important; height: 180px !important; }
            .insight-text { display: block !important; width: 100% !important; }
            .footer-left { display: block !important; width: 100% !important; text-align: center !important; padding-bottom: 20px !important; }
            .footer-left img { margin: 0 auto 12px !important; }
            .footer-left p { text-align: center !important; }
            .footer-left table { margin: 0 auto !important; }
            .footer-right { display: block !important; width: 100% !important; text-align: center !important; }
            .footer-right p { text-align: center !important; }
            h1 { font-size: 26px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 12px;">
        <tr><td align="center">
            <table class="email-container" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background-color:#ffffff;overflow:hidden;">

                <!-- HERO BANNER -->
                <tr><td style="background:#ffffff;padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr>
                        <td class="stack-col hero-text" valign="top" style="padding:40px 0 20px 40px;width:50%;">
                            <img src="${logoUrl}" alt="ENERGDIVE" width="160" style="display:block;max-width:160px;height:auto;margin-bottom:32px;" />
                            <h1 style="margin:0 0 12px;color:#0a6c4c;font-size:32px;font-weight:900;line-height:1.15;letter-spacing:-0.5px;">${displayFrequency} Briefing</h1>
                            <p style="margin:0 0 24px;color:#4b5563;font-size:16px;line-height:1.5;">Essential updates for a<br/>changing energy world.</p>
                            <p style="margin:0;color:#0a6c4c;font-size:12px;font-weight:800;letter-spacing:0.5px;">${todayDate}</p>
                        </td>
                        <td class="stack-col hero-img" valign="bottom" align="right" style="width:50%;padding:0;">
                            <img src="${bannerUrl}" alt="Energy Banner" width="300" style="display:block;width:100%;max-width:320px;height:auto;" />
                        </td>
                    </tr></table>
                </td></tr>

                <tr><td style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>

                ${topStoriesHtml}
                ${opinionHtml}
                ${insightsHtml}

                <!-- FOOTER -->
                <tr><td style="background:#ffffff;padding:24px 40px 40px;" class="section-pad">
                    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #f3f4f6;padding-top:32px;">
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
                                    <p style="margin:0;color:#6b7280;font-size:11px;">&copy; ${yr} ENERGDIVE. All rights reserved.</p>
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

  return { subject, html };
}

async function main() {
  if (!BREVO_API_KEY) { console.error("❌  BREVO_API_KEY is not set"); process.exit(1); }
  const { subject, html } = buildDailyBriefingHtml();
  console.log(`📧  Sending "${subject}" to ${TO_EMAIL} …`);

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: DIGEST_FROM_NAME, email: DIGEST_FROM_EMAIL },
      to: [{ email: TO_EMAIL, name: TO_NAME }],
      subject,
      htmlContent: html,
      tags: ["test-briefing", "digest-daily"],
    }),
  });

  if (!res.ok) { const e = await res.text(); console.error(`❌  Brevo API ${res.status}: ${e}`); process.exit(1); }
  const result = (await res.json()) as { messageId?: string };
  console.log(`✅  Sent successfully! Message ID: ${result.messageId ?? "n/a"}`);
}

main();
