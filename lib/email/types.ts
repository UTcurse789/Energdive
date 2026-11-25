export type EmailRecipient = {
    email: string;
    name?: string;
};

/** Base64-encoded attachment content, matching Brevo's existing API payload. */
export type EmailAttachment = {
    name: string;
    content: string;
};

export type HostedTemplate = {
    /** Provider-managed template identifier. */
    id: number;
    params: Record<string, unknown>;
};

/**
 * Controls whether unnamed recipients receive the legacy email-address name
 * fallback, or omit the name field entirely.
 */
export type RecipientNamePolicy = "default" | "omit-when-absent";

/** Controls parsing requirements for successful provider responses. */
export type SuccessResponseMode = "json" | "accept-any-success";

/**
 * Provider-neutral outbound transactional message.
 *
 * A message supplies either htmlContent/subject or a provider-hosted template.
 */
export type EmailMessage = {
    sender?: EmailRecipient;
    to: EmailRecipient[];
    subject?: string;
    htmlContent?: string;
    attachments?: EmailAttachment[];
    tags?: string[];
    template?: HostedTemplate;
    recipientNamePolicy?: RecipientNamePolicy;
    successResponseMode?: SuccessResponseMode;
};

export type EmailSendResult = {
    provider: string;
    messageId: string | null;
    /** The provider response, retained for integrations that need it. */
    raw: unknown;
};

export interface TransactionalEmailProvider {
    send(message: EmailMessage): Promise<EmailSendResult>;
}
