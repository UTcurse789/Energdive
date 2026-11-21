import type {
    EmailMessage,
    EmailRecipient,
    EmailSendResult,
    TransactionalEmailProvider,
} from "../types";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_FROM_EMAIL = "no-reply@info.energdive.com";
const DEFAULT_FROM_NAME = "ENERGDIVE";

function formatRecipient(recipient: EmailRecipient, preserveOptionalName: boolean) {
    if (preserveOptionalName) {
        return {
            email: recipient.email,
            ...(recipient.name ? { name: recipient.name } : {}),
        };
    }

    return {
        email: recipient.email,
        name: recipient.name || recipient.email,
    };
}

/**
 * Brevo implementation of the provider-neutral transactional-email contract.
 * Its payload deliberately matches the existing Brevo REST integration.
 */
export class BrevoEmailProvider implements TransactionalEmailProvider {
    async send(message: EmailMessage): Promise<EmailSendResult> {
        const apiKey = process.env.BREVO_API_KEY || "";
        if (!apiKey) {
            throw new Error("BREVO_API_KEY is not configured");
        }

        const usesHostedTemplate = Boolean(message.template);
        const sender = message.sender || {
            name: process.env.FROM_NAME || DEFAULT_FROM_NAME,
            email: process.env.FROM_EMAIL || DEFAULT_FROM_EMAIL,
        };

        const body: Record<string, unknown> = {
            sender: { email: sender.email, name: sender.name },
            to: message.to.map((recipient) => formatRecipient(recipient, usesHostedTemplate)),
        };

        if (message.template) {
            body.templateId = message.template.id;
            body.params = message.template.params;
        } else {
            body.subject = message.subject;
            body.htmlContent = message.htmlContent;
        }

        if (message.attachments && message.attachments.length > 0) {
            body.attachment = message.attachments;
        }
        if (message.tags && message.tags.length > 0) {
            body.tags = message.tags;
        }

        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Brevo API ${response.status}: ${errorText}`);
        }

        // Existing sendEmail expects Brevo's JSON success response and surfaces
        // JSON parsing errors rather than masking them.
        const raw = (await response.json()) as { messageId?: string };
        return {
            provider: "brevo",
            messageId: raw.messageId || null,
            raw,
        };
    }
}
