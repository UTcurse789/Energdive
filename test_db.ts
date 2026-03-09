import { getFullUserProfile } from "./lib/getFullUserProfile";
import db from "./lib/db";
import fs from "fs";

async function run() {
    try {
        const res = await db.query('SELECT clerk_id FROM users ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length === 0) {
            console.log("No users found.");
            return;
        }
        const clerkId = res.rows[0].clerk_id;
        const profile = await getFullUserProfile(clerkId);
        fs.writeFileSync('test_output.json', JSON.stringify(profile, null, 2));
        console.log("Wrote to test_output.json");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
