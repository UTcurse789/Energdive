import { NextRequest, NextResponse } from "next/server";
import { processContentPreferenceDigests } from "@/lib/cron-jobs";

const CRON_SECRET = process.env.CRON_SECRET || "";

/**
 * POST /api/cron/preference-digests
 *
 * Cron job: send personalized digests for users who completed onboarding and
 * selected subscription preferences.
 *
 * Protected by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const requestedLimit = Number(body?.limit);
        const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
            ? requestedLimit
            : undefined;
        const result = await processContentPreferenceDigests(limit);
        return NextResponse.json(result);
    } catch (error: unknown) {
        const details = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Internal server error", details },
            { status: 500 }
        );
    }
}
