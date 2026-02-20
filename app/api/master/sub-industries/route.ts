import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/master/sub-industries?industryId=3
 * Returns sub-industries for a given industry.
 */
export async function GET(req: NextRequest) {
    try {
        const industryId = req.nextUrl.searchParams.get("industryId");

        if (!industryId) {
            return NextResponse.json(
                { error: "industryId query parameter is required" },
                { status: 400 }
            );
        }

        const result = await query<{ id: number; name: string }>(
            `SELECT id, name FROM sub_industries WHERE industry_id = $1 ORDER BY name`,
            [Number(industryId)]
        );

        return NextResponse.json(result.rows);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[MASTER_SUB_INDUSTRIES]", message);
        return NextResponse.json(
            { error: "Failed to load sub-industries" },
            { status: 500 }
        );
    }
}
