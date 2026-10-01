import "server-only";

import { randomBytes } from "node:crypto";
import {
    SESv2Client,
    SendEmailCommand,
    type SESv2ClientConfig,
    type SendEmailCommandInput,
} from "@aws-sdk/client-sesv2";

import type {
    SendTransactionalEmailOptions,
    TransactionalEmailAddress,
    TransactionalEmailAttachment,
    TransactionalEmailResult,
    TransactionalEmailTag,
} from "../transactional";

let sesClient: SESv2Client | undefined;

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
    csv: "text/csv",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    json: "application/json",
    pdf: "application/pdf",
    png: "image/png",
    txt: "text/plain",
    webp: "image/webp",
    xml: "application/xml",
};

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const MIME_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;

export class SesTransactionalEmailError extends Error {
    constructor(providerError: unknown) {
        const providerErrorName = getProviderErrorName(providerError);
        const providerErrorMessage = getProviderErrorMessage(providerError);
        const detail = providerErrorMessage
            ? `: ${providerErrorMessage}`
            : providerErrorName
                ? ` (${providerErrorName})`
                : "";
        super(`AWS SES failed to send the transactional email${detail}`, { cause: providerError });
        this.name = "SesTransactionalEmailError";
    }
}

/** Send a provider-neutral message through AWS SES v2. */
export async function sendWithSes(
    options: SendTransactionalEmailOptions
): Promise<TransactionalEmailResult> {
    const command = new SendEmailCommand(createSendEmailCommandInput(options));

    try {
        const response = await getSesClient().send(command);
        return { messageId: response.MessageId };
    } catch (error) {
        throw new SesTransactionalEmailError(error);
    }
}

function getSesClient(): SESv2Client {
    if (sesClient) {
        return sesClient;
    }

    const region = getOptionalEnvironmentVariable("AWS_SES_REGION") || getOptionalEnvironmentVariable("AWS_REGION");
    if (!region) {
        throw new Error("Missing required AWS SES environment variable: AWS_SES_REGION.");
    }
    const accessKeyId = getOptionalEnvironmentVariable("AWS_SES_ACCESS_KEY_ID");
    const secretAccessKey = getOptionalEnvironmentVariable("AWS_SES_SECRET_ACCESS_KEY");

    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
        throw new Error(
            "AWS SES configuration requires both AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY when either is set."
        );
    }

    const clientConfig: SESv2ClientConfig = {
        region,
        // This provider deliberately does not add retries. A later delivery
        // policy can make that decision centrally.
        maxAttempts: 1,
    };

    if (accessKeyId && secretAccessKey) {
        clientConfig.credentials = { accessKeyId, secretAccessKey };
    }

    sesClient = new SESv2Client(clientConfig);
    return sesClient;
}

function createSendEmailCommandInput(
    options: SendTransactionalEmailOptions
): SendEmailCommandInput {
    const to = getRequiredMailbox(options.to, "to");
    const subject = getRequiredHeaderValue(options.subject, "subject");
    const html = getRequiredMessageBody(options.html, "html");
    const text = options.text === undefined ? undefined : getMessageBody(options.text, "text");
    const replyTo = options.replyTo === undefined
        ? undefined
        : getRequiredMailbox(options.replyTo, "replyTo");
    const from = resolveFromAddress(options.from);
    const attachments = options.attachments?.length ? options.attachments : undefined;

    const commandInput: SendEmailCommandInput = {
        FromEmailAddress: formatMailbox(from),
        Destination: {
            ToAddresses: [to],
        },
        Content: attachments
            ? {
                Raw: {
                    Data: buildRawMessage({
                        to,
                        subject,
                        html,
                        text,
                        from,
                        replyTo,
                        attachments,
                    }),
                },
            }
            : {
                Simple: {
                    Subject: {
                        Data: subject,
                        Charset: "UTF-8",
                    },
                    Body: {
                        Html: {
                            Data: html,
                            Charset: "UTF-8",
                        },
                        ...(text === undefined
                            ? {}
                            : {
                                Text: {
                                    Data: text,
                                    Charset: "UTF-8",
                                },
                            }),
                    },
                },
            },
        ...(attachments || !replyTo ? {} : { ReplyToAddresses: [replyTo] }),
        ...(options.tags?.length ? { EmailTags: options.tags.map(normalizeTag) } : {}),
        ...getConfigurationSetInput(),
    };

    return commandInput;
}

function resolveFromAddress(
    from: string | TransactionalEmailAddress | undefined
): TransactionalEmailAddress {
    if (typeof from === "string") {
        const trimmed = from.trim();
        const match = trimmed.match(/^(?:(?:"?([^"]*)"?\s)?<([^>]+)>|([^<]+))$/);
        if (match) {
            const parsedName = (match[1] || "").trim();
            const parsedEmail = (match[2] || match[3] || "").trim();
            const safeEmail = getRequiredMailbox(parsedEmail, "from");
            const safeName = parsedName
                ? getHeaderValue(parsedName, "from.name")
                : getOptionalEnvironmentVariable("AWS_SES_FROM_NAME");
            return safeName ? { email: safeEmail, name: safeName } : { email: safeEmail };
        }
        return { email: getRequiredMailbox(trimmed, "from") };
    }

    const email = from?.email === undefined
        ? getRequiredEnvironmentVariable("AWS_SES_FROM_EMAIL")
        : getRequiredMailbox(from.email, "from.email");
    const name = from?.name === undefined
        ? getOptionalEnvironmentVariable("AWS_SES_FROM_NAME")
        : getHeaderValue(from.name, "from.name");

    return name ? { email, name } : { email };
}

function getConfigurationSetInput(): Pick<SendEmailCommandInput, "ConfigurationSetName"> {
    const configurationSetName = getOptionalEnvironmentVariable("AWS_SES_CONFIGURATION_SET");
    return configurationSetName ? { ConfigurationSetName: configurationSetName } : {};
}

function normalizeTag(tag: string | TransactionalEmailTag): { Name: string; Value: string } {
    if (typeof tag === "string") {
        return {
            Name: "tag",
            Value: getRequiredHeaderValue(tag, "tag"),
        };
    }
    return {
        Name: getRequiredHeaderValue(tag.name, "tag.name"),
        Value: getRequiredHeaderValue(tag.value, "tag.value"),
    };
}

function buildRawMessage({
    to,
    subject,
    html,
    text,
    from,
    replyTo,
    attachments,
}: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from: TransactionalEmailAddress;
    replyTo?: string;
    attachments: TransactionalEmailAttachment[];
}): Uint8Array {
    const mixedBoundary = createMimeBoundary();
    const alternativeBoundary = createMimeBoundary();
    const lines = [
        `From: ${formatMailbox(from)}`,
        `To: ${to}`,
        `Subject: ${encodeMimeHeader(subject)}`,
        ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
        "MIME-Version: 1.0",
        `Content-Type: multipart/mixed; boundary=\"${mixedBoundary}\"`,
        "",
        `--${mixedBoundary}`,
        `Content-Type: multipart/alternative; boundary=\"${alternativeBoundary}\"`,
        "",
        ...(text === undefined ? [] : buildTextPart(alternativeBoundary, "text/plain", text)),
        ...buildTextPart(alternativeBoundary, "text/html", html),
        `--${alternativeBoundary}--`,
        ...attachments.flatMap((attachment) => buildAttachmentPart(mixedBoundary, attachment)),
        `--${mixedBoundary}--`,
        "",
    ];

    return Buffer.from(lines.join("\r\n"), "utf8");
}

function buildTextPart(boundary: string, contentType: string, content: string): string[] {
    return [
        `--${boundary}`,
        `Content-Type: ${contentType}; charset=UTF-8`,
        "Content-Transfer-Encoding: base64",
        "",
        toBase64Lines(Buffer.from(content, "utf8").toString("base64")),
        "",
    ];
}

function buildAttachmentPart(
    boundary: string,
    attachment: TransactionalEmailAttachment
): string[] {
    const filename = getRequiredHeaderValue(attachment.filename, "attachment.filename");
    const contentType = getAttachmentContentType(attachment);
    const encodedFilename = encodeRfc2231Parameter(filename);

    return [
        `--${boundary}`,
        `Content-Type: ${contentType}; name*=UTF-8''${encodedFilename}`,
        `Content-Disposition: attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Transfer-Encoding: base64",
        "",
        toBase64Lines(getAttachmentBase64(attachment)),
        "",
    ];
}

function getAttachmentContentType(attachment: TransactionalEmailAttachment): string {
    if (attachment.contentType) {
        const normalizedContentType = attachment.contentType.trim();
        if (!MIME_TYPE_PATTERN.test(normalizedContentType)) {
            throw new Error("attachment.contentType must be a valid MIME type.");
        }
        return normalizedContentType;
    }

    const extension = attachment.filename.split(".").pop()?.toLowerCase();
    return extension ? MIME_TYPES_BY_EXTENSION[extension] || "application/octet-stream" : "application/octet-stream";
}

function getAttachmentBase64(attachment: TransactionalEmailAttachment): string {
    if (typeof attachment.content !== "string") {
        return Buffer.from(attachment.content).toString("base64");
    }

    if (attachment.encoding === "utf8") {
        return Buffer.from(attachment.content, "utf8").toString("base64");
    }

    const normalizedContent = attachment.content.replace(/\s/g, "");
    if (!normalizedContent || !BASE64_PATTERN.test(normalizedContent)) {
        throw new Error("attachment.content must be valid base64 when encoding is not utf8.");
    }

    return normalizedContent;
}

function toBase64Lines(value: string): string {
    const lines = value.match(/.{1,76}/g);
    return lines ? lines.join("\r\n") : "";
}

function createMimeBoundary(): string {
    return `energdive-${randomBytes(18).toString("hex")}`;
}

function formatMailbox({ email, name }: TransactionalEmailAddress): string {
    const safeEmail = getRequiredMailbox(email, "from.email");
    if (!name) {
        return safeEmail;
    }

    const safeName = getHeaderValue(name, "from.name");
    const encodedName = encodeMimeHeader(safeName);
    return encodedName === safeName
        ? `\"${safeName.replace(/([\\\"])/g, "\\$1")}\" <${safeEmail}>`
        : `${encodedName} <${safeEmail}>`;
}

function encodeMimeHeader(value: string): string {
    return /^[\x20-\x7E]*$/.test(value)
        ? value
        : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function encodeRfc2231Parameter(value: string): string {
    return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

function getRequiredEnvironmentVariable(name: string): string {
    const value = getOptionalEnvironmentVariable(name);
    if (!value) {
        throw new Error(`Missing required AWS SES environment variable: ${name}.`);
    }
    return value;
}

function getOptionalEnvironmentVariable(name: string): string | undefined {
    const value = process.env[name]?.trim();
    return value || undefined;
}

function getRequiredMailbox(value: string, fieldName: string): string {
    const normalizedValue = getHeaderValue(value, fieldName);
    if (!normalizedValue) {
        throw new Error(`${fieldName} is required.`);
    }
    return normalizedValue;
}

function getRequiredHeaderValue(value: string, fieldName: string): string {
    const normalizedValue = getHeaderValue(value, fieldName);
    if (!normalizedValue) {
        throw new Error(`${fieldName} is required.`);
    }
    return normalizedValue;
}

function getHeaderValue(value: string, fieldName: string): string {
    if (/\r|\n/.test(value)) {
        throw new Error(`${fieldName} must not contain line breaks.`);
    }
    return value.trim();
}

function getRequiredMessageBody(value: string, fieldName: string): string {
    const normalizedValue = getMessageBody(value, fieldName);
    if (!normalizedValue) {
        throw new Error(`${fieldName} is required.`);
    }
    return normalizedValue;
}

function getMessageBody(value: string, fieldName: string): string {
    if (typeof value !== "string") {
        throw new Error(`${fieldName} must be a string.`);
    }
    return value;
}

function getProviderErrorName(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null || !("name" in error)) {
        return undefined;
    }

    const name = error.name;
    return typeof name === "string" && name ? name : undefined;
}

function getProviderErrorMessage(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null || !("message" in error)) {
        return undefined;
    }

    const message = error.message;
    return typeof message === "string" && message ? message.trim() : undefined;
}
