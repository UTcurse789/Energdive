import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserProfile } from "@/lib/queries";

/**
 * GET /api/community/posts?communityId=123&page=1&pageSize=20
 * Returns posts for a given community, newest first, with comment counts.
 */
export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const communityId = Number(searchParams.get("communityId"));
        const page = Number(searchParams.get("page")) || 1;
        const pageSize = Number(searchParams.get("pageSize")) || 20;
        const offset = (page - 1) * pageSize;

        if (!communityId) {
            return NextResponse.json({ error: "communityId required" }, { status: 400 });
        }

        // Fetch posts with comment count
        const result = await query(
            `SELECT p.*,
                    (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comment_count
             FROM community_posts p
             WHERE p.community_id = $1
             ORDER BY p.created_at DESC
             LIMIT $2 OFFSET $3`,
            [communityId, pageSize, offset]
        );

        // Total count for pagination
        const countResult = await query(
            `SELECT COUNT(*) AS total FROM community_posts WHERE community_id = $1`,
            [communityId]
        );

        return NextResponse.json({
            posts: result.rows.map((r) => ({
                id: r.id,
                communityId: r.community_id,
                clerkUserId: r.clerk_user_id,
                authorName: r.author_name,
                content: r.content,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                commentCount: Number(r.comment_count),
            })),
            pagination: {
                page,
                pageSize,
                total: Number(countResult.rows[0]?.total || 0),
            },
        });
    } catch (error) {
        console.error("[COMMUNITY_POSTS_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/community/posts
 * Body: { communityId: number, content: string }
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { communityId, content } = body;

        if (!communityId || !content?.trim()) {
            return NextResponse.json({ error: "communityId and content required" }, { status: 400 });
        }

        // Get user's name from profile
        const profile = await getUserProfile(userId);
        const authorName = profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email
            : "Anonymous";

        const result = await query(
            `INSERT INTO community_posts (community_id, clerk_user_id, author_name, content)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [communityId, userId, authorName, content.trim()]
        );

        const r = result.rows[0];
        return NextResponse.json({
            post: {
                id: r.id,
                communityId: r.community_id,
                clerkUserId: r.clerk_user_id,
                authorName: r.author_name,
                content: r.content,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                commentCount: 0,
            },
        });
    } catch (error) {
        console.error("[COMMUNITY_POSTS_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
