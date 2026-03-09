import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import syncUserToBrevo from "@/lib/brevoSync";
import db from "@/lib/db";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { upsertZohoContact, convertLeadToContact } from "@/lib/zoho-contacts";
import { getLeadByEmail } from "@/lib/zoho";

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

            // Sync to Zoho Contacts (with Lead conversion if applicable)
            try {
                // Helper: return non-empty array or undefined
                const toArray = (arr: any[] | undefined) => {
                    if (!arr) return undefined;
                    const filtered = arr.filter((v: any) => v !== null && v !== undefined && v !== '');
                    return filtered.length > 0 ? filtered : undefined;
                };

                const contactData = {
                    First_Name: user.first_name || "Unknown",
                    Last_Name: user.last_name || "Unknown",
                    Email: user.email,
                    Phone: user.phone || undefined,
                    Company: user.organization || undefined,
                    Lead_Source: "Website Registration",
                    Industry_Category: user.industries?.find((i: string | null) => !!i) || undefined,
                    Industry_Sub_Category: user.sub_industries?.find((i: string | null) => !!i) || undefined,
                    Community: toArray(user.communities),
                    SubCommunity: toArray(user.sub_communities),
                    community_portal: toArray(user.sub_communities),
                    Query_Type: "EnergClub",
                };

                // Check if a Lead already exists for this email
                const existingLead = await getLeadByEmail(email);

                if (existingLead) {
                    // Convert the Lead to a Contact instead of creating a duplicate
                    console.log(`📋 [ZOHO] Found existing Lead ${existingLead.id} for ${email}. Converting to Contact...`);
                    const conversionResult = await convertLeadToContact(existingLead.id, contactData);
                    if (conversionResult) {
                        console.log(`✅ Lead ${existingLead.id} converted to Contact ${conversionResult.contactId}`);
                    } else {
                        // Conversion failed — fall back to creating/updating Contact directly
                        console.warn(`⚠️ Lead conversion failed, falling back to upsert for ${email}`);
                        await upsertZohoContact(contactData);
                    }
                } else {
                    // No existing Lead — create/update Contact directly
                    console.log("📋 [ZOHO_CONTACTS] No Lead found, upserting Contact:", JSON.stringify(contactData, null, 2));
                    await upsertZohoContact(contactData);
                }
                console.log("✅ Synced to Zoho Contacts:", email);
            } catch (zohoErr: any) {
                console.error("❌ Zoho Contact sync failed:", zohoErr.message);
                // We DO NOT fail webhook if Zoho sync fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("💥 Webhook handler crashed:", err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}