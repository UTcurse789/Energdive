import { getClient, query } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────
export interface OnboardingPayload {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    state?: string;
    jobTitle?: string;
    organization?: string;
    // Selections
    industryId: number;
    subIndustryId: number;
    communitySelections: {
        communityId: number;
        subCommunityId: number;
    }[];
}

export interface UserProfile {
    id: number;
    clerk_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    country: string | null;
    state: string | null;
    job_title: string | null;
    organization: string | null;
    onboarding_completed: boolean;
    created_at: string;
    industry_name: string | null;
    sub_industry_name: string | null;
    communities: {
        community_id: number;
        community_name: string;
        sub_community_id: number;
        sub_community_name: string;
    }[];
}

/**
 * Atomic onboarding: upserts user, writes mappings, marks complete.
 * Runs in a single transaction — all or nothing.
 */
export async function saveOnboardingProfile(
    payload: OnboardingPayload
): Promise<number> {
    const client = await getClient();

    try {
        await client.query("BEGIN");

        // 1. Upsert user row
        const userResult = await client.query(
            `INSERT INTO users (
                clerk_id, email, first_name, last_name, phone,
                country, state, job_title, organization,
                onboarding_completed, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true, NOW())
            ON CONFLICT (clerk_id) DO UPDATE SET
                email               = EXCLUDED.email,
                first_name          = EXCLUDED.first_name,
                last_name           = EXCLUDED.last_name,
                phone               = EXCLUDED.phone,
                country             = EXCLUDED.country,
                state               = EXCLUDED.state,
                job_title           = EXCLUDED.job_title,
                organization        = EXCLUDED.organization,
                onboarding_completed = true
            RETURNING id`,
            [
                payload.clerkId,
                payload.email,
                payload.firstName,
                payload.lastName,
                payload.phone || null,
                payload.country || null,
                payload.state || null,
                payload.jobTitle || null,
                payload.organization || null,
            ]
        );

        const userId: number = userResult.rows[0].id;

        // 2. Replace industry mapping (delete old, insert new)
        await client.query(
            `DELETE FROM user_industries WHERE user_id = $1`,
            [userId]
        );
        await client.query(
            `INSERT INTO user_industries (user_id, industry_id, sub_industry_id)
             VALUES ($1, $2, $3)`,
            [userId, payload.industryId, payload.subIndustryId]
        );

        // 3. Replace community mappings (delete old, insert new)
        await client.query(
            `DELETE FROM user_communities WHERE user_id = $1`,
            [userId]
        );

        if (payload.communitySelections.length > 0) {
            const values: unknown[] = [];
            const placeholders: string[] = [];
            payload.communitySelections.forEach((sel, i) => {
                const offset = i * 3;
                placeholders.push(
                    `($${offset + 1}, $${offset + 2}, $${offset + 3})`
                );
                values.push(userId, sel.communityId, sel.subCommunityId);
            });

            await client.query(
                `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                 VALUES ${placeholders.join(", ")}`,
                values
            );
        }

        await client.query("COMMIT");
        return userId;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Fetch full user profile with joined taxonomy names.
 */
export async function getUserProfile(
    clerkId: string
): Promise<UserProfile | null> {
    // 1. User + industry join
    const userResult = await query(
        `SELECT
            u.id, u.clerk_id, u.email,
            u.first_name, u.last_name, u.phone,
            u.country, u.state, u.job_title, u.organization,
            u.onboarding_completed, u.created_at,
            ind.name  AS industry_name,
            si.name   AS sub_industry_name
        FROM users u
        LEFT JOIN user_industries ui ON u.id = ui.user_id
        LEFT JOIN industry ind       ON ui.industry_id = ind.id
        LEFT JOIN sub_industries si  ON ui.sub_industry_id = si.id
        WHERE u.clerk_id = $1`,
        [clerkId]
    );

    if (userResult.rows.length === 0) return null;

    const user = userResult.rows[0];

    // 2. Community selections
    const commResult = await query(
        `SELECT
            c.id   AS community_id,
            c.name AS community_name,
            sc.id  AS sub_community_id,
            sc.name AS sub_community_name
        FROM user_communities uc
        JOIN communities c      ON uc.community_id = c.id
        JOIN sub_communities sc ON uc.sub_community_id = sc.id
        WHERE uc.user_id = $1
        ORDER BY c.name, sc.name`,
        [user.id]
    );

    return {
        ...user,
        communities: commResult.rows,
    } as UserProfile;
}
