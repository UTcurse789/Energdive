declare module "sib-api-v3-sdk" {
    const ApiClient: {
        instance: {
            authentications: {
                [key: string]: { apiKey: string };
            };
        };
    };

    class TransactionalEmailsApi {
        sendTransacEmail(params: {
            subject: string;
            sender: { email: string; name: string };
            to: { email: string; name?: string }[];
            htmlContent: string;
            textContent?: string;
            replyTo?: { email: string; name?: string };
            tags?: string[];
        }): Promise<any>;
    }

    export default { ApiClient, TransactionalEmailsApi };
}
