/** Baseline publication timestamps before enabling the new worker. No SMTP. */
import "dotenv/config";
import { fetchBriefingContents } from "../lib/briefing-content";
import { preserveOriginalPublicationDates } from "../lib/briefing-store";

async function main() {
    const items = await preserveOriginalPublicationDates(await fetchBriefingContents(new Date()));
    console.log(`Preserved publication timestamps for ${items.length} published newsletter content items.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
