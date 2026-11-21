import { BrevoEmailProvider } from "./providers/brevo";
import type {
    EmailMessage,
    EmailSendResult,
    TransactionalEmailProvider,
} from "./types";

class EmailService {
    constructor(private readonly provider: TransactionalEmailProvider) {}

    send(message: EmailMessage): Promise<EmailSendResult> {
        return this.provider.send(message);
    }
}

/** Brevo remains the active transactional provider until a future provider is configured. */
export const emailService = new EmailService(new BrevoEmailProvider());

export { EmailService };
