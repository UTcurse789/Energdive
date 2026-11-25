import type {
    EmailMessage,
    EmailRecipient,
    EmailSendResult,
    RecipientNamePolicy,
    TransactionalEmailProvider,
} from "../types";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_FROM_EMAIL = "no-reply@info.energdive.com";
const DEFAULT_FROM_NAME = "ENERGDIVE";

function formatRecipient(
    recipient: EmailRecipient,
    preserveOptionalName: boolean,
    recipientNamePolicy: RecipientNamePolicy
) {
    if (preserveOptionalName || recipientNamePolicy === "omit-when-absent") {
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

function parseOptionalJsonResponse(text: string): { raw: unknown; messageId: string | null } {
    const raw: unknown = text
        ? (() => {
            try {
                return JSON.parse(text);
            } catch {
                return { raw: text };
            }
        })()
        : {};
    const messageId = typeof (raw as { messageId?: unknown })?.messageId === "string"
        ? (raw as { messageId: string }).messageId
        : null;

    return { raw, messageId };
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
        const recipientNamePolicy = message.recipientNamePolicy || "default";
        const sender = message.sender || {
            name: process.env.FROM_NAME || DEFAULT_FROM_NAME,
            email: process.env.FROM_EMAIL || DEFAULT_FROM_EMAIL,
        };

        const body: Record<string, unknown> = {
            sender: { email: sender.email, name: sender.name },
            to: message.to.map((recipient) => formatRecipient(
                recipient,
                usesHostedTemplate,
                recipientNamePolicy
            )),
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
            const providerError = usesHostedTemplate
                ? errorText || response.statusText
                : errorText;
            throw new Error(`Brevo API ${response.status}: ${providerError}`);
        }

        if (usesHostedTemplate || message.successResponseMode === "accept-any-success") {
            // The legacy hosted-template helper returns a usable result for a
            // successful empty or non-JSON response. The same behavior is
            // available as an opt-in for legacy status-only callers.
            const text = await response.text();
            const { raw, messageId } = parseOptionalJsonResponse(text);

            return { provider: "brevo", messageId, raw };
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
