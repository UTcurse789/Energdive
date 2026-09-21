import "dotenv/config";
import axios from "axios";
import { query } from "../lib/db";

const BREVO_API = "https://api.brevo.com/v3/contacts";
const BREVO_NEWSLETTER_LIST_ID = 24;
const BATCH_SIZE = 100;

type LetterboxRow = { email: string };

async function main() {
    if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is not configured");
    }

    const result = await query<LetterboxRow>(`
        SELECT DISTINCT ON (LOWER(email)) email
        FROM subscribe_letterbox
        WHERE email IS NOT NULL AND BTRIM(email) <> ''
        ORDER BY LOWER(email), "timestamp" DESC
    `);

    let synced = 0;
    let failed = 0;

    for (let index = 0; index < result.rows.length; index += BATCH_SIZE) {
        const batch = result.rows.slice(index, index + BATCH_SIZE);
        const outcomes = await Promise.allSettled(
            batch.map(({ email }) =>
                axios.post(
                    BREVO_API,
                    {
                        email: email.trim().toLowerCase(),
                        listIds: [BREVO_NEWSLETTER_LIST_ID],
                        // This adds list 24 to existing contacts as well as
                        // creating contacts that have not reached Brevo yet.
                        updateEnabled: true,
                    },
                    {
                        headers: {
                            "api-key": process.env.BREVO_API_KEY!,
                            "Content-Type": "application/json",
                        },
                    }
                )
            )
        );

        outcomes.forEach((outcome, offset) => {
            if (outcome.status === "fulfilled") {
                synced += 1;
                return;
            }

            failed += 1;
            const reason = outcome.reason as { response?: { data?: unknown }; message?: string };
            console.error(
                `[newsletter-brevo-backfill] Failed for ${batch[offset].email}:`,
                reason.response?.data || reason.message || reason
            );
        });

        console.log(
            `[newsletter-brevo-backfill] Processed ${Math.min(index + BATCH_SIZE, result.rows.length)}/${result.rows.length}`
        );
    }

    console.log(
        `[newsletter-brevo-backfill] Complete. Synced: ${synced}; failed: ${failed}; list: ${BREVO_NEWSLETTER_LIST_ID}`
    );

    if (failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[newsletter-brevo-backfill] Aborted: ${message}`);
    process.exitCode = 1;
});
