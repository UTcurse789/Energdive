import SibApiV3Sdk from "sib-api-v3-sdk";

// ---------------------------------------------------------------------------
// Brevo (Sendinblue) Transactional Email
// ---------------------------------------------------------------------------

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY || "";

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

interface SendMagicLinkOptions {
    email: string;
    firstName?: string;
    inviteUrl: string;
}

/**
 * Send a magic-link portal access email via Brevo.
 */
export async function sendMagicLinkEmail({ email, firstName, inviteUrl }: SendMagicLinkOptions) {
    const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

    await emailApi.sendTransacEmail({
        subject: "Your EnergDive Portal Access",
        sender: { email: "no-reply@energdive.com", name: "EnergDive" },
        to: [{ email }],
        htmlContent: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
                <h2 style="color: #0f172a; font-size: 22px; margin-bottom: 8px;">Welcome to EnergDive</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    ${greeting}<br/><br/>
                    Your portal access is ready. Click the button below to log in — no password needed.
                </p>
                <a href="${inviteUrl}"
                   style="display: inline-block; background: #10b981; color: #fff; padding: 12px 28px;
                          border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;
                          margin: 24px 0;">
                    Access Your Portal →
                </a>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
                    This link is valid for 10 minutes. If it expires, contact your admin for a new one.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
                <p style="color: #cbd5e1; font-size: 12px;">
                    EnergDive · Energy Intelligence Platform
                </p>
            </div>
        `,
    });

    console.log(`[BREVO] Magic link email sent to ${email}`);
}
