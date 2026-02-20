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
import { unstable_cache } from "next/cache";

/**
 * Returns all communities with nested sub_communities.
 * Optimized with single query + Next.js Data Cache.
 */
export const getCommunitiesWithSubs = unstable_cache(
    async (): Promise<Community[]> => {
        const result = await query<{
            community_id: number;
            community_name: string;
            sub_id: number | null;
            sub_name: string | null;
        }>(
            `
            SELECT 
                c.id as community_id, 
                c.name as community_name,
                s.id as sub_id,
                s.name as sub_name
            FROM communities c
            LEFT JOIN sub_communities s ON c.id = s.community_id
            ORDER BY c.name, s.name
            `
        );

        const map = new Map<number, Community>();

        for (const row of result.rows) {
            if (!map.has(row.community_id)) {
                map.set(row.community_id, {
                    id: row.community_id,
                    name: row.community_name,
                    sub_communities: [],
                });
            }

            if (row.sub_id && row.sub_name) {
                map.get(row.community_id)!.sub_communities.push({
                    id: row.sub_id,
                    community_id: row.community_id,
                    name: row.sub_name,
                });
            }
        }

        return Array.from(map.values());
    },
    ["master-communities"], // Cache key
    {
        revalidate: 3600, // Revalidate every hour
        tags: ["communities"],
    }
);
