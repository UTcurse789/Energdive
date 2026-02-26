import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import syncUserToBrevo from "@/lib/brevoSync";
import db from "@/lib/db";

export async function POST(req: Request) {
    const payload = await req.text();
    const headerPayload = await headers();

    const svixId = headerPayload.get("svix-id")!;
    const svixTimestamp = headerPayload.get("svix-timestamp")!;
    const svixSignature = headerPayload.get("svix-signature")!;

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    let event: any;

    try {
        event = wh.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });
    } catch (err) {
        return new NextResponse("Invalid signature", { status: 400 });
    }

    if (event.type === "user.created") {
        const { id, first_name, last_name } = event.data;

        const primaryEmailId = event.data.primary_email_address_id;

        const emailObj = event.data.email_addresses.find(
            (e: any) => e.id === primaryEmailId
        );

        const email = emailObj?.email_address;

        if (!email) {
            console.log("❌ No email found, skipping Brevo sync");
            return new Response("No email", { status: 200 });
        }

        const result = await db.query(
            `
    INSERT INTO users (clerk_id, email, first_name, last_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
            [id, email, first_name, last_name]
        );

        const newUser = result.rows[0];

        await syncUserToBrevo(newUser);

        console.log("✅ User synced to Brevo");
    }

    return NextResponse.json({ success: true });
}