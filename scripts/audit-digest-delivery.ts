import "dotenv/config";
import { query } from "@/lib/db";

async function main() {
    const [database, allContactsResponse, subscribersResponse, partialZohoResponse] = await Promise.all([
        query<{
            real_users: number;
            current_digest_eligible: number;
            missing_preferences: number;
            opt_out: number;
        }>(
            `SELECT
                COUNT(*) FILTER (WHERE email NOT LIKE '%@phone.energdive.com')::int AS real_users,
                COUNT(*) FILTER (
                    WHERE onboarding_completed = true
                      AND verification_status = 'verified'
                      AND COALESCE(content_digest_opted_out, false) = false
                      AND preferred_frequency IS NOT NULL
                      AND COALESCE(array_length(preferred_formats, 1), 0) > 0
                      AND email NOT LIKE '%@phone.energdive.com'
                )::int AS current_digest_eligible,
                COUNT(*) FILTER (
                    WHERE onboarding_completed = true
                      AND verification_status = 'verified'
                      AND (preferred_frequency IS NULL OR COALESCE(array_length(preferred_formats, 1), 0) = 0)
                      AND email NOT LIKE '%@phone.energdive.com'
                )::int AS missing_preferences,
                COUNT(*) FILTER (WHERE COALESCE(content_digest_opted_out, false))::int AS opt_out
             FROM users`
        ),
        fetch("https://api.brevo.com/v3/contacts?limit=1&offset=0", {
            headers: { "api-key": process.env.BREVO_API_KEY || "", Accept: "application/json" },
        }),
        fetch("https://api.brevo.com/v3/contacts/lists/7/contacts?limit=1&offset=0", {
            headers: { "api-key": process.env.BREVO_API_KEY || "", Accept: "application/json" },
        }),
        fetch("https://api.brevo.com/v3/contacts/lists/21/contacts?limit=1&offset=0", {
            headers: { "api-key": process.env.BREVO_API_KEY || "", Accept: "application/json" },
        }),
    ]);

    for (const response of [allContactsResponse, subscribersResponse, partialZohoResponse]) {
        if (!response.ok) {
            throw new Error(`Brevo audit failed: ${response.status} ${await response.text()}`);
        }
    }

    const [allContacts, subscribers, partialZoho] = await Promise.all([
        allContactsResponse.json() as Promise<{ count?: number }>,
        subscribersResponse.json() as Promise<{ count?: number }>,
        partialZohoResponse.json() as Promise<{ count?: number }>,
    ]);
    const failures = await query<{ error: string | null; count: number }>(
        `SELECT error, COUNT(*)::int AS count
         FROM content_digest_logs
         WHERE status = 'failed'
           AND sent_at >= NOW() - INTERVAL '30 days'
         GROUP BY error
         ORDER BY count DESC
         LIMIT 10`
    );

    console.log(JSON.stringify({
        database: database.rows[0],
        brevoContacts: allContacts.count || 0,
        brevoSubscribers: subscribers.count || 0,
        brevoPartialZoho: partialZoho.count || 0,
        recentFailureReasons: failures.rows,
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
