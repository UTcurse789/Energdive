/**
 * Unit/Mock test suite for transactional email provider selection and feature flags.
 *
 * Verifies for each migrated group:
 *   1. Feature flag false/unset -> Brevo only
 *   2. Feature flag true -> SES only
 *   3. SES failure -> error surfaces, NO Brevo fallback
 *   4. Default behavior -> Brevo
 *
 * Runs completely locally with in-memory mocks.
 * NO real emails are sent.
 * NO credentials are required.
 */

// In standalone CLI scripts outside of Next.js Webpack bundler, stub the server-only marker
// so that Node/tsx can execute server code without tripping the client-component guard.
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
} as NodeModule;

import {
    deliverResourceEmail,
    deliverEnergJobEmail,
    deliverAbstractEmail,
    deliverPortalEmail,
    deliverMembershipEmail,
    deliverWelcomeEmail,
    deliverOtpEmail,
    sendOtpEmail,
    sendResourceReadyEmail,
    sendPortalAccessEmail,
    sendMagicLinkEmail,
    sendMembershipWelcomeEmail,
    sendEnergJobApplicationApplicantEmail,
    sendAbstractSubmissionAuthorConfirmation,
    sendWelcomeEmail,
    DeliverTransactionalOptions,
} from "../lib/email";
import type { SendTransactionalEmailOptions, TransactionalEmailResult } from "../lib/email/transactional";

function createMockSenders(options?: { sesShouldFail?: boolean; brevoShouldFail?: boolean }) {
    const brevoCalls: Array<{ to: string; subject: string }> = [];
    const sesCalls: Array<{ to: string; subject: string }> = [];

    const sendViaBrevo = async (opts: { to: string; subject: string; htmlContent: string }) => {
        if (options?.brevoShouldFail) {
            throw new Error("Brevo delivery failed (simulated error)");
        }
        brevoCalls.push({ to: opts.to, subject: opts.subject });
    };

    const sendViaSes = async (opts: SendTransactionalEmailOptions): Promise<TransactionalEmailResult> => {
        if (options?.sesShouldFail) {
            throw new Error("AWS SES delivery failed (simulated error)");
        }
        sesCalls.push({ to: opts.to, subject: opts.subject });
        return {
            messageId: "mock-ses-msg-id-12345",
        };
    };

    return {
        brevoCalls,
        sesCalls,
        sendViaBrevo: sendViaBrevo as typeof import("../lib/email").sendEmail,
        sendViaSes,
        reset: () => {
            brevoCalls.length = 0;
            sesCalls.length = 0;
        },
    };
}

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string) {
    totalAssertions++;
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    passedAssertions++;
    console.log(`  PASS: ${message}`);
}

async function testGroup(
    groupName: string,
    flagEnvVar: string,
    deliverFn: (opts: DeliverTransactionalOptions) => Promise<void>
) {
    console.log(`\n==================================================`);
    console.log(`TEST GROUP: ${groupName} (${flagEnvVar})`);
    console.log(`==================================================`);

    const originalFlag = process.env[flagEnvVar];

    try {
        // Case 1: Flag unset / default -> Brevo only
        delete process.env[flagEnvVar];
        {
            const { brevoCalls, sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
            await deliverFn({
                to: "test@example.com",
                subject: `${groupName} Default Test`,
                htmlContent: "<p>Test</p>",
                sendViaBrevo,
                sendViaSes,
            });
            assert(brevoCalls.length === 1, "Default/unset flag calls Brevo once");
            assert(sesCalls.length === 0, "Default/unset flag does NOT call SES");
        }

        // Case 2: Flag explicitly "false" -> Brevo only
        process.env[flagEnvVar] = "false";
        {
            const { brevoCalls, sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
            await deliverFn({
                to: "test@example.com",
                subject: `${groupName} False Flag Test`,
                htmlContent: "<p>Test</p>",
                sendViaBrevo,
                sendViaSes,
            });
            assert(brevoCalls.length === 1, "Flag 'false' calls Brevo once");
            assert(sesCalls.length === 0, "Flag 'false' does NOT call SES");
        }

        // Case 3: Flag explicitly "true" -> SES only
        process.env[flagEnvVar] = "true";
        {
            const { brevoCalls, sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
            await deliverFn({
                to: "test@example.com",
                subject: `${groupName} True Flag Test`,
                htmlContent: "<p>Test</p>",
                sendViaBrevo,
                sendViaSes,
            });
            assert(sesCalls.length === 1, "Flag 'true' calls SES once");
            assert(brevoCalls.length === 0, "Flag 'true' does NOT call Brevo");
        }

        // Case 4: Flag "true" + SES fails -> Throws error, NO Brevo fallback
        process.env[flagEnvVar] = "true";
        {
            const { brevoCalls, sesCalls, sendViaBrevo, sendViaSes } = createMockSenders({ sesShouldFail: true });
            let threw = false;
            try {
                await deliverFn({
                    to: "test@example.com",
                    subject: `${groupName} Error Test`,
                    htmlContent: "<p>Test</p>",
                    sendViaBrevo,
                    sendViaSes,
                });
            } catch (err: unknown) {
                threw = true;
                assert(
                    err instanceof Error && err.message.includes("simulated error"),
                    "SES error surfaces directly to caller"
                );
            }
            assert(threw, "Execution threw on SES error");
            assert(sesCalls.length === 0, "SES failed before recording success");
            assert(brevoCalls.length === 0, "NO silent fallback to Brevo on SES failure");
        }
    } finally {
        if (originalFlag === undefined) {
            delete process.env[flagEnvVar];
        } else {
            process.env[flagEnvVar] = originalFlag;
        }
    }
}

async function testHighLevelFunctions() {
    console.log(`\n==================================================`);
    console.log(`TEST HIGH-LEVEL APPLICATION FUNCTIONS`);
    console.log(`==================================================`);

    // 1. sendOtpEmail with flag=false vs flag=true
    {
        const { brevoCalls, sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_OTP_EMAILS = "false";
        await sendOtpEmail("auth-user@example.com", "Auth User", "4829", { sendViaBrevo, sendViaSes });
        assert(brevoCalls.length === 1, "sendOtpEmail with flag=false delivers via Brevo");
        assert(sesCalls.length === 0, "sendOtpEmail with flag=false does not touch SES");

        process.env.USE_SES_OTP_EMAILS = "true";
        await sendOtpEmail("auth-user@example.com", "Auth User", "4829", { sendViaBrevo, sendViaSes });
        assert(sesCalls.length === 1, "sendOtpEmail with flag=true delivers via SES");
        delete process.env.USE_SES_OTP_EMAILS;
    }

    // 2. sendResourceReadyEmail
    {
        const { sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_RESOURCE_EMAILS = "true";
        await sendResourceReadyEmail(
            {
                to: "downloader@example.com",
                resourceTitle: "Hydrogen Market Report 2026",
                resourceUrl: "https://www.energdive.com/resources/hydrogen",
            },
            { sendViaBrevo, sendViaSes }
        );
        assert(sesCalls.length === 1, "sendResourceReadyEmail with flag=true delivers via SES");
        delete process.env.USE_SES_RESOURCE_EMAILS;
    }

    // 3. sendPortalAccessEmail & sendMagicLinkEmail
    {
        const { sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_PORTAL_EMAILS = "true";
        await sendPortalAccessEmail("portal@example.com", "Portal User", "https://energdive.com/magic", {
            sendViaBrevo,
            sendViaSes,
        });
        await sendMagicLinkEmail("magic@example.com", "Magic User", "https://energdive.com/magic2", {
            sendViaBrevo,
            sendViaSes,
        });
        assert(sesCalls.length === 2, "sendPortalAccessEmail and sendMagicLinkEmail deliver via SES when flag=true");
        delete process.env.USE_SES_PORTAL_EMAILS;
    }

    // 4. sendMembershipWelcomeEmail
    {
        const { sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_MEMBERSHIP_EMAILS = "true";
        await sendMembershipWelcomeEmail("member@example.com", "New Member", "ED-2026-9999", {
            sendViaBrevo,
            sendViaSes,
        });
        assert(sesCalls.length === 1, "sendMembershipWelcomeEmail delivers via SES when flag=true");
        delete process.env.USE_SES_MEMBERSHIP_EMAILS;
    }

    // 5. sendEnergJobApplicationApplicantEmail
    {
        const { sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_ENERGYJOB_EMAILS = "true";
        await sendEnergJobApplicationApplicantEmail(
            {
                applicantEmail: "applicant@example.com",
                applicantName: "Jane Doe",
                jobTitle: "Senior Solar Engineer",
                jobUrl: "https://www.energdive.com/jobs/1",
                companyName: "Acme Solar",
            },
            { sendViaBrevo, sendViaSes }
        );
        assert(sesCalls.length === 1, "sendEnergJobApplicationApplicantEmail delivers via SES when flag=true");
        delete process.env.USE_SES_ENERGYJOB_EMAILS;
    }

    // 6. sendAbstractSubmissionAuthorConfirmation
    {
        const { sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_ABSTRACT_EMAILS = "true";
        await sendAbstractSubmissionAuthorConfirmation("author@example.com", "Dr. Author", "Future of Biofuels", {
            sendViaBrevo,
            sendViaSes,
        });
        assert(sesCalls.length === 1, "sendAbstractSubmissionAuthorConfirmation delivers via SES when flag=true");
        delete process.env.USE_SES_ABSTRACT_EMAILS;
    }

    // 7. sendWelcomeEmail
    {
        const { sesCalls, sendViaBrevo, sendViaSes } = createMockSenders();
        process.env.USE_SES_WELCOME_EMAILS = "true";
        await sendWelcomeEmail("welcome@example.com", "Welcome User", undefined, undefined, {
            sendViaBrevo,
            sendViaSes,
        });
        assert(sesCalls.length === 1, "sendWelcomeEmail delivers via SES when flag=true");
        delete process.env.USE_SES_WELCOME_EMAILS;
    }
}

async function run() {
    console.log("Starting mock/unit verification for email feature flags...\n");

    await testGroup("1. Resource-Ready Emails", "USE_SES_RESOURCE_EMAILS", deliverResourceEmail);
    await testGroup("2. EnergJob Emails", "USE_SES_ENERGYJOB_EMAILS", deliverEnergJobEmail);
    await testGroup("3. Abstract / Paper Submission Emails", "USE_SES_ABSTRACT_EMAILS", deliverAbstractEmail);
    await testGroup("4. Portal / Magic Link Emails", "USE_SES_PORTAL_EMAILS", deliverPortalEmail);
    await testGroup("5. Membership Welcome Emails", "USE_SES_MEMBERSHIP_EMAILS", deliverMembershipEmail);
    await testGroup("6. General Welcome Email", "USE_SES_WELCOME_EMAILS", deliverWelcomeEmail);
    await testGroup("7. Authentication OTP Emails", "USE_SES_OTP_EMAILS", deliverOtpEmail);

    await testHighLevelFunctions();

    console.log(`\n==================================================`);
    console.log(`ALL TESTS PASSED: ${passedAssertions}/${totalAssertions} assertions verified`);
    console.log(`==================================================\n`);
}

run().catch((err) => {
    console.error("\nTEST SUITE FAILED:", err);
    process.exit(1);
});
