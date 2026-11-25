const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@info.energdive.com";
const FROM_NAME = process.env.FROM_NAME || "ENERGDIVE";

import { emailService } from "./email/index";

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

  const result = await emailService.send({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: to.map((recipient) => ({
      email: recipient.email,
      ...(recipient.name ? { name: recipient.name } : {}),
    })),
    template: { id: templateId, params },
    tags,
  });

  return {
    messageId: result.messageId,
    raw: result.raw,
  };
}
