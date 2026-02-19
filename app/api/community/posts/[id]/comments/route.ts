import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserProfile } from "@/lib/queries";

/**
 * GET /api/community/posts/[id]/comments
 * Returns all comments for a post, oldest first.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const postId = Number(id);
        if (!postId) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

        const result = await query(
            `SELECT * FROM community_comments WHERE post_id = $1 ORDER BY created_at ASC`,
            [postId]
        );

        return NextResponse.json({
            comments: result.rows.map((r) => ({
                id: r.id,
                postId: r.post_id,
                clerkUserId: r.clerk_user_id,
                authorName: r.author_name,
                content: r.content,
                createdAt: r.created_at,
            })),
        });
    } catch (error) {
        console.error("[COMMENTS_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/community/posts/[id]/comments
 * Body: { content: string }
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const postId = Number(id);
        if (!postId) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

        const body = await request.json();
        const { content } = body;
        if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

        // Get user name
        const profile = await getUserProfile(userId);
        const authorName = profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
            : "Anonymous";

        const result = await query(
            `INSERT INTO community_comments (post_id, clerk_user_id, author_name, content)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [postId, userId, authorName, content.trim()]
        );

        const r = result.rows[0];
        return NextResponse.json({
            comment: {
                id: r.id,
                postId: r.post_id,
                clerkUserId: r.clerk_user_id,
                authorName: r.author_name,
                content: r.content,
                createdAt: r.created_at,
            },
        });
    } catch (error) {
        console.error("[COMMENTS_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
