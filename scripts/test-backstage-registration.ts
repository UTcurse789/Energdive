import "dotenv/config";

type TestPayload = {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    company: string;
    designation: string;
    event_id: string;
    event_name: string;
    registration_id: string;
    ticket_name: string;
};

const args = new Set(process.argv.slice(2));
const liveMode = args.has("--live");

const endpoint =
    process.env.BACKSTAGE_LOCAL_WEBHOOK_URL ||
    `http://localhost:3000/api/zoho/backstage-registration${liveMode ? "" : "?dryRun=1"}`;

const secret =
    process.env.ZOHO_BACKSTAGE_WEBHOOK_SECRET ||
    process.env.ZOHO_WEBHOOK_SECRET ||
    "local-backstage-secret";

const timestamp = Date.now();
const payload: TestPayload = {
    email: `backstage-local-${timestamp}@example.com`,
    first_name: "Local",
    last_name: "Backstage",
    phone: "+91 9999999999",
    company: "EnergDive Local Test",
    designation: "Delegate",
    event_id: "LOCAL-EVT-001",
    event_name: "Local Backstage Test Event",
    registration_id: `LOCAL-REG-${timestamp}`,
    ticket_name: "Local Delegate Pass",
};

async function run() {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-webhook-secret": secret,
        },
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: unknown = text;

    try {
        data = JSON.parse(text);
    } catch {
        // Keep raw text for non-JSON error responses.
    }

    console.log(JSON.stringify({ endpoint, status: response.status, data }, null, 2));

    if (!response.ok) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
