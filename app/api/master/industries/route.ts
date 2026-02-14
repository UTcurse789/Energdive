import { NextResponse } from "next/server";
import { getIndustriesWithSubs } from "@/lib/queries";

/**
 * GET /api/master/industries
 * Returns all industries with nested sub_industries.
 */
export async function GET() {
    try {
        const industries = await getIndustriesWithSubs();
        return NextResponse.json(industries);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[MASTER_INDUSTRIES]", message);
        return NextResponse.json(
            { error: "Failed to load industries" },
            { status: 500 }
        );
    }
}
