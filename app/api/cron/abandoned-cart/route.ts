import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCartDrip } from "@/lib/cron-jobs";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/cron/abandoned-cart
 *
 * Cron job: Process the abandoned cart drip email sequence.
 * Sends timed emails to CRM leads (pending_verifications) who haven't
 * completed portal login.
 *
 * Protected by CRON_SECRET header.
 * Should be called every 15-30 minutes by an external cron service (if not using instrumentation background timer).
 */
export async function POST(req: NextRequest) {
    // ── Auth ─────────────────────────────────────────────────────────────
    const secret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await processAbandonedCartDrip();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
