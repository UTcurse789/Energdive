import { query } from "@/lib/db";

export interface SavedArticle {
    id: number;
    title: string;
    url: string;
    savedAt: string;
}

interface UserIdentity {
    clerkId: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

interface SavedArticleInput {
    title: string;
    url: string;
}

async function getOrCreateUserId(identity: UserIdentity): Promise<number> {
    const existing = await query<{ id: number }>(
        `SELECT id FROM users WHERE clerk_id = $1 LIMIT 1`,
        [identity.clerkId]
    );

    if (existing.rows[0]?.id) {
        return existing.rows[0].id;
    }

    const email = identity.email || `${identity.clerkId}@unknown.energdive.local`;

    if (identity.email) {
        const existingByEmail = await query<{ id: number; clerk_id: string | null }>(
            `SELECT id, clerk_id
             FROM users
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1`,
            [identity.email]
        );

        if (existingByEmail.rows[0]?.id) {
            if (!existingByEmail.rows[0].clerk_id) {
                await query(
                    `UPDATE users
                     SET clerk_id = $2,
                         first_name = COALESCE(first_name, $3),
                         last_name = COALESCE(last_name, $4)
                     WHERE id = $1`,
                    [
                        existingByEmail.rows[0].id,
                        identity.clerkId,
                        identity.firstName || null,
                        identity.lastName || null,
                    ]
                );
            }

            return existingByEmail.rows[0].id;
        }
    }

    const inserted = await query<{ id: number }>(
        `INSERT INTO users (
            clerk_id, email, first_name, last_name, onboarding_completed, created_at
        ) VALUES ($1, $2, $3, $4, false, NOW())
        ON CONFLICT (clerk_id) DO UPDATE SET
            email = COALESCE(users.email, EXCLUDED.email),
            first_name = COALESCE(users.first_name, EXCLUDED.first_name),
            last_name = COALESCE(users.last_name, EXCLUDED.last_name)
        RETURNING id`,
        [
            identity.clerkId,
            email,
            identity.firstName || null,
            identity.lastName || null,
        ]
    );

    return inserted.rows[0].id;
}

function mapSavedArticle(row: {
    id: number;
    title: string;
    url: string;
    saved_at: Date | string;
}): SavedArticle {
    return {
        id: row.id,
        title: row.title,
        url: row.url,
        savedAt: new Date(row.saved_at).toISOString(),
    };
}

export async function listSavedArticles(identity: UserIdentity): Promise<SavedArticle[]> {
    const userId = await getOrCreateUserId(identity);
    const result = await query<{
        id: number;
        title: string;
        url: string;
        saved_at: Date;
    }>(
        `SELECT id, title, url, saved_at
         FROM saved_articles
         WHERE user_id = $1
         ORDER BY saved_at DESC`,
        [userId]
    );

    return result.rows.map(mapSavedArticle);
}

export async function saveArticleForUser(
    identity: UserIdentity,
    input: SavedArticleInput
): Promise<SavedArticle> {
    const userId = await getOrCreateUserId(identity);
    const result = await query<{
        id: number;
        title: string;
        url: string;
        saved_at: Date;
    }>(
        `INSERT INTO saved_articles (user_id, title, url, saved_at, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW(), NOW())
         ON CONFLICT (user_id, url) DO UPDATE SET
            title = EXCLUDED.title,
            updated_at = NOW()
         RETURNING id, title, url, saved_at`,
        [userId, input.title, input.url]
    );

    return mapSavedArticle(result.rows[0]);
}

export async function removeSavedArticleForUser(
    identity: UserIdentity,
    url: string
): Promise<boolean> {
    const userId = await getOrCreateUserId(identity);
    const result = await query(
        `DELETE FROM saved_articles
         WHERE user_id = $1 AND url = $2`,
        [userId, url]
    );

    return (result.rowCount || 0) > 0;
}
