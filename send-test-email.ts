import { sendPreferenceDigestPreview } from "./lib/preference-digests";

async function main() {
    try {
        const result = await sendPreferenceDigestPreview({
            email: "sankalp@itenmedia.in",
            frequency: "daily"
        });
        console.log("Email sent result:", result);
    } catch (e) {
        console.error("Error sending preview:", e);
    }
}

main();
