import assert from "node:assert/strict";
import test from "node:test";
import { emailService } from "./email-service";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.BREVO_API_KEY;
const originalFromEmail = process.env.FROM_EMAIL;
const originalFromName = process.env.FROM_NAME;

function restoreEnvironment() {
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = originalApiKey;
    if (originalFromEmail === undefined) delete process.env.FROM_EMAIL;
    else process.env.FROM_EMAIL = originalFromEmail;
    if (originalFromName === undefined) delete process.env.FROM_NAME;
    else process.env.FROM_NAME = originalFromName;
}

test.afterEach(() => {
    globalThis.fetch = originalFetch;
    restoreEnvironment();
});

test("sends HTML, multiple recipients, attachments, tags, and sender fallback", async () => {
    process.env.BREVO_API_KEY = "test-key";
    delete process.env.FROM_EMAIL;
    delete process.env.FROM_NAME;
    let request: Request | undefined;
    globalThis.fetch = async (input, init) => {
        request = new Request(input, init);
        return new Response(JSON.stringify({ messageId: "message-123" }), { status: 201 });
    };

    const result = await emailService.send({
        to: [{ email: "one@example.test" }, { email: "two@example.test", name: "Two" }],
        subject: "Test subject",
        htmlContent: "<p>Test</p>",
        attachments: [{ name: "test.pdf", content: "cGRm" }],
        tags: ["test", "transactional"],
    });

    assert.equal(result.provider, "brevo");
    assert.equal(result.messageId, "message-123");
    assert.equal(request?.url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(request?.headers.get("api-key"), "test-key");
    const payload = await request?.json();
    assert.deepEqual(payload, {
        sender: { email: "no-reply@info.energdive.com", name: "ENERGDIVE" },
        to: [
            { email: "one@example.test", name: "one@example.test" },
            { email: "two@example.test", name: "Two" },
        ],
        subject: "Test subject",
        htmlContent: "<p>Test</p>",
        attachment: [{ name: "test.pdf", content: "cGRm" }],
        tags: ["test", "transactional"],
    });
});

test("preserves Brevo API errors", async () => {
    process.env.BREVO_API_KEY = "test-key";
    globalThis.fetch = async () => new Response("provider failure", { status: 429 });

    await assert.rejects(
        emailService.send({ to: [{ email: "one@example.test" }], subject: "Test", htmlContent: "<p>Test</p>" }),
        /Brevo API 429: provider failure/
    );
});

test("fails clearly when no Brevo API key is configured", async () => {
    delete process.env.BREVO_API_KEY;

    await assert.rejects(
        emailService.send({ to: [{ email: "one@example.test" }], subject: "Test", htmlContent: "<p>Test</p>" }),
        /BREVO_API_KEY is not configured/
    );
});
