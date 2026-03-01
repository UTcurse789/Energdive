import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";
import { provisionUser } from "@/lib/queries";
import { sendPortalAccessEmail } from "@/lib/email";

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
            });
            clerkUserId = newUser.id;
            log(`Clerk user created: ${clerkUserId}`);
        }

        // ── 4. Generate magic token ─────────────────────────────────
        const magicToken = crypto.randomBytes(48).toString("base64url");
        const magicTokenExpiresAt = new Date(
            Date.now() + MAGIC_TOKEN_TTL_HOURS * 60 * 60 * 1000
        );

        // ── 5. Provision user in database ───────────────────────────
        const userId = await provisionUser({
            clerkId: clerkUserId,
            email,
            firstName,
            lastName,
            phone: body.phone || undefined,
            company: body.company || undefined,
            designation: body.designation || undefined,
            country: body.country || undefined,
            state: body.state || undefined,
            industryName: body.industry || undefined,
            subIndustryName: body.sub_industry || undefined,
            communityName: body.community || undefined,
            subCommunityName: body.sub_community || undefined,
            magicToken,
            magicTokenExpiresAt,
        });

        log(`DB user provisioned: id=${userId}`);

        // ── 6. Build magic link & send email via Brevo ──────────────
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://energdive.com";
        const magicLink = `${appUrl}/access?token=${encodeURIComponent(magicToken)}`;

        log(`Magic link generated for ${email}`);

        try {
            await sendPortalAccessEmail(email, firstName, magicLink);
            log(`Email sent via Brevo to ${email}`);
        } catch (emailErr: any) {
            console.error(`[PROVISION:${requestId}] Brevo email failed:`, emailErr.message);
        }

        // ── 7. Return success ───────────────────────────────────────
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
