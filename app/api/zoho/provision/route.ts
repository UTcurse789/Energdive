import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getClient, query } from "@/lib/db";
import { generateMagicToken } from "@/lib/magic-token";
import { updateLeadFields } from "@/lib/zoho";
import { sendMagicLinkEmail } from "@/lib/brevo";

// Optional webhook secret for security
const WEBHOOK_SECRET = process.env.ZOHO_WEBHOOK_SECRET;

/* ==========================================================
   FIELD MAPPING — Case-insensitive lookup helpers
   ========================================================== */

async function lookupIndustry(name: string): Promise<number | null> {
    if (!name) return null;
    const res = await query(
        `SELECT id FROM industry WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [name.trim()]
    );
    return res.rows[0]?.id ?? null;
}

async function lookupSubIndustry(name: string, industryId?: number | null): Promise<number | null> {
    if (!name) return null;
    const res = industryId
        ? await query(
            `SELECT id FROM sub_industries WHERE LOWER(name) = LOWER($1) AND industry_id = $2 LIMIT 1`,
            [name.trim(), industryId]
        )
        : await query(
            `SELECT id FROM sub_industries WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [name.trim()]
        );
    return res.rows[0]?.id ?? null;
}

async function lookupCommunity(name: string): Promise<number | null> {
    if (!name) return null;
    const res = await query(
        `SELECT id FROM communities WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [name.trim()]
    );
    return res.rows[0]?.id ?? null;
}

async function lookupSubCommunity(name: string, communityId?: number | null): Promise<number | null> {
    if (!name) return null;
    const res = communityId
        ? await query(
            `SELECT id FROM sub_communities WHERE LOWER(name) = LOWER($1) AND community_id = $2 LIMIT 1`,
            [name.trim(), communityId]
        )
        : await query(
            `SELECT id FROM sub_communities WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [name.trim()]
        );
    return res.rows[0]?.id ?? null;
}

/* ==========================================================
   POST /api/zoho/provision
   Called by Zoho Workflow when "Portal Access" = Yes
   ========================================================== */

export async function POST(request: NextRequest) {
    try {
        // 1. Verify webhook secret (if configured)
        if (WEBHOOK_SECRET) {
            const secret = request.headers.get("x-webhook-secret");
            if (secret !== WEBHOOK_SECRET) {
                console.error("[PROVISION] Invalid webhook secret");
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        // 2. Parse payload
        const body = await request.json();
        const {
            email,
            first_name,
            last_name,
            phone,
            company,
            designation,
            country,
            state,
            industry,
            sub_industry,
            community,
            sub_community,
            lead_id,
        } = body;

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        console.log(`[PROVISION] Processing lead: ${email} (Zoho ID: ${lead_id || "N/A"})`);

        // 3. Resolve taxonomy IDs (case-insensitive)
        const industryId = await lookupIndustry(industry);
        const subIndustryId = await lookupSubIndustry(sub_industry, industryId);
        const communityId = await lookupCommunity(community);
        const subCommunityId = await lookupSubCommunity(sub_community, communityId);

        console.log(`[PROVISION] Resolved → industry: ${industryId}, sub: ${subIndustryId}, community: ${communityId}, subComm: ${subCommunityId}`);

        // 4. Create or find Clerk user
        const client = await clerkClient();
        const existingUsers = await client.users.getUserList({ emailAddress: [email] });
        let clerkUser = existingUsers.data[0];

        if (!clerkUser) {
            clerkUser = await client.users.createUser({
                emailAddress: [email],
                firstName: first_name || undefined,
                lastName: last_name || undefined,
                skipPasswordRequirement: true,
            });
            console.log(`[PROVISION] Clerk user created: ${clerkUser.id}`);
        } else {
            console.log(`[PROVISION] Clerk user exists: ${clerkUser.id}`);
        }

        // 5. DB transaction — upsert user + mappings
        const dbClient = await getClient();

        try {
            await dbClient.query("BEGIN");

            // Upsert user
            const userResult = await dbClient.query(
                `INSERT INTO users (
                    clerk_id, email, first_name, last_name, phone,
                    country, state, job_title, organization,
                    onboarding_completed, created_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true, NOW())
                ON CONFLICT (clerk_id) DO UPDATE SET
                    email                = EXCLUDED.email,
                    first_name           = COALESCE(EXCLUDED.first_name, users.first_name),
                    last_name            = COALESCE(EXCLUDED.last_name, users.last_name),
                    phone                = COALESCE(EXCLUDED.phone, users.phone),
                    country              = COALESCE(EXCLUDED.country, users.country),
                    state                = COALESCE(EXCLUDED.state, users.state),
                    job_title            = COALESCE(EXCLUDED.job_title, users.job_title),
                    organization         = COALESCE(EXCLUDED.organization, users.organization),
                    onboarding_completed = true
                RETURNING id`,
                [
                    clerkUser.id,
                    email.toLowerCase(),
                    first_name || null,
                    last_name || null,
                    phone || null,
                    country || null,
                    state || null,
                    designation || null,
                    company || null,
                ]
            );

            const userId = userResult.rows[0].id;

            // Insert industry mapping (if resolved)
            if (industryId) {
                await dbClient.query(
                    `DELETE FROM user_industries WHERE user_id = $1`,
                    [userId]
                );
                await dbClient.query(
                    `INSERT INTO user_industries (user_id, industry_id, sub_industry_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT DO NOTHING`,
                    [userId, industryId, subIndustryId]
                );
            }

            // Insert community mapping (if resolved)
            if (communityId) {
                // Don't wipe existing communities — add if not present
                await dbClient.query(
                    `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT DO NOTHING`,
                    [userId, communityId, subCommunityId]
                );
            }

            await dbClient.query("COMMIT");
            console.log(`[PROVISION] DB user upserted: ${userId}`);
        } catch (dbErr) {
            await dbClient.query("ROLLBACK");
            throw dbErr;
        } finally {
            dbClient.release();
        }

        // 6. Generate magic link
        const { token: magicToken, expiresAt } = generateMagicToken(email);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteUrl = `${appUrl}/api/auth/invite?email=${encodeURIComponent(email)}&token=${encodeURIComponent(magicToken)}`;

        console.log(`[PROVISION] Magic link generated for ${email}, expires: ${expiresAt}`);

        // 7. Send magic link email via Brevo
        try {
            await sendMagicLinkEmail({
                email,
                firstName: first_name || undefined,
                inviteUrl,
            });
        } catch (emailErr: any) {
            console.error(`[PROVISION] Brevo email failed (non-blocking): ${emailErr.message}`);
        }

        // 8. Write token back to Zoho lead (best-effort)
        if (lead_id) {
            try {
                await updateLeadFields(lead_id, {
                    Magic_Token: magicToken,
                    Token_Expiry: expiresAt,
                });
            } catch (zohoErr: any) {
                console.warn(`[PROVISION] Zoho writeback failed (non-blocking): ${zohoErr.message}`);
            }
        }

        // 9. Return success + invite URL
        return NextResponse.json({
            success: true,
            inviteUrl,
            expiresAt,
            clerkUserId: clerkUser.id,
        });

    } catch (error: any) {
        console.error("[PROVISION] Fatal error:", error);
        return NextResponse.json(
            { error: "Provisioning failed", details: error.message },
            { status: 500 }
        );
    }
}
