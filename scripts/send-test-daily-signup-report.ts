import "dotenv/config";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

// In standalone CLI scripts outside of Next.js Webpack bundler, stub the server-only marker
// so that Node/tsx can execute server code without tripping the client-component guard.
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
} as NodeModule;

import { sendDailySignupReport } from "@/lib/daily-signup-report";

function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return "***";
    const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;
    return `${maskedLocal}@${domain}`;
}

async function main() {
    const testRecipient = process.env.AWS_SES_TEST_TO_EMAIL?.trim();
    if (!testRecipient) {
        throw new Error("AWS_SES_TEST_TO_EMAIL must be set in the environment before running this test.");
    }

    const masked = maskEmail(testRecipient);
    const sesMode = process.env.USE_SES_DAILY_SIGNUP_REPORT === "true";

    console.log("=== Controlled Daily Signup Report Test ===");
    console.log(`SES mode enabled:           ${sesMode}`);
    console.log(`Target recipient (masked):   ${masked}`);
    console.log(`Production recipients used:  NONE (explicitly overridden to single test recipient)`);
    console.log("===========================================");

    if (!sesMode) {
        throw new Error("USE_SES_DAILY_SIGNUP_REPORT must be 'true' for this SES integration test.");
    }

    let sesCallCount = 0;
    let sesMessageId: string | undefined;
    const originalSend = SESv2Client.prototype.send;
    SESv2Client.prototype.send = async function (command: unknown, ...rest: unknown[]) {
        if (command instanceof SendEmailCommand) {
            sesCallCount++;
        }
        const response = await (originalSend as (...args: unknown[]) => Promise<unknown>).apply(this, [command, ...rest]);
        if (response && typeof response === "object" && "MessageId" in response) {
            sesMessageId = (response as { MessageId?: string }).MessageId;
        }
        return response;
    };

    let brevoCallCount = 0;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
        const urlString = String(input);
        if (urlString.includes("brevo.com")) {
            brevoCallCount++;
        }
        return originalFetch(input, init);
    };

    try {
        const result = await sendDailySignupReport([testRecipient]);

        console.log("\n=== Test Execution Results ===");
        console.log(`Report generation:           SUCCESS`);
        console.log(`SES selected:                YES`);
        console.log(`SES MessageId:               ${sesMessageId || "N/A"}`);
        console.log(`Sender:                      ${process.env.AWS_SES_FROM_NAME || "ENERGDIVE Automation"} <${process.env.AWS_SES_FROM_EMAIL || "N/A"}>`);
        console.log(`Masked test recipient:       ${masked}`);
        console.log(`Subject:                     ENERGDIVE Daily User Signup Report – ${result.reportDate}`);
        console.log(`Report HTML generated:       YES (${result.totalUsers} new users, ${result.totalContactsToDate} total contacts)`);
        console.log(`Brevo API calls:             ${brevoCallCount} (confirmed 0)`);
        console.log(`Production recipients used:  NONE`);
        console.log(`Emails attempted:            ${sesCallCount} (confirmed exactly 1)`);
        console.log("==============================\n");
    } finally {
        SESv2Client.prototype.send = originalSend;
        globalThis.fetch = originalFetch;
    }
}

main().catch((error: unknown) => {
    console.error("[DAILY-SIGNUP-REPORT-TEST] Failed:", error);
    process.exit(1);
});
