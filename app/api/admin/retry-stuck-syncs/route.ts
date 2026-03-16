import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { syncEnrichedLead } from "@/lib/lead-sync-orchestrator";
import { logEvent } from "@/lib/system-logger";

const INTERNAL_SECRET = process.env.ZOHO_WEBHOOK_SECRET || "";

/**
 * POST /api/admin/retry-stuck-syncs
 *
 * Retries syncs for users who are verified + onboarded but haven't completed
 * Brevo/CRM sync (sync_status is NOT 'complete').
 *
 * Protected by internal secret. Can be called by cron or manually.
 *
 * Body: { secret: string, limit?: number }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.secret !== INTERNAL_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const limit = body.limit || 50;

        // Find users who completed onboarding but sync isn't complete
        const result = await query(
            `SELECT clerk_id, email, sync_status
             FROM users
             WHERE onboarding_completed = true
               AND verification_status = 'verified'
               AND (sync_status IS NULL OR sync_status NOT IN ('complete'))
               AND email NOT LIKE '%@phone.energdive.com'
             ORDER BY updated_at ASC
             LIMIT $1`,
            [limit]
        );

        const results: Array<{ email: string; status: string; result: string }> = [];

        for (const row of result.rows) {
            try {
                const fullUser = await getFullUserProfile(row.clerk_id);
                if (!fullUser) {
                    results.push({ email: row.email, status: row.sync_status, result: "user_not_found" });
                    continue;
                }

                const syncResult = await syncEnrichedLead(
                    { ...fullUser, clerk_id: row.clerk_id },
                    fullUser.email,
                    fullUser.phone || null,
                    {}
                );

                results.push({
                    email: row.email,
                    status: row.sync_status,
                    result: syncResult.success ? "synced" : syncResult.reason || "failed",
                });
            } catch (err: any) {
                results.push({ email: row.email, status: row.sync_status, result: `error: ${err.message}` });
            }
        }

        await logEvent("RETRY_STUCK_SYNCS", "", `Processed ${results.length} stuck syncs`);

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
        });
    } catch (error: any) {
        console.error("[RETRY_STUCK_SYNCS] Error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
