import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertZohoLead, ZohoLeadData } from "@/lib/zoho-leads";

// Helper: accept both "value" and ["value"] — coerce string to array
const stringOrArray = z.preprocess(
    (val) => (typeof val === "string" ? [val] : val),
    z.array(z.string())
).optional();

// Define the schema for incoming lead data
const createLeadSchema = z.object({
    First_Name: z.string().min(1, "First Name is required"),
    Last_Name: z.string().min(1, "Last Name is required"),
    Email: z.string().email("Invalid email address"),
    Phone: z.string().optional(),
    Company: z.string().optional(),
    Designation: z.string().optional(),
    Lead_Source: z.string().default("Website Registration"),
    Industry: z.string().optional(),
    Industry_Sub_Category: z.string().optional(),
    Community: stringOrArray,
    Sub_Community: stringOrArray,
    Community_Portal: stringOrArray,
    Query_Type: z.string().default("EnergClub"),
});

/**
 * POST /api/zoho/create-lead
 *
 * Secure REST endpoint to create/update a Lead record in Zoho CRM.
 * Used for website signups instead of create-contact.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validate payload
        const parseResult = createLeadSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const leadData: ZohoLeadData = parseResult.data;

        // 2. Add or Update the Lead in Zoho CRM
        const result = await upsertZohoLead(leadData);

        return NextResponse.json({
            success: true,
            id: result.id,
            action: result.action,
            message: `Lead successfully ${result.action}`,
        });

    } catch (error: any) {
        console.error("[POST /api/zoho/create-lead] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process Zoho Lead", details: error.message },
            { status: 500 }
        );
    }
}
