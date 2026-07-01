const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "ENERGDIVE";

export type BrevoTemplateEmailInput = {
  to: Array<{ email: string; name?: string | null }>;
  templateId: number;
  params: Record<string, unknown>;
  tags?: string[];
};

export type BrevoTemplateEmailResult = {
  messageId: string | null;
  raw: unknown;
};

export async function sendBrevoTemplateEmail({
  to,
  templateId,
  params,
  tags,
}: BrevoTemplateEmailInput): Promise<BrevoTemplateEmailResult> {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  if (!Number.isFinite(templateId) || templateId <= 0) {
    throw new Error("Brevo template ID is not configured");
  }

  if (to.length === 0) {
    throw new Error("At least one recipient is required");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: to.map((recipient) => ({
        email: recipient.email,
        ...(recipient.name ? { name: recipient.name } : {}),
      })),
      templateId,
      params,
      ...(tags && tags.length > 0 ? { tags } : {}),
    }),
  });

  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      })()
    : {};

  if (!response.ok) {
    throw new Error(`Brevo API ${response.status}: ${text || response.statusText}`);
  }

  return {
    messageId: typeof payload?.messageId === "string" ? payload.messageId : null,
    raw: payload,
  };
}
