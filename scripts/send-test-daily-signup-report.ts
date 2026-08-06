import "dotenv/config";
import { sendTestDailySignupReport } from "@/lib/daily-signup-report";

async function main() {
    const result = await sendTestDailySignupReport();
    console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
    console.error("[DAILY-SIGNUP-REPORT-TEST] Failed:", error);
    process.exit(1);
});
