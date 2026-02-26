import { query } from "./lib/db";

async function run() {
    try {
        const res = await query("SELECT clerk_id, email, first_name, last_name, phone, onboarding_completed, created_at FROM users ORDER BY created_at DESC LIMIT 5");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

run();
