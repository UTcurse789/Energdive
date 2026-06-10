import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";
import { provisionUser } from "@/lib/queries";
import { sendPortalAccessEmail } from "@/lib/email";
import { parseCommunityPortal } from "@/lib/zoho-leads";
import { getZohoAccessToken } from "@/lib/zoho";

const WEBHOOK_SECRET = process.env.ZOHO_WEBHOOK_SECRET || "";
const MAGIC_TOKEN_TTL_HOURS = 24;

/**
 * POST /api/zoho/provision
 *
 * Zoho CRM webhook endpoint. Called by a Deluge function when
 * "Portal Access = Yes" is set on a lead.
 *
 * Idempotent — safe for Zoho retries. Uses upsert + Clerk find-or-create.
 *
 * Expected headers:
 *   x-webhook-secret: <ZOHO_WEBHOOK_SECRET>
 *
 * Expected body:
 * {
 *   first_name, last_name, email, phone, company, designation,
 *   country, state, industry, sub_industry, community, sub_community
 * }
 */
export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const log = (msg: string) => console.log(`[PROVISION:${requestId}] ${msg}`);
    const warn = (msg: string) => console.warn(`[PROVISION:${requestId}] ${msg}`);

    try {
        // ── 1. Validate webhook secret ──────────────────────────────
        const secret = req.headers.get("x-webhook-secret");

        if (!WEBHOOK_SECRET) {
            console.error("[PROVISION] ZOHO_WEBHOOK_SECRET env var is not set");
            return NextResponse.json(
                { success: false, error: "Server misconfigured" },
                { status: 500 }
            );
        }

        if (!secret || secret !== WEBHOOK_SECRET) {
            warn("Invalid or missing x-webhook-secret header");
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // ── 2. Parse payload ────────────────────────────────────────
        let body: Record<string, any>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const email = (body.email || "").trim().toLowerCase();
        const firstName = (body.first_name || "").trim();
        const lastName = (body.last_name || "").trim();

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Missing email field" },
                { status: 400 }
            );
        }

        if (!firstName || !lastName) {
            return NextResponse.json(
                { success: false, error: "Missing first_name or last_name" },
                { status: 400 }
            );
        }

        log(`Processing: ${email} (${firstName} ${lastName})`);

        // ── 3. Find or create Clerk user ────────────────────────────
        const client = await clerkClient();
        let clerkUserId: string;

        const existingUsers = await client.users.getUserList({
            emailAddress: [email],
        });

        if (existingUsers.data.length > 0) {
            clerkUserId = existingUsers.data[0].id;
            log(`Clerk user exists: ${clerkUserId}`);

            // Update name if needed
            try {
                await client.users.updateUser(clerkUserId, {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    publicMetadata: {
                        ...(body.phone?.trim() ? { phone: body.phone.trim() } : {}),
                        onboarding_completed: true,
                    },
                });
            } catch (updateErr: any) {
                warn(`Clerk user update failed (non-fatal): ${updateErr.message}`);
            }
        } else {
            const newUser = await client.users.createUser({
                emailAddress: [email],
                firstName,
                lastName,
                skipPasswordRequirement: true,
                publicMetadata: {
                    ...(body.phone?.trim() ? { phone: body.phone.trim() } : {}),
                    onboarding_completed: true,
                },
            });
            clerkUserId = newUser.id;
            log(`Clerk user created: ${clerkUserId}`);
        }

        // ── 4. Generate magic token ─────────────────────────────────
        const magicToken = crypto.randomBytes(48).toString("base64url");
        const magicTokenExpiresAt = new Date(
            Date.now() + MAGIC_TOKEN_TTL_HOURS * 60 * 60 * 1000
        );

        // Helper to extract first string from potentially array/multiselect fields
        const getFirstString = (val: any): string | undefined => {
            if (!val) return undefined;
            if (Array.isArray(val)) {
                const first = val[0];
                return first && first !== "undefined" && first !== "null" ? String(first).trim() : undefined;
            }
            if (typeof val === "string") {
                const trimmed = val.trim();
                // Ignore literal "undefined" / "null" sent by Zoho's ifnull deluge script
                if (trimmed === "undefined" || trimmed === "null" || trimmed === "") return undefined;
                return trimmed;
            }
            const str = String(val).trim();
            if (str === "undefined" || str === "null" || str === "") return undefined;
            return str;
        };

        // Helper to extract ALL strings from potentially array/multiselect/semicolon-separated fields
        const getAllStrings = (val: any): string[] => {
            if (!val) return [];
            if (Array.isArray(val)) {
                return val
                    .map((v: any) => String(v).trim())
                    .filter(v => v && v !== "undefined" && v !== "null");
            }
            if (typeof val === "string") {
                // Zoho may send semicolon-separated values
                return val.split(";")
                    .map(v => v.trim())
                    .filter(v => v && v !== "undefined" && v !== "null");
            }
            const str = String(val).trim();
            if (str === "undefined" || str === "null" || str === "") return [];
            return [str];
        };

        // ── 5. Log raw Zoho payload for debugging ───────────────────
        log(`Raw Zoho body keys: ${Object.keys(body).join(", ")}`);
        log(`Raw body.phone=${body.phone}, body.Phone=${body.Phone}`);
        log(`Raw body.community=${body.community}, body.Community=${body.Community}`);
        log(`Raw body.sub_community=${body.sub_community}, body.Sub_Community=${body.Sub_Community}`);
        log(`Raw body.community_portal=${body.community_portal}, body.Community_Portal=${body.Community_Portal}`);

        // Handle case-insensitive field names from Zoho Deluge
        let rawPhone = body.phone || body.Phone;
        let rawCompany = body.company || body.Company;
        let rawDesignation = body.designation || body.Designation;
        let rawCountry = body.country || body.Country;
        let rawState = body.state || body.State;
        let rawIndustry = body.industry || body.Industry;
        let rawSubIndustry = body.sub_industry || body.Sub_Industry || body.Industry_Sub_Category;
        let rawCommunity = body.community || body.Community;
        let rawSubCommunity = body.sub_community || body.Sub_Community;
        let rawCommunityPortal = body.community_portal || body.Community_Portal;

        // --- BULLETPROOF FALLBACK ---
        // If the Deluge script in Zoho CRM is outdated and didn't send community_portal or phone,
        // we fetch the Lead directly from Zoho API to guarantee we have the correct data!
        const leadIdStr = (body.crm_lead_id || body.lead_id || "").toString().trim();
        if (leadIdStr && (!rawPhone || !rawCommunityPortal)) {
            log(`Missing phone or community_portal in webhook payload. Fetching lead ${leadIdStr} directly from Zoho CRM...`);
            try {
                const token = await getZohoAccessToken();
                const zohoUrl = `${process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in'}/crm/v2/Leads/${leadIdStr}`;
                const zohoRes = await fetch(zohoUrl, {
                    headers: { Authorization: `Zoho-oauthtoken ${token}` }
                });
                if (zohoRes.ok) {
                    const zohoData = await zohoRes.json();
                    if (zohoData.data && zohoData.data.length > 0) {
                        const lead = zohoData.data[0];
                        log(`Zoho API hit successful. Lead data: Mobile=${lead.Mobile}, Phone=${lead.Phone}, Community_Portal=${lead.Community_Portal}`);
                        
                        rawPhone = rawPhone || lead.Mobile || lead.Phone;
                        rawCommunityPortal = rawCommunityPortal || lead.Community_Portal;
                        rawIndustry = rawIndustry || lead.Industry;
                        rawSubIndustry = rawSubIndustry || lead.Industry_Sub_Category;
                        rawCommunity = rawCommunity || lead.Community;
                        rawSubCommunity = rawSubCommunity || lead.Sub_Community;
                    }
                } else {
                    warn(`Zoho API fetch failed with status ${zohoRes.status}`);
                }
            } catch (zohoErr: any) {
                warn(`Zoho API fetch threw error: ${zohoErr.message}`);
            }
        }

        // Parse community data — try direct fields first, then community_portal
        let communityNames = getAllStrings(rawCommunity);
        let subCommunityNames = getAllStrings(rawSubCommunity);

        if (communityNames.length === 0 && subCommunityNames.length === 0) {
            const portalValues = getAllStrings(rawCommunityPortal);
            if (portalValues.length > 0) {
                const parsed = parseCommunityPortal(portalValues);
                communityNames = parsed.communities;
                subCommunityNames = parsed.subCommunities;
                log(`Parsed community_portal → communities: [${communityNames}], subs: [${subCommunityNames}]`);
            }
        }

        log(`Final communityNames: [${communityNames}], subCommunityNames: [${subCommunityNames}], phone: ${getFirstString(rawPhone)}`);

        // ── 6. Provision user in database ───────────────────────────
        const userId = await provisionUser({
            clerkId: clerkUserId,
            email,
            firstName,
            lastName,
            phone: getFirstString(rawPhone),
            company: getFirstString(rawCompany),
            designation: getFirstString(rawDesignation),
            country: getFirstString(rawCountry),
            state: getFirstString(rawState),
            industryName: getFirstString(rawIndustry),
            subIndustryName: getFirstString(rawSubIndustry),
            communityNames,
            subCommunityNames,
            magicToken,
            magicTokenExpiresAt,
            source: "crm_invite",
            crmLeadId: leadIdStr || undefined,
        });

        log(`DB user provisioned: id=${userId}`);

        // ── 7. Build magic link & send email via Brevo ──────────────
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.energdive.com";
        const magicLink = `${appUrl}/access?token=${encodeURIComponent(magicToken)}`;

        log(`Magic link generated for ${email}`);

        try {
            await sendPortalAccessEmail(email, firstName, magicLink);
            log(`Email sent via Brevo to ${email}`);
        } catch (emailErr: any) {
            console.error(`[PROVISION:${requestId}] Brevo email failed:`, emailErr.message);
        }

        // ── 8. Return success ───────────────────────────────────────
        return NextResponse.json({
            success: true,
            userId,
            clerkUserId,
            magicLink,
            magicLinkExpiry: magicTokenExpiresAt.toISOString(),
        });

    } catch (error: any) {
        console.error(`[PROVISION:${requestId}] Unhandled error:`, error);

        // Return 200 for known data errors to prevent Zoho retries on bad data
        if (error.code === "23505") {
            // Unique constraint violation — likely a race condition on parallel retries
            return NextResponse.json({
                success: true,
                message: "User already provisioned (concurrent request)",
            });
        }

        return NextResponse.json(
            { success: false, error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
