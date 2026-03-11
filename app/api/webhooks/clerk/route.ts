import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import syncUserToBrevo from "@/lib/brevoSync";
import db from "@/lib/db";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { upsertZohoLead } from "@/lib/zoho-leads";

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
        // USER CREATED / UPDATED
        // ---------------------------------------------------
        if (event.type === "user.created" || event.type === "user.updated") {
            const { id, first_name, last_name } = event.data;

            const primaryEmailId = event.data.primary_email_address_id;

            const emailObj = event.data.email_addresses?.find(
                (e: any) => e.id === primaryEmailId
            );

            const email = emailObj?.email_address;

            // Extract phone number from Clerk user data
            const phoneObj = event.data.phone_numbers?.[0];
            const phone = phoneObj?.phone_number || null;

            if (!email) {
                console.log("⚠️ No email found, skipping Brevo sync");
                return NextResponse.json({ success: true });
            }

            // UPSERT (idempotent) — includes phone
            const result = await db.query(
                `
        INSERT INTO users (clerk_id, email, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (clerk_id)
        DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = COALESCE(EXCLUDED.phone, users.phone)
        RETURNING *;
        `,
                [id, email, first_name, last_name, phone]
            );

            // Fetch full profile with community/industry data from join tables
            const fullUser = await getFullUserProfile(id);
            const user = fullUser || result.rows[0];

            // Skip Brevo sync for dummy/placeholder emails
            const isDummyEmail = email?.endsWith?.('@phone.energdive.com');
            if (isDummyEmail) {
                console.log("⚠️ Skipping Brevo sync — dummy email:", email);
            } else {
                try {
                    await syncUserToBrevo(user);
                    console.log("✅ Synced to Brevo:", email);
                } catch (brevoErr) {
                    console.error("❌ Brevo sync failed:", brevoErr);
                    // We DO NOT fail webhook if Brevo fails
                }
            }

            // Sync to Zoho as a Lead (NOT Contact — preserves Lead records for Magic Link flow)
            try {
                // Helper: return non-empty array or undefined
                const toArray = (arr: any[] | undefined) => {
                    if (!arr) return undefined;
                    const filtered = arr.filter((v: any) => v !== null && v !== undefined && v !== '');
                    return filtered.length > 0 ? filtered : undefined;
                };

                // DB sub_communities are in "Community-SubPart" format (e.g. "Distribution-Data Centres")
                // which is the Community_Portal format. Pass them as Community_Portal and let
                // upsertZohoLead's parseCommunityPortal derive Community/Sub_Community correctly.
                const leadData = {
                    First_Name: user.first_name || "Unknown",
                    Last_Name: user.last_name || "Unknown",
                    Email: user.email,
                    Phone: user.phone || undefined,
                    Company: user.organization || undefined,
                    Designation: user.job_title || undefined,
                    Lead_Source: "Website Registration",
                    Industry: user.industries?.find((i: string | null) => !!i) || undefined,
                    Industry_Sub_Category: user.sub_industries?.find((i: string | null) => !!i) || undefined,
                    Community_Portal: toArray(user.sub_communities),
                    Invite_Source: "EnergClub",
                    City: user.state || undefined,
                    Country: user.country || undefined,
                };

                console.log("📋 [ZOHO_LEADS] Webhook sync payload:", JSON.stringify(leadData, null, 2));
                const zohoResult = await upsertZohoLead(leadData);
                console.log("✅ Synced to Zoho Leads:", email, zohoResult);
            } catch (zohoErr: any) {
                console.error("❌ Zoho Lead sync failed:", zohoErr.message);
                // We DO NOT fail webhook if Zoho sync fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("💥 Webhook handler crashed:", err);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}