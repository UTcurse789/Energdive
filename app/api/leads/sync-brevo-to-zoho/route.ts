import { NextResponse } from "next/server";
import { upsertZohoLead } from "@/lib/zoho-leads";

export const maxDuration = 60; // Allow more time for batch operations

export async function GET(req: Request) {
    // Only allow admin or secure triggering if needed, but for now we'll just execute
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        const axios = (await import("axios")).default;
        
        // 1. Fetch contacts from Brevo List 7
        const res = await axios.get(
            `https://api.brevo.com/v3/contacts/lists/7/contacts?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                },
            }
        );

        const contacts = res.data?.contacts || [];
        
        if (contacts.length === 0) {
            return NextResponse.json({ success: true, message: "No contacts found in list 7." });
        }

        const ITEN_MEDIA_OWNER = process.env.ZOHO_ITEN_MEDIA_OWNER_ID || "651593000000305001";
        const results = [];

        // 2. Iterate through contacts and push to Zoho CRM
        for (const contact of contacts) {
            try {
                const attrs = contact.attributes || {};
                const email = contact.email;
                if (!email) continue;

                const bCommunities = attrs.COMMUNITY ? attrs.COMMUNITY.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined;
                const bSubCommunities = attrs.SUB_COMMUNITY ? attrs.SUB_COMMUNITY.split(",").map((s: string) => s.trim()).filter(Boolean) : undefined;

                const zohoResult = await upsertZohoLead({
                    Email: email,
                    First_Name: attrs.FIRSTNAME || "",
                    Last_Name: attrs.LASTNAME || "",
                    Phone: attrs.PHONE || undefined,
                    Company: attrs.ORGANISATION || undefined,
                    Designation: attrs.JOB_TITLE || undefined,
                    Industry: attrs.INDUSTRY || undefined,
                    Industry_Sub_Category: attrs.SUB_INDUSTRY || undefined,
                    Community: bCommunities,
                    Sub_Community: bSubCommunities,
                    Lead_Source: "Portal Verified",
                    Invite_Source: "EnergClub",
                    Owner: ITEN_MEDIA_OWNER,
                });

                results.push({ email, status: "success", action: zohoResult.action, id: zohoResult.id });
                
                // Keep under Zoho API rate limit (max ~100 per minute for single ops)
                await new Promise((resolve) => setTimeout(resolve, 600)); 
            } catch (err: any) {
                results.push({ email: contact.email, status: "error", error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            totalProcessed: contacts.length,
            results
        });

    } catch (error: any) {
        console.error("[SYNC_BREVO_ZOHO] Error executing sync:", error?.response?.data || error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
