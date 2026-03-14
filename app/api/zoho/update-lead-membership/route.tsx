import { NextRequest, NextResponse } from "next/server";
import { getZohoAccessToken } from "@/lib/zoho";

const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in"}/crm/v2`;

/**
 * POST /api/zoho/update-lead-membership
 *
 * Internal utility — called by confirm-otp after a membership ID is assigned.
 * Updates BOTH the original lead and the duplicate lead in Zoho CRM
 * with the membership_id and verification status.
 *
 * Body: {
 *   originalLeadId?: string,
 *   duplicateLeadId?: string,
 *   membershipId: string,
 *   secret: string   // must match ZOHO_WEBHOOK_SECRET
 * }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
    try {
        const { originalLeadId, duplicateLeadId, membershipId, secret } = await req.json();

        if (secret !== process.env.ZOHO_WEBHOOK_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!membershipId) {
            return NextResponse.json({ error: "membershipId is required" }, { status: 400 });
        }

        const token = await getZohoAccessToken();
        const results: Record<string, string> = {};

        const updateRecord = async (leadId: string, label: string) => {
            const res = await fetch(`${ZOHO_API_URL}/Leads/${leadId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Zoho-oauthtoken ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: [
                        {
                            // Store membership info in Description (standard field, always exists)
                            Description: `Membership ID: ${membershipId}\nVerification: Double Opt-In Verified`,
                            Lead_Source: "Portal Verified",
                        },
                    ],
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Zoho update ${label} failed: ${res.status} ${err}`);
            }

            const data = await res.json();
            const status = data.data?.[0]?.code;
            results[label] = status || "unknown";
            console.log(`[update-lead-membership] ${label} (${leadId}): ${status}`);
        };

        if (originalLeadId) await updateRecord(originalLeadId, "original");
        if (duplicateLeadId) await updateRecord(duplicateLeadId, "duplicate");

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("[update-lead-membership] Error:", error.message);
        return NextResponse.json(
            { error: "Failed to update Zoho lead", details: error.message },
            { status: 500 }
        );
    }
}