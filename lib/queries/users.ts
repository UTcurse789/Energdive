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
    // Subscription preferences
    preferredFrequency?: string;
    preferredFormats?: string[];
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
    industry_id: number | null;
    industry_name: string | null;
    sub_industry_id: number | null;
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
                preferred_frequency, preferred_formats,
                onboarding_completed, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, true, NOW())
            ON CONFLICT (clerk_id) DO UPDATE SET
                email               = EXCLUDED.email,
                first_name          = EXCLUDED.first_name,
                last_name           = EXCLUDED.last_name,
                phone               = COALESCE(NULLIF(EXCLUDED.phone, ''), users.phone),
                country             = EXCLUDED.country,
                state               = EXCLUDED.state,
                job_title           = EXCLUDED.job_title,
                organization        = EXCLUDED.organization,
                preferred_frequency = EXCLUDED.preferred_frequency,
                preferred_formats   = EXCLUDED.preferred_formats,
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
                payload.preferredFrequency || 'daily',
                payload.preferredFormats || [],
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
    try {
        // 1. User + industry join
        const userResult = await query(
            `SELECT
                u.id, u.clerk_id, u.email,
                u.first_name, u.last_name, u.phone,
                u.country, u.state, u.job_title, u.organization,
                u.onboarding_completed, u.created_at,
                ui.industry_id,
                ind.name  AS industry_name,
                ui.sub_industry_id,
                si.name   AS sub_industry_name
            FROM users u
            LEFT JOIN user_industries ui ON u.id = ui.user_id
            LEFT JOIN industry ind       ON ui.industry_id = ind.id
            LEFT JOIN sub_industries si  ON ui.sub_industry_id = si.id
            WHERE u.clerk_id = $1`,
            [clerkId]
        );

        console.log(`[getUserProfile] Query for ${clerkId} returned ${userResult.rows.length} rows`);

        if (userResult.rows.length === 0) {
            return null;
        }

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
    } catch (error) {
        console.error('getUserProfile failed:', error);
        return null;
    }
}

// ─── Update Profile ──────────────────────────────────────────────
export interface UpdateProfilePayload {
    clerkId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    country?: string;
    state?: string;
    jobTitle?: string;
    organization?: string;
    industryId?: number;
    subIndustryId?: number;
    communitySelections?: { communityId: number; subCommunityId: number }[];
    preferredFrequency?: string;
    preferredFormats?: string[];
}

/**
 * Partial update — only modifies fields that are provided.
 * Industry + community changes run in a transaction.
 */
export async function updateUserProfile(payload: UpdateProfilePayload): Promise<void> {
    const client = await getClient();

    try {
        await client.query("BEGIN");

        // 1. Build dynamic SET clause for user row
        const setClauses: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        const fields = [
            { key: "first_name", val: payload.firstName },
            { key: "last_name", val: payload.lastName },
            { key: "phone", val: payload.phone },
            { key: "country", val: payload.country },
            { key: "state", val: payload.state },
            { key: "job_title", val: payload.jobTitle },
            { key: "organization", val: payload.organization },
            { key: "preferred_frequency", val: payload.preferredFrequency },
            { key: "preferred_formats", val: payload.preferredFormats },
        ];

        for (const f of fields) {
            if (f.val !== undefined) {
                setClauses.push(`${f.key} = $${idx++}`);
                values.push(f.val);
            }
        }

        let userId: number;

        if (setClauses.length > 0) {
            values.push(payload.clerkId);
            const result = await client.query(
                `UPDATE users SET ${setClauses.join(", ")} WHERE clerk_id = $${idx} RETURNING id`,
                values
            );
            userId = result.rows[0].id;
        } else {
            const result = await client.query(
                `SELECT id FROM users WHERE clerk_id = $1`,
                [payload.clerkId]
            );
            userId = result.rows[0].id;
        }

        // 2. Replace industry if provided
        if (payload.industryId && payload.subIndustryId) {
            await client.query(`DELETE FROM user_industries WHERE user_id = $1`, [userId]);
            await client.query(
                `INSERT INTO user_industries (user_id, industry_id, sub_industry_id) VALUES ($1, $2, $3)`,
                [userId, payload.industryId, payload.subIndustryId]
            );
        }

        // 3. Replace communities if provided
        if (payload.communitySelections && payload.communitySelections.length > 0) {
            await client.query(`DELETE FROM user_communities WHERE user_id = $1`, [userId]);

            const comValues: unknown[] = [];
            const comPlaceholders: string[] = [];
            payload.communitySelections.forEach((sel, i) => {
                const offset = i * 3;
                comPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
                comValues.push(userId, sel.communityId, sel.subCommunityId);
            });

            await client.query(
                `INSERT INTO user_communities (user_id, community_id, sub_community_id) VALUES ${comPlaceholders.join(", ")}`,
                comValues
            );
        }

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// ─── Zoho Provision Pipeline ─────────────────────────────────────────

export interface ProvisionPayload {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    designation?: string;
    country?: string;
    state?: string;
    // Taxonomy names (matched case-insensitively against DB)
    industryName?: string;
    subIndustryName?: string;
    // Single community (legacy — still supported)
    communityName?: string;
    subCommunityName?: string;
    // Multiple communities (preferred — from Zoho multiselect fields)
    communityNames?: string[];
    subCommunityNames?: string[];
    // Magic token for one-click login
    magicToken: string;
    magicTokenExpiresAt: Date;
}

/**
 * Atomic provisioning: upserts user + taxonomy mappings + magic token.
 * Designed for idempotent Zoho webhook — safe to retry.
 *
 * Taxonomy matching is case-insensitive. If a match is not found,
 * that mapping is silently skipped (does NOT fail the transaction).
 */
export async function provisionUser(payload: ProvisionPayload): Promise<number> {
    const client = await getClient();

    try {
        await client.query("BEGIN");

        // 1. Upsert user row — ON CONFLICT on clerk_id
        const userResult = await client.query(
            `INSERT INTO users (
                clerk_id, email, first_name, last_name, phone,
                country, state, job_title, organization,
                onboarding_completed, magic_token, magic_token_expires_at,
                created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true, $10, $11, NOW())
            ON CONFLICT (clerk_id) DO UPDATE SET
                email                  = EXCLUDED.email,
                first_name             = EXCLUDED.first_name,
                last_name              = EXCLUDED.last_name,
                phone                  = COALESCE(EXCLUDED.phone, users.phone),
                country                = COALESCE(EXCLUDED.country, users.country),
                state                  = COALESCE(EXCLUDED.state, users.state),
                job_title              = COALESCE(EXCLUDED.job_title, users.job_title),
                organization           = COALESCE(EXCLUDED.organization, users.organization),
                onboarding_completed   = true,
                magic_token            = EXCLUDED.magic_token,
                magic_token_expires_at = EXCLUDED.magic_token_expires_at
            RETURNING id`,
            [
                payload.clerkId,
                payload.email,
                payload.firstName,
                payload.lastName,
                payload.phone || null,
                payload.country || null,
                payload.state || null,
                payload.designation || null,  // maps to job_title
                payload.company || null,      // maps to organization
                payload.magicToken,
                payload.magicTokenExpiresAt,
            ]
        );

        const userId: number = userResult.rows[0].id;

        // 2. Resolve industry + sub-industry by case-insensitive name
        if (payload.industryName) {
            const indResult = await client.query(
                `SELECT id FROM industry WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                [payload.industryName.trim()]
            );

            if (indResult.rows.length > 0) {
                const industryId = indResult.rows[0].id;
                let subIndustryId: number | null = null;

                if (payload.subIndustryName) {
                    const subResult = await client.query(
                        `SELECT id FROM sub_industries
                         WHERE industry_id = $1
                           AND LOWER(name) = LOWER($2)
                         LIMIT 1`,
                        [industryId, payload.subIndustryName.trim()]
                    );
                    subIndustryId = subResult.rows[0]?.id ?? null;
                }

                // Fallback: if sub not matched, pick the first sub-industry
                if (!subIndustryId) {
                    const fallback = await client.query(
                        `SELECT id FROM sub_industries WHERE industry_id = $1 ORDER BY id LIMIT 1`,
                        [industryId]
                    );
                    subIndustryId = fallback.rows[0]?.id ?? null;
                    if (subIndustryId) {
                        console.warn(`[PROVISION] Sub-industry "${payload.subIndustryName}" not found, using fallback id=${subIndustryId}`);
                    }
                }

                // Only insert if we have a valid sub-industry (NOT NULL constraint)
                if (subIndustryId) {
                    await client.query(
                        `DELETE FROM user_industries WHERE user_id = $1`,
                        [userId]
                    );
                    await client.query(
                        `INSERT INTO user_industries (user_id, industry_id, sub_industry_id)
                         VALUES ($1, $2, $3)`,
                        [userId, industryId, subIndustryId]
                    );
                    console.log(`[PROVISION] Industry matched: ${payload.industryName} → ${industryId}, sub → ${subIndustryId}`);
                } else {
                    console.warn(`[PROVISION] No sub-industries exist for "${payload.industryName}" — skipping industry mapping`);
                }
            } else {
                console.warn(`[PROVISION] Industry not found: "${payload.industryName}" — skipping`);
            }
        }

        // 3. Resolve community + sub-community by case-insensitive name
        //    Supports both single (communityName) and multi (communityNames) values
        const communityList = payload.communityNames && payload.communityNames.length > 0
            ? payload.communityNames
            : payload.communityName ? [payload.communityName] : [];
        const subCommunityList = payload.subCommunityNames && payload.subCommunityNames.length > 0
            ? payload.subCommunityNames
            : payload.subCommunityName ? [payload.subCommunityName] : [];

        if (communityList.length > 0) {
            // Clear old mappings
            await client.query(
                `DELETE FROM user_communities WHERE user_id = $1`,
                [userId]
            );

            const insertedPairs: string[] = [];

            for (const commName of communityList) {
                const commResult = await client.query(
                    `SELECT id FROM communities WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                    [commName.trim()]
                );

                if (commResult.rows.length === 0) {
                    console.warn(`[PROVISION] Community not found: "${commName}" — skipping`);
                    continue;
                }

                const communityId = commResult.rows[0].id;

                // Try to match each sub-community against this community
                let matchedAnySub = false;
                for (const subName of subCommunityList) {
                    const subResult = await client.query(
                        `SELECT id FROM sub_communities
                         WHERE community_id = $1
                           AND LOWER(name) = LOWER($2)
                         LIMIT 1`,
                        [communityId, subName.trim()]
                    );

                    if (subResult.rows.length > 0) {
                        const subCommunityId = subResult.rows[0].id;
                        const pairKey = `${communityId}-${subCommunityId}`;
                        if (!insertedPairs.includes(pairKey)) {
                            await client.query(
                                `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                                 VALUES ($1, $2, $3)`,
                                [userId, communityId, subCommunityId]
                            );
                            insertedPairs.push(pairKey);
                            console.log(`[PROVISION] Community matched: ${commName} → ${communityId}, sub ${subName} → ${subCommunityId}`);
                            matchedAnySub = true;
                        }
                    }
                }

                // Fallback: if no sub-community matched, pick first sub-community
                if (!matchedAnySub) {
                    const fallback = await client.query(
                        `SELECT id FROM sub_communities WHERE community_id = $1 ORDER BY id LIMIT 1`,
                        [communityId]
                    );
                    const subCommunityId = fallback.rows[0]?.id ?? null;
                    if (subCommunityId) {
                        const pairKey = `${communityId}-${subCommunityId}`;
                        if (!insertedPairs.includes(pairKey)) {
                            await client.query(
                                `INSERT INTO user_communities (user_id, community_id, sub_community_id)
                                 VALUES ($1, $2, $3)`,
                                [userId, communityId, subCommunityId]
                            );
                            insertedPairs.push(pairKey);
                            console.warn(`[PROVISION] No sub matched for "${commName}", using fallback sub_id=${subCommunityId}`);
                        }
                    } else {
                        console.warn(`[PROVISION] No sub-communities exist for "${commName}" — skipping`);
                    }
                }
            }

            console.log(`[PROVISION] Total community pairs stored: ${insertedPairs.length}`);
        }

        await client.query("COMMIT");
        console.log(`[PROVISION] User provisioned: id=${userId} email=${payload.email}`);
        return userId;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// ─── Magic Token Lookup ──────────────────────────────────────────────

export interface MagicTokenUser {
    id: number;
    clerk_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
}

/**
 * Find a user by their magic_token. Returns null if token not found or expired.
 */
export async function getUserByMagicToken(token: string): Promise<MagicTokenUser | null> {
    try {
        console.log(`[getUserByMagicToken] Looking up token: ${token.slice(0, 12)}...`);

        // First check: does the token exist at all (ignoring expiry)?
        const debugResult = await query(
            `SELECT id, email, magic_token_expires_at,
                    (magic_token_expires_at > NOW()) as is_valid,
                    NOW() as db_now
             FROM users
             WHERE magic_token = $1
             LIMIT 1`,
            [token]
        );

        if (debugResult.rows.length === 0) {
            console.warn(`[getUserByMagicToken] Token NOT found in DB at all`);

            // Check if any magic tokens exist
            const anyTokens = await query(
                `SELECT id, email, LEFT(magic_token, 12) as token_prefix, magic_token_expires_at
                 FROM users
                 WHERE magic_token IS NOT NULL
                 ORDER BY id DESC
                 LIMIT 5`
            );
            console.log(`[getUserByMagicToken] Users with tokens:`, JSON.stringify(anyTokens.rows));

            return null;
        }

        const debugRow = debugResult.rows[0];
        console.log(`[getUserByMagicToken] Token found for user ${debugRow.id} (${debugRow.email}), expires: ${debugRow.magic_token_expires_at}, is_valid: ${debugRow.is_valid}, db_now: ${debugRow.db_now}`);

        if (!debugRow.is_valid) {
            console.warn(`[getUserByMagicToken] Token is EXPIRED`);
            return null;
        }

        // Actual lookup
        const result = await query<MagicTokenUser>(
            `SELECT id, clerk_id, email, first_name, last_name
             FROM users
             WHERE magic_token = $1
               AND magic_token_expires_at > NOW()
             LIMIT 1`,
            [token]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error("[getUserByMagicToken] Failed:", error);
        return null;
    }
}

/**
 * Clear magic token after use (one-time use enforcement).
 */
export async function clearMagicToken(userId: number): Promise<void> {
    await query(
        `UPDATE users SET magic_token = NULL, magic_token_expires_at = NULL WHERE id = $1`,
        [userId]
    );
}

// ─── Verification Status Tracking ────────────────────────────────────

export interface VerificationStatus {
    email_verified: boolean;
    phone_verified: boolean;
    registration_method: string | null;
    email: string;
    phone: string | null;
}

/**
 * Update verification status for a user.
 * Can set email_verified, phone_verified, registration_method, and optionally email/phone.
 */
export async function updateVerificationStatus(
    clerkId: string,
    updates: {
        emailVerified?: boolean;
        phoneVerified?: boolean;
        registrationMethod?: string;
        email?: string;
        phone?: string;
    }
): Promise<void> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.emailVerified !== undefined) {
        setClauses.push(`email_verified = $${idx++}`);
        values.push(updates.emailVerified);
    }
    if (updates.phoneVerified !== undefined) {
        setClauses.push(`phone_verified = $${idx++}`);
        values.push(updates.phoneVerified);
    }
    if (updates.registrationMethod !== undefined) {
        setClauses.push(`registration_method = $${idx++}`);
        values.push(updates.registrationMethod);
    }
    if (updates.email !== undefined) {
        setClauses.push(`email = $${idx++}`);
        values.push(updates.email);
    }
    if (updates.phone !== undefined) {
        setClauses.push(`phone = $${idx++}`);
        values.push(updates.phone);
    }

    if (setClauses.length === 0) return;

    values.push(clerkId);
    await query(
        `UPDATE users SET ${setClauses.join(", ")} WHERE clerk_id = $${idx}`,
        values
    );
}

/**
 * Get verification status for a user by Clerk ID.
 */
export async function getVerificationStatus(
    clerkId: string
): Promise<VerificationStatus | null> {
    const result = await query<VerificationStatus>(
        `SELECT email_verified, phone_verified, registration_method, email, phone
         FROM users WHERE clerk_id = $1 LIMIT 1`,
        [clerkId]
    );
    return result.rows[0] || null;
}

/**
 * Get user by internal DB id (for magic link OTP flow).
 */
export async function getUserByInternalId(
    userId: number
): Promise<{ id: number; clerk_id: string; email: string; phone: string | null; first_name: string | null } | null> {
    const result = await query<{ id: number; clerk_id: string; email: string; phone: string | null; first_name: string | null }>(
        `SELECT id, clerk_id, email, phone, first_name FROM users WHERE id = $1 LIMIT 1`,
        [userId]
    );
    return result.rows[0] || null;
}
