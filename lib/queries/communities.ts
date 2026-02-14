import { query } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────
export interface SubCommunity {
    id: number;
    community_id: number;
    name: string;
}

export interface Community {
    id: number;
    name: string;
    sub_communities: SubCommunity[];
}

/**
 * Returns all communities with nested sub_communities.
 * Single round-trip, grouped in JS for speed.
 */
export async function getCommunitiesWithSubs(): Promise<Community[]> {
    const [communities, subCommunities] = await Promise.all([
        query<{ id: number; name: string }>(
            `SELECT id, name FROM communities ORDER BY name`
        ),
        query<SubCommunity>(
            `SELECT id, community_id, name FROM sub_communities ORDER BY name`
        ),
    ]);

    return communities.rows.map((c) => ({
        ...c,
        sub_communities: subCommunities.rows.filter(
            (sc) => sc.community_id === c.id
        ),
    }));
}
