import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import syncUserToBrevo from "@/lib/brevoSync";
import db from "@/lib/db";
import { getFullUserProfile } from "@/lib/getFullUserProfile";

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const headerPayload = await headers();

        const svixId = headerPayload.get("svix-id");
        const svixTimestamp = headerPayload.get("svix-timestamp");
        const svixSignature = headerPayload.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("❌ Missing Svix headers");
            return new NextResponse("Missing headers", { status: 400 });
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

        let event: any;

        try {
            event = wh.verify(payload, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            });
        } catch (err) {
            console.error("❌ Webhook verification failed:", err);
            return new NextResponse("Invalid signature", { status: 400 });
        }

        console.log("🔥 Webhook received:", event.type);

        // ---------------------------------------------------
        // USER CREATED
        // ---------------------------------------------------
        if (event.type === "user.created" || event.type === "user.updated") {
            const { id, first_name, last_name } = event.data;

            const primaryEmailId = event.data.primary_email_address_id;

            const emailObj = event.data.email_addresses?.find(
                (e: any) => e.id === primaryEmailId
            );

            const email = emailObj?.email_address;

            if (!email) {
                console.log("⚠️ No email found, skipping Brevo sync");
                return NextResponse.json({ success: true });
            }

            // UPSERT (idempotent)
            const result = await db.query(
                `
        INSERT INTO users (clerk_id, email, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (clerk_id)
        DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
        RETURNING *;
        `,
                [id, email, first_name, last_name]
            );

            // Fetch full profile with community/industry data from join tables
            const fullUser = await getFullUserProfile(id);
            const user = fullUser || result.rows[0];

            try {
                await syncUserToBrevo(user);
                console.log("✅ Synced to Brevo:", email);
            } catch (brevoErr) {
                console.error("❌ Brevo sync failed:", brevoErr);
                // We DO NOT fail webhook if Brevo fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("💥 Webhook handler crashed:", err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}