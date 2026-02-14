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
export async function getIndustriesWithSubs(): Promise<Industry[]> {
    const [industries, subIndustries] = await Promise.all([
        query<{ id: number; name: string }>(
            `SELECT id, name FROM industry ORDER BY name`
        ),
        query<SubIndustry>(
            `SELECT id, industry_id, name FROM sub_industries ORDER BY name`
        ),
    ]);

    return industries.rows.map((ind) => ({
        ...ind,
        sub_industries: subIndustries.rows.filter(
            (sub) => sub.industry_id === ind.id
        ),
    }));
}
