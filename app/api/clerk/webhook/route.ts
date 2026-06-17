import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getClient } from "@/lib/db";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.warn("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
        return NextResponse.json({ error: "No secret configured" }, { status: 500 });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occured -- no svix headers", {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error occured", {
            status: 400,
        });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    if (eventType === "user.created") {
        const email = evt.data.email_addresses[0]?.email_address;
        const firstName = evt.data.first_name || "";
        const lastName = evt.data.last_name || "";

        let client;
        try {
            client = await getClient();
            await client.query("BEGIN");
            // Insert basic user, but don't set onboarding_completed to true
            await client.query(
                `INSERT INTO users (
                    clerk_id, email, first_name, last_name,
                    onboarding_completed, created_at
                ) VALUES ($1, $2, $3, $4, false, NOW())
                ON CONFLICT (clerk_id) DO NOTHING`,
                [id, email, firstName, lastName]
            );
            await client.query("COMMIT");
            console.log(`[Webhook] Created user in DB: ${id}`);
        } catch (error) {
            if (client) {
                try {
                    await client.query("ROLLBACK");
                } catch (rollbackErr) {
                    console.error("[Webhook] Rollback failed:", rollbackErr);
                }
            }
            console.error("[Webhook] Error inserting user:", error);
        } finally {
            if (client) client.release();
        }
    }

    if (eventType === "user.updated") {
        const email = evt.data.email_addresses[0]?.email_address;
        const firstName = evt.data.first_name || "";
        const lastName = evt.data.last_name || "";

        let client;
        try {
            client = await getClient();
            await client.query(
                `UPDATE users 
                 SET email = $2, first_name = $3, last_name = $4
                 WHERE clerk_id = $1`,
                [id, email, firstName, lastName]
            );
            console.log(`[Webhook] Updated user in DB: ${id}`);
        } catch (error) {
            console.error("[Webhook] Error updating user:", error);
        } finally {
            if (client) client.release();
        }
    }

    if (eventType === "user.deleted") {
        let client;
        try {
            client = await getClient();
            await client.query(`DELETE FROM users WHERE clerk_id = $1`, [id]);
            console.log(`[Webhook] Deleted user in DB: ${id}`);
        } catch (error) {
            console.error("[Webhook] Error deleting user:", error);
        } finally {
            if (client) client.release();
        }
    }

    return new Response("", { status: 200 });
}
