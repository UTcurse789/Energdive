import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertZohoContact, ZohoContactData } from "@/lib/zoho-contacts";

// Helper: accept both "value" and ["value"] — coerce string to array
const stringOrArray = z.preprocess(
    (val) => (typeof val === "string" ? [val] : val),
    z.array(z.string())
).optional();

// Define the schema for incoming contact data
const createContactSchema = z.object({
    First_Name: z.string().min(1, "First Name is required"),
    Last_Name: z.string().min(1, "Last Name is required"),
    Email: z.string().email("Invalid email address"),
    Phone: z.string().optional(),
    Company: z.string().optional(),
    Lead_Source: z.string().default("Website Registration"),
    Industry_Category: z.string().optional(),
    Industry_Sub_Category: z.string().optional(),
    Industry: z.string().optional(), // Fallback alias
    Sub_Industry: z.string().optional(), // Fallback alias
    Community: stringOrArray,
    SubCommunity: stringOrArray,
    community_portal: stringOrArray,
    Query_Type: z.string().default("EnergClub"),
}).transform((data) => {
    // Alias mappings
    if (data.Industry && !data.Industry_Category) data.Industry_Category = data.Industry;
    if (data.Sub_Industry && !data.Industry_Sub_Category) data.Industry_Sub_Category = data.Sub_Industry;
    delete (data as any).Industry;
    delete (data as any).Sub_Industry;
    return data;
});

/**
 * POST /api/zoho/create-contact
 *
 * Exposes a secure REST endpoint to directly create/update a Contacts record 
 * in Zoho CRM. Useful for manual triggers or frontend form submissions.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Validate payload
        const parseResult = createContactSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const contactData: ZohoContactData = parseResult.data;

        // 2. Add or Update the Contact in Zoho CRM
        const result = await upsertZohoContact(contactData);

        return NextResponse.json({
            success: true,
            id: result.id,
            action: result.action,
            message: `Contact successfully ${result.action}`,
        });

    } catch (error: any) {
        console.error("[POST /api/zoho/create-contact] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process Zoho Contact", details: error.message },
            { status: 500 }
        );
    }
}
