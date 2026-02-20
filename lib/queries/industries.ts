import { query } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────
export interface SubIndustry {
    id: number;
    industry_id: number;
    name: string;
}

export interface Industry {
    id: number;
    name: string;
    sub_industries: SubIndustry[];
}

/**
 * Returns all industries with nested sub_industries.
 * NOTE: the table is called `industry` (singular) in the DB.
 */
import { unstable_cache } from "next/cache";

/**
 * Returns all industries with nested sub_industries.
 * Optimized with single query + Next.js Data Cache.
 */
export const getIndustriesWithSubs = unstable_cache(
    async (): Promise<Industry[]> => {
        const result = await query<{
            industry_id: number;
            industry_name: string;
            sub_id: number | null;
            sub_name: string | null;
        }>(
            `
            SELECT 
                i.id as industry_id, 
                i.name as industry_name,
                s.id as sub_id,
                s.name as sub_name
            FROM industry i
            LEFT JOIN sub_industries s ON i.id = s.industry_id
            ORDER BY i.name, s.name
            `
        );

        const map = new Map<number, Industry>();

        for (const row of result.rows) {
            if (!map.has(row.industry_id)) {
                map.set(row.industry_id, {
                    id: row.industry_id,
                    name: row.industry_name,
                    sub_industries: [],
                });
            }

            if (row.sub_id && row.sub_name) {
                map.get(row.industry_id)!.sub_industries.push({
                    id: row.sub_id,
                    industry_id: row.industry_id,
                    name: row.sub_name,
                });
            }
        }

        return Array.from(map.values());
    },
    ["master-industries"],
    {
        revalidate: 3600,
        tags: ["industries"],
    }
);
