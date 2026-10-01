import "server-only";

import { sendWithSes } from "./providers/ses";

/** A mailbox that can be used as a transactional message sender. */
export interface TransactionalEmailAddress {
    email: string;
    name?: string;
}

/**
 * An attachment for a transactional message.
 *
 * Existing Energdive attachment producers emit base64 strings, so string
 * content defaults to base64. Use `encoding: "utf8"` for textual content.
 */
export interface TransactionalEmailAttachment {
    filename: string;
    content: string | Uint8Array;
    contentType?: string;
    encoding?: "base64" | "utf8";
}

/** A provider-neutral message tag. */
export interface TransactionalEmailTag {
    name: string;
    value: string;
}

/** The provider-neutral contract used for transactional email delivery. */
export interface SendTransactionalEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string | TransactionalEmailAddress;
    replyTo?: string;
    attachments?: TransactionalEmailAttachment[];
    tags?: (string | TransactionalEmailTag)[];
}

export interface TransactionalEmailResult {
    messageId?: string;
}

export interface TransactionalEmailProvider {
    send(options: SendTransactionalEmailOptions): Promise<TransactionalEmailResult>;
}

// Keep the public call site provider-neutral. Changing providers later only
// requires changing this binding; it does not require changing message callers.
const transactionalEmailProvider: TransactionalEmailProvider = {
    send: sendWithSes,
};

/**
 * Send a transactional email through the configured transactional provider.
 *
 * This is intentionally separate from the existing Brevo email/contact flows.
 */
export async function sendTransactionalEmail(
    options: SendTransactionalEmailOptions
): Promise<TransactionalEmailResult> {
    return transactionalEmailProvider.send(options);
}
