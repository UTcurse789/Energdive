/**
 * Sends the production Daily Briefing template with current CMS, jobs and ad data.
 * Usage: npx tsx scripts/send-test-briefing.ts
 */
import "dotenv/config";
import { sendPreferenceDigestPreview } from "@/lib/preference-digests";

const email = "utkarsh@encis.in";

async function main() {
    const result = await sendPreferenceDigestPreview({
        email,
        firstName: "Utkarsh",
        frequency: "daily",
        // This is an explicitly requested review preview, not a subscriber send.
        allowInsufficientTopNews: true,
    });

    console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
