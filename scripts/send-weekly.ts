import "dotenv/config";
import { sendPreferenceDigestPreview } from "../lib/preference-digests";
import { DIGEST_FORMAT_OPTIONS } from "../lib/digest-preferences";

async function main() {
    console.log("Sending FRESH weekly...");
    try {
        const result = await sendPreferenceDigestPreview({
            email: "utkarsh@encis.in",
            firstName: "Utkarsh",
            frequency: "weekly",
            formats: [...DIGEST_FORMAT_OPTIONS]
        });
        console.log("Success! items:", result.items);
    } catch (err) {
        console.error("Failed:", err);
    }
    process.exit(0);
}
main();
