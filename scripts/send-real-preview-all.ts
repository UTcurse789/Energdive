import "dotenv/config";
import { sendPreferenceDigestPreview } from "../lib/preference-digests";
import { DIGEST_FORMAT_OPTIONS } from "../lib/digest-preferences";

async function main() {
    const email = "utkarsh@encis.in";
    const frequencies = ["daily", "weekly", "monthly"] as const;

    for (const freq of frequencies) {
        console.log(`Sending real ${freq} preview email to ${email}...`);
        try {
            const result = await sendPreferenceDigestPreview({
                email: email,
                firstName: "Utkarsh",
                frequency: freq,
                formats: [...DIGEST_FORMAT_OPTIONS]
            });
            console.log(`Success for ${freq}! items: ${result.items}`);
        } catch (err) {
            console.error(`Failed to send ${freq} preview:`, err);
        }
    }
    process.exit(0);
}

main();
