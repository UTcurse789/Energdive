import { processPreferenceDigests } from "../lib/preference-digests";

async function run() {
    console.log("Testing digest...");
    try {
        const result = await processPreferenceDigests({ limit: 1 });
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
