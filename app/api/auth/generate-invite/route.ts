import { NextRequest, NextResponse } from "next/server";
import { getLeadByEmail } from "@/lib/zoho";
import { generateMagicToken } from "@/lib/magic-token";

/**
 * POST /api/auth/generate-invite
 * Body: { email: string }
 *
 * Generates a self-verifying magic link.
 * Attempts to verify the lead in Zoho first, but proceeds even if Zoho is unavailable.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = body.email;

        if (!email) {
            return NextResponse.json(
                { error: "Missing email in request body" },
                { status: 400 }
            );
        }

        // 1. Try to verify lead exists in Zoho (best-effort)
        let leadId: string | null = null;
        try {
            const lead = await getLeadByEmail(email);
            if (lead) {
                leadId = lead.id;
                console.log(`[INVITE] Zoho lead verified: ${leadId}`);
            } else {
                console.warn(`[INVITE] No matching lead found in Zoho for ${email}`);
            }
        } catch (zohoError: any) {
            console.warn(`[INVITE] Zoho unavailable (${zohoError.message}), generating link anyway`);
        }

        // 2. Generate signed token
        const { token, expiresAt } = generateMagicToken(email);

        // 3. Construct invite URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
        const inviteUrl = `${appUrl}/api/auth/invite?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

        console.log(`[INVITE] Generated magic link for ${email}, expires: ${expiresAt}`);

        return NextResponse.json({
            success: true,
            inviteUrl,
            expiresAt,
            ...(leadId && { leadId }),
        });
    } catch (error: any) {
        console.error("Generate invite error:", error);
        return NextResponse.json(
            { error: "Failed to generate invite", details: error.message },
            { status: 500 }
        );
    }
}
