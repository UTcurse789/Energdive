import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * DELETE /api/community/posts/[id]
 * Only the author can delete their own post.
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const postId = Number(id);
        if (!postId) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

        // Only allow author to delete
        const result = await query(
            `DELETE FROM community_posts WHERE id = $1 AND clerk_user_id = $2 RETURNING id`,
            [postId, userId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Post not found or not authorized" }, { status: 404 });
        }

        return NextResponse.json({ deleted: true });
    } catch (error) {
        console.error("[POST_DELETE]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
