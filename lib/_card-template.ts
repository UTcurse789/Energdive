/**
 * Builds the premium membership-card email HTML.
 * Kept in a separate file so the main email.ts stays readable.
 */

interface CardParams {
    memberName: string;
    company: string;
    community: string;
    membershipId: string;
    joinDate: string;
    qrBlock: string;
    dashboardUrl: string;
    logoUrl: string;
    supportEmail: string;
    appUrl: string;
    toEmail: string;
    subject: string;
}

export function buildMembershipCardHtml(p: CardParams): string {
    const yr = new Date().getFullYear();
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${p.subject}</title>
<!--[if mso]><style>table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}td{border-collapse:collapse;}</style><![endif]-->
<style>
@media screen and (max-width:620px){
.ci td{display:block!important;width:100%!important;border-right:none!important;}
.ci td+td{border-top:1px solid rgba(201,151,61,.25)!important;padding-top:20px!important;}
.bf td{display:block!important;width:100%!important;padding:4px 0!important;}
.cr td{display:block!important;width:100%!important;padding:0 0 12px!important;text-align:center!important;}
.fc td{display:block!important;width:100%!important;padding:14px 20px!important;border-right:none!important;}
.fc td+td{border-top:1px solid #ead9b7!important;}
.bb td{display:block!important;width:100%!important;text-align:center!important;padding-bottom:10px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 12px;">
<tr><td align="center">
<table width="720" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;background:#0a0a0a;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.4);border:1px solid rgba(201,151,61,.25);">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#141414 0%,#090909 62%,#1c1206 100%);padding:28px 36px 24px;text-align:center;border-bottom:1px solid #2b2b2b;">
<img src="${p.logoUrl}" alt="EnergClub" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;"/>
</td></tr>

<!-- GREETING -->
<tr><td style="padding:40px 36px 32px;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="padding-right:16px;">
<h1 style="margin:0 0 12px;color:#ffffff;font-size:30px;font-weight:900;line-height:1.15;">Dear ${p.memberName},</h1>
<p style="margin:0;color:#a1a1aa;font-size:16px;line-height:1.75;">Welcome to ENERGClub. Your membership is now active.<br/>Please find your membership card details below for your records.</p>
</td>
<td width="96" valign="top" align="right" style="width:96px;">
<table cellpadding="0" cellspacing="0" style="border:2px solid #c9973d;border-radius:999px;"><tr><td style="padding:10px 12px;text-align:center;">
<div style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;font-weight:700;">Welcome to</div>
<div style="font-size:8px;letter-spacing:1.4px;text-transform:uppercase;color:#ffffff;font-weight:700;">ENERGClub</div>
</td></tr></table>
</td>
</tr></table>
</td></tr>

<!-- MEMBERSHIP CARD -->
<tr><td style="padding:0 36px 28px;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#18181b 0%,#0c0c0c 50%,#1a1005 100%);border:1px solid rgba(201,151,61,.6);border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.22);">
<tr><td style="padding:24px 26px 10px;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td valign="middle"><img src="${p.logoUrl}" alt="ENERGClub" width="140" style="display:block;max-width:140px;height:auto;"/>
<div style="margin-top:6px;color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">Membership Card</div></td>
<td align="right" valign="top">
<span style="display:inline-block;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.35);border-radius:999px;padding:8px 16px;color:#D4AF37;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
<span style="display:inline-block;width:7px;height:7px;background:#D4AF37;border-radius:50%;margin-right:6px;vertical-align:middle;box-shadow:0 0 6px #D4AF37;"></span>Active</span>
</td></tr></table>
</td></tr>
<tr><td style="padding:8px 26px 26px;">
<table width="100%" cellpadding="0" cellspacing="0" class="ci" style="border:1px solid rgba(201,151,61,.3);border-radius:16px;overflow:hidden;">
<tr>
<td width="58%" valign="top" style="padding:22px;border-right:1px solid rgba(201,151,61,.2);">
<div style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">Name</div>
<div style="color:#fff;font-size:20px;font-weight:700;margin-bottom:14px;">${p.memberName}</div>
<div style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">Company</div>
<div style="color:#e4e4e7;font-size:15px;font-weight:600;margin-bottom:14px;">${p.company}</div>
<div style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;">Community</div>
<div style="color:#e4e4e7;font-size:15px;font-weight:600;margin-bottom:6px;">${p.community}</div>
<div style="display:inline-block;background:linear-gradient(90deg,#D4AF37,#F3E5AB);border-radius:12px;padding:3px 10px;margin:4px 0 18px;">
<span style="font-size:10px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:.5px;">&#10003; Verified</span></div>
<div style="height:1px;background:rgba(201,151,61,.3);margin-bottom:16px;"></div>
<div style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Membership ID</div>
<div style="color:#D4AF37;font-size:24px;font-weight:900;letter-spacing:3px;font-family:'Courier New',monospace;">${p.membershipId}</div>
</td>
<td width="42%" valign="top" style="padding:22px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding-bottom:12px;">
<div style="background:#fff;border-radius:14px;padding:14px;display:inline-block;box-shadow:0 8px 24px rgba(255,255,255,.06);">
${p.qrBlock}
</div></td></tr>
<tr><td align="center" style="padding-bottom:18px;">
<div style="color:#D4AF37;font-size:11px;font-weight:600;line-height:1.5;">Scan for instant<br/>dashboard access</div>
</td></tr>
<tr><td>
<div style="height:1px;background:rgba(201,151,61,.3);margin-bottom:14px;"></div>
<div style="color:#D4AF37;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Joining Date</div>
<div style="color:#fff;font-size:18px;font-weight:700;">${p.joinDate}</div>
</td></tr>
</table>
</td>
</tr></table>
</td></tr>
</table>
</td></tr>

<!-- BENEFITS -->
<tr><td style="padding:0 36px 26px;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" class="bf"><tr>
<td width="25%" valign="top" style="padding:0 5px 0 0;">
<div style="background:#18181b;border:1px solid rgba(201,151,61,.25);border-radius:14px;padding:14px 12px;">
<div style="width:34px;height:34px;border-radius:999px;background:#111;color:#D4AF37;font-size:13px;font-weight:900;line-height:34px;text-align:center;margin-bottom:8px;">01</div>
<div style="color:#ffffff;font-size:13px;font-weight:800;margin-bottom:3px;">Event Access</div>
<div style="color:#a1a1aa;font-size:11px;line-height:1.5;">Register and attend exclusive events.</div>
</div></td>
<td width="25%" valign="top" style="padding:0 5px;">
<div style="background:#18181b;border:1px solid rgba(201,151,61,.25);border-radius:14px;padding:14px 12px;">
<div style="width:34px;height:34px;border-radius:999px;background:#111;color:#D4AF37;font-size:13px;font-weight:900;line-height:34px;text-align:center;margin-bottom:8px;">02</div>
<div style="color:#ffffff;font-size:13px;font-weight:800;margin-bottom:3px;">Resources</div>
<div style="color:#a1a1aa;font-size:11px;line-height:1.5;">Access member-only reports and insights.</div>
</div></td>
<td width="25%" valign="top" style="padding:0 5px;">
<div style="background:#18181b;border:1px solid rgba(201,151,61,.25);border-radius:14px;padding:14px 12px;">
<div style="width:34px;height:34px;border-radius:999px;background:#111;color:#D4AF37;font-size:13px;font-weight:900;line-height:34px;text-align:center;margin-bottom:8px;">03</div>
<div style="color:#ffffff;font-size:13px;font-weight:800;margin-bottom:3px;">Network</div>
<div style="color:#a1a1aa;font-size:11px;line-height:1.5;">Connect with industry leaders and peers.</div>
</div></td>
<td width="25%" valign="top" style="padding:0 0 0 5px;">
<div style="background:#18181b;border:1px solid rgba(201,151,61,.25);border-radius:14px;padding:14px 12px;">
<div style="width:34px;height:34px;border-radius:999px;background:#111;color:#D4AF37;font-size:13px;font-weight:900;line-height:34px;text-align:center;margin-bottom:8px;">04</div>
<div style="color:#ffffff;font-size:13px;font-weight:800;margin-bottom:3px;">Support</div>
<div style="color:#a1a1aa;font-size:11px;line-height:1.5;">Get priority support and assistance.</div>
</div></td>
</tr></table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 36px 26px;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" class="cr"><tr>
<td width="48%" valign="middle" style="padding-right:14px;">
<a href="${p.dashboardUrl}" style="display:block;background:linear-gradient(135deg,#1c1c1c,#0e0e0e);border:1px solid #D4AF37;border-radius:14px;padding:18px 24px;color:#D4AF37;font-size:17px;font-weight:800;text-decoration:none;text-align:center;">Go to My Dashboard &rarr;</a>
</td>
<td width="52%" valign="middle" style="padding-left:14px;color:#a1a1aa;font-size:14px;line-height:1.7;">
Visit your dashboard to update your profile and explore member benefits.
</td></tr></table>
</td></tr>

<!-- SECURITY -->
<tr><td style="padding:0 36px 32px;background:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" class="fc" style="background:#18181b;border:1px solid rgba(201,151,61,.25);border-radius:14px;overflow:hidden;"><tr>
<td width="50%" valign="top" style="padding:16px 20px;border-right:1px solid rgba(201,151,61,.15);">
<div style="color:#ffffff;font-size:14px;font-weight:800;margin-bottom:4px;">&#128274; Keep your details safe</div>
<div style="color:#a1a1aa;font-size:12px;line-height:1.6;">Do not share your membership ID or QR code with others.</div>
</td>
<td width="50%" valign="top" style="padding:16px 20px;">
<div style="color:#ffffff;font-size:14px;font-weight:800;margin-bottom:4px;">Need help?</div>
<div style="color:#a1a1aa;font-size:12px;line-height:1.6;">Contact us at <a href="mailto:${p.supportEmail}" style="color:#D4AF37;text-decoration:none;">${p.supportEmail}</a></div>
</td></tr></table>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:linear-gradient(135deg,#141414 0%,#090909 62%,#1c1206 100%);padding:22px 36px;border-top:1px solid #2b2b2b;">
<table width="100%" cellpadding="0" cellspacing="0" class="bb"><tr>
<td valign="middle">
<img src="${p.appUrl}/energclub.png" alt="EnergClub - EnergDive" width="160" style="display:block;max-width:160px;height:auto;"/>
</td>
<td align="right" valign="middle" style="color:#a1a1aa;font-size:11px;line-height:1.8;">
&copy; ${yr} ENERGClub. All rights reserved.<br/>
<a href="${p.appUrl}/privacy" style="color:#D4AF37;text-decoration:none;">Privacy Policy</a>
&nbsp;|&nbsp;
<a href="${p.appUrl}/terms" style="color:#D4AF37;text-decoration:none;">Terms &amp; Conditions</a>
&nbsp;|&nbsp;
<a href="${p.appUrl}/unsubscribe?email=${encodeURIComponent(p.toEmail)}" style="color:#D4AF37;text-decoration:none;">Unsubscribe</a>
</td>
</tr></table>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}
