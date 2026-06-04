import { query } from "@/lib/db";

export interface UserDownload {
    id: number;
    paper_slug: string;
    paper_title: string;
    pdf_url: string;
    downloaded_at: string;
}

export async function addPaperDownload(
    clerkId: string,
    paperSlug: string,
    paperTitle: string,
    pdfUrl: string
): Promise<void> {
    const userRes = await query<{ id: number }>(
        "SELECT id FROM users WHERE clerk_id = $1",
        [clerkId]
    );

    if (userRes.rows.length === 0) {
        throw new Error(`User with Clerk ID ${clerkId} not found`);
    }

    await query(
        `INSERT INTO user_downloads (user_id, paper_slug, paper_title, pdf_url, downloaded_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, paper_slug)
         DO UPDATE SET
            paper_title = EXCLUDED.paper_title,
            pdf_url = EXCLUDED.pdf_url,
            downloaded_at = NOW()`,
        [userRes.rows[0].id, paperSlug, paperTitle, pdfUrl]
    );
}

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

export async function hasUserDownloads(clerkId: string): Promise<boolean> {
    const res = await query<{ has_downloads: boolean }>(
        `SELECT EXISTS(
            SELECT 1
            FROM user_downloads ud
            JOIN users u ON ud.user_id = u.id
            WHERE u.clerk_id = $1
        ) AS has_downloads`,
        [clerkId]
    );

    return res.rows[0]?.has_downloads === true;
}
