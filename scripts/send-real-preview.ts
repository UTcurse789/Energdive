import "dotenv/config";
import { sendPreferenceDigestPreview } from "../lib/preference-digests";
import { DIGEST_FORMAT_OPTIONS } from "../lib/digest-preferences";

async function main() {
    const email = "utkarsh@encis.in";
    console.log(`Sending real preview email to ${email}...`);
    
    try {
        const result = await sendPreferenceDigestPreview({
            email: email,
            firstName: "Utkarsh",
            frequency: "daily",
            formats: [...DIGEST_FORMAT_OPTIONS] // Send all available formats
        });
        
        console.log("Success!", result);
    } catch (err) {
        console.error("Failed to send real preview:", err);
    }
    process.exit(0);
}

main();
