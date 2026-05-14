import "dotenv/config";
import { sendPreferenceDigestPreview } from "../lib/preference-digests";

async function run() {
    const email = "utkarsh@encis.in";
    console.log(`Sending test digest to ${email}...`);
    try {
        const result = await sendPreferenceDigestPreview({
            email,
            firstName: "Utkarsh",
            frequency: "daily",
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Failed to send test digest:", e);
    }
}
run();
