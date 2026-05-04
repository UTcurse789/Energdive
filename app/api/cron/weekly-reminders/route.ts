import { NextRequest, NextResponse } from "next/server";
import { processWeeklyReminders } from "@/lib/cron-jobs";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/cron/weekly-reminders
 *
 * Cron job: Send reminder emails to users with verification_status = 'pending_verification'.
 * Maximum 4 total emails per user, cycling through 4 template strategies once.
 *
 * Protected by CRON_SECRET header.
 * Should be called every ~6 hours by an external cron service (if not using instrumentation background timer).
 */
export async function POST(req: NextRequest) {
    // ── Auth ─────────────────────────────────────────────────────────────
    const secret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await processWeeklyReminders();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
