import { NextResponse } from "next/server";
import { getCommunitiesWithSubs } from "@/lib/queries";

/**
 * GET /api/master/communities
 * Returns all communities with nested sub_communities.
 */
export async function GET() {
    try {
        const communities = await getCommunitiesWithSubs();
        return NextResponse.json(communities);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[MASTER_COMMUNITIES]", message);
        return NextResponse.json(
            { error: "Failed to load communities" },
            { status: 500 }
        );
    }
}
