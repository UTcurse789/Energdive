import { getClient } from "./lib/db";
import { createClerkClient } from "@clerk/nextjs/server";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

async function run() {
    const client = await getClient();
    try {
        const res = await client.query("SELECT clerk_id, first_name, last_name, email FROM users WHERE first_name IS NOT NULL");
        console.log(`Found ${res.rows.length} users in DB with a first name.`);

        for (const row of res.rows) {
            try {
                const clerkUser = await clerk.users.getUser(row.clerk_id);
                if (clerkUser.firstName !== row.first_name || clerkUser.lastName !== row.last_name) {
                    console.log(`Syncing ${row.first_name} ${row.last_name} to Clerk for ${row.clerk_id}...`);
                    await clerk.users.updateUser(row.clerk_id, {
                        firstName: row.first_name,
                        lastName: row.last_name || "",
                    });
                } else {
                    console.log(`User ${row.clerk_id} already synced.`);
                }
            } catch (err: any) {
                console.error(`Failed to sync ${row.clerk_id}:`, err.message);
            }
        }
        console.log("Done.");
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();
