import { NextResponse } from "next/server";
import { createZohoLead } from "@/lib/zoho-leads";

export const maxDuration = 60; // Allow more time for batch operations

export async function GET(req: Request) {
    // Only allow admin or secure triggering if needed, but for now we'll just execute
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        const axios = (await import("axios")).default;

        // 1. Fetch contact list from Brevo List 7
        //    NOTE: This endpoint only returns email + id, NOT attributes.
        //    We must fetch each contact individually to get COMMUNITY, INDUSTRY, etc.
        const res = await axios.get(
            `https://api.brevo.com/v3/contacts/lists/7/contacts?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                },
            }
        );

        const contactSummaries: Array<{ email: string; id: number }> = res.data?.contacts || [];

        if (contactSummaries.length === 0) {
            return NextResponse.json({ success: true, message: "No contacts found in list 7." });
        }

        const ITEN_MEDIA_OWNER = process.env.ZOHO_ITEN_MEDIA_OWNER_ID || "651593000000305001";
        const results = [];

        // 2. For each contact, fetch full attributes then push to Zoho CRM
        for (const summary of contactSummaries) {
            const email = summary.email;
            if (!email) continue;

            try {
                // Fetch full contact details (attributes included)
                let attrs: Record<string, any> = {};
                try {
                    const contactRes = await axios.get(
                        `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
                        {
                            headers: {
                                "api-key": process.env.BREVO_API_KEY!,
                            },
                        }
                    );
                    attrs = contactRes.data?.attributes || {};
                } catch (fetchErr: any) {
                    console.warn(`[SYNC_BREVO_ZOHO] Could not fetch full contact for ${email}:`, fetchErr.message);
                    // Continue with empty attrs — still try to create in Zoho with email only
                }

                const bCommunities = attrs.COMMUNITY
                    ? attrs.COMMUNITY.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : undefined;
                const bSubCommunities = attrs.SUB_COMMUNITY
                    ? attrs.SUB_COMMUNITY.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : undefined;

                const zohoResult = await createZohoLead({
                    Email: email,
                    First_Name: attrs.FIRSTNAME || "",
                    Last_Name: attrs.LASTNAME || "",
                    Phone: attrs.PHONE || undefined,
                    Mobile: attrs.PHONE || undefined,
                    Company: attrs.ORGANISATION || undefined,
                    Designation: attrs.JOB_TITLE || undefined,
                    Industry: attrs.INDUSTRY || undefined,
                    Industry_Sub_Category: attrs.SUB_INDUSTRY || undefined,
                    Community: bCommunities,
                    Sub_Community: bSubCommunities,
                    Lead_Source: "ENDV Portal CRM Lead",
                    Invite_Source: "EnergClub",
                    UTM_Source: attrs.UTM_SOURCE || undefined,
                    UTM_Medium: attrs.UTM_MEDIUM || undefined,
                    UTM_Campaign: attrs.UTM_CAMPAIGN || undefined,
                    UTM_Term: attrs.UTM_TERM || undefined,
                    UTM_Content: attrs.UTM_CONTENT || undefined,
                    Owner: ITEN_MEDIA_OWNER,
                });

                results.push({ email, status: "success", action: zohoResult.action, id: zohoResult.id });

                // Keep under Zoho API rate limit (~100 req/min for single ops)
                await new Promise((resolve) => setTimeout(resolve, 700));
            } catch (err: any) {
                results.push({ email, status: "error", error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            totalProcessed: contactSummaries.length,
            results,
        });

    } catch (error: any) {
        console.error("[SYNC_BREVO_ZOHO] Error executing sync:", error?.response?.data || error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
