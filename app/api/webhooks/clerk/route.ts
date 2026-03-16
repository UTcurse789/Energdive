import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import syncUserToBrevo from "@/lib/brevoSync";
import db from "@/lib/db";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { upsertZohoLead } from "@/lib/zoho-leads";

type ClerkEmailAddress = {
    id: string;
    email_address: string;
};

type ClerkPhoneNumber = {
    phone_number: string;
};

type ClerkWebhookEvent = {
    type: string;
    data: {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
        primary_email_address_id?: string | null;
        email_addresses?: ClerkEmailAddress[];
        phone_numbers?: ClerkPhoneNumber[];
    };
};

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const headerPayload = await headers();

        const svixId = headerPayload.get("svix-id");
        const svixTimestamp = headerPayload.get("svix-timestamp");
        const svixSignature = headerPayload.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("Missing Svix headers");
            return new NextResponse("Missing headers", { status: 400 });
        }

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

        let event: ClerkWebhookEvent;
        try {
            event = wh.verify(payload, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            }) as ClerkWebhookEvent;
        } catch (error) {
            console.error("Webhook verification failed:", error);
            return new NextResponse("Invalid signature", { status: 400 });
        }

        console.log("Webhook received:", event.type);

        if (event.type === "user.created" || event.type === "user.updated") {
            const { id, first_name, last_name } = event.data;
            const primaryEmailId = event.data.primary_email_address_id;
            const emailObj = event.data.email_addresses?.find(
                (entry) => entry.id === primaryEmailId
            );
            const email = emailObj?.email_address?.trim().toLowerCase();
            const phone = event.data.phone_numbers?.[0]?.phone_number || null;

            if (!email) {
                console.log("No email found, skipping sync");
                return NextResponse.json({ success: true });
            }

            let userRow;

            const existingByClerkId = await db.query(
                `SELECT *
                 FROM users
                 WHERE clerk_id = $1
                 LIMIT 1`,
                [id]
            );

            if (existingByClerkId.rows.length > 0) {
                userRow = (
                    await db.query(
                        `UPDATE users
                         SET email = $2,
                             first_name = COALESCE(first_name, $3),
                             last_name = COALESCE(last_name, $4),
                             phone = COALESCE(phone, $5),
                             updated_at = NOW()
                         WHERE id = $1
                         RETURNING *`,
                        [
                            existingByClerkId.rows[0].id,
                            email,
                            first_name || null,
                            last_name || null,
                            phone,
                        ]
                    )
                ).rows[0];
            } else {
                const candidateByEmail = await db.query(
                    `SELECT *
                     FROM users
                     WHERE LOWER(email) = LOWER($1)
                     ORDER BY
                       CASE WHEN clerk_id IS NULL THEN 0 ELSE 1 END,
                       CASE WHEN source = 'zoho_form' THEN 0 ELSE 1 END,
                       updated_at DESC NULLS LAST,
                       id DESC
                     LIMIT 1`,
                    [email]
                );

                if (candidateByEmail.rows.length > 0) {
                    userRow = (
                        await db.query(
                            `UPDATE users
                             SET clerk_id = $2,
                                 email = $3,
                                 first_name = COALESCE(first_name, $4),
                                 last_name = COALESCE(last_name, $5),
                                 phone = COALESCE(phone, $6),
                                 updated_at = NOW()
                             WHERE id = $1
                             RETURNING *`,
                            [
                                candidateByEmail.rows[0].id,
                                id,
                                email,
                                first_name || null,
                                last_name || null,
                                phone,
                            ]
                        )
                    ).rows[0];
                } else {
                    userRow = (
                        await db.query(
                            `INSERT INTO users (clerk_id, email, first_name, last_name, phone)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING *`,
                            [id, email, first_name || null, last_name || null, phone]
                        )
                    ).rows[0];
                }
            }

            const fullUser = await getFullUserProfile(id);
            const user = fullUser || userRow;

            const isDummyEmail = email.endsWith("@phone.energdive.com");
            if (isDummyEmail) {
                console.log("Skipping Brevo sync for dummy email:", email);
            } else {
                try {
                    await syncUserToBrevo(user);
                    console.log("Synced to Brevo:", email);
                } catch (error) {
                    console.error("Brevo sync failed:", error);
                }
            }

            try {
                const toArray = (arr: Array<string | null> | undefined) => {
                    if (!arr) return undefined;
                    const filtered = arr.filter((value): value is string => value !== null && value !== undefined && value !== "");
                    return filtered.length > 0 ? filtered : undefined;
                };

                const leadData = {
                    First_Name: user.first_name || "Unknown",
                    Last_Name: user.last_name || "Unknown",
                    Email: user.email,
                    Phone: user.phone || undefined,
                    Company: user.organization || undefined,
                    Designation: user.job_title || undefined,
                    Lead_Source: "Website Registration",
                    Industry: user.industries?.find((value: string | null) => !!value) || undefined,
                    Industry_Sub_Category: user.sub_industries?.find((value: string | null) => !!value) || undefined,
                    Community: toArray(user.communities),
                    Sub_Community: toArray(user.sub_communities),
                    Invite_Source: "EnergClub",
                    City: user.state || undefined,
                    Country: user.country || undefined,
                };

                console.log("[ZOHO_LEADS] Webhook sync payload:", JSON.stringify(leadData, null, 2));
                const zohoResult = await upsertZohoLead(leadData);

                await db.query(
                    `UPDATE users
                     SET crm_lead_id = $2,
                         updated_at = NOW()
                     WHERE id = $1`,
                    [userRow.id, zohoResult.id]
                );

                console.log("Synced to Zoho Leads:", email, zohoResult);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("Zoho Lead sync failed:", message);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook handler crashed:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
