import { query } from "@/lib/db";

export interface UserDownload {
    id: number;
    paper_slug: string;
    paper_title: string;
    pdf_url: string;
    downloaded_at: string;
}

/**
 * Add a paper to user's downloads.
 * Resolves the clerkId to internal user id first.
 */
export async function addPaperDownload(
    clerkId: string,
    paperSlug: string,
    paperTitle: string,
    pdfUrl: string
): Promise<void> {
    const userRes = await query("SELECT id FROM users WHERE clerk_id = $1", [clerkId]);
    if (userRes.rows.length === 0) {
        throw new Error(`User with Clerk ID ${clerkId} not found`);
    }
    const userId = userRes.rows[0].id;

    await query(
        `INSERT INTO user_downloads (user_id, paper_slug, paper_title, pdf_url, downloaded_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, paper_slug) DO UPDATE SET downloaded_at = NOW()`,
        [userId, paperSlug, paperTitle, pdfUrl]
    );
}

/**
 * Retrieve all paper downloads for a user.
 */
export async function getUserDownloads(clerkId: string): Promise<UserDownload[]> {
    const res = await query<UserDownload>(
        `SELECT ud.id, ud.paper_slug, ud.paper_title, ud.pdf_url, ud.downloaded_at
         FROM user_downloads ud
         JOIN users u ON ud.user_id = u.id
         WHERE u.clerk_id = $1
         ORDER BY ud.downloaded_at DESC`,
        [clerkId]
    );
    return res.rows;
}

/**
 * Check if a user has any downloads (lightweight EXISTS check).
 */
export async function hasUserDownloads(clerkId: string): Promise<boolean> {
    const res = await query(
        `SELECT EXISTS(
            SELECT 1 FROM user_downloads ud
            JOIN users u ON ud.user_id = u.id
            WHERE u.clerk_id = $1
        ) AS has_downloads`,
        [clerkId]
    );
    return res.rows[0]?.has_downloads === true;
}
