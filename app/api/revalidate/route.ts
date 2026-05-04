import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * On-demand revalidation API
 *
 * Usage:
 *   POST /api/revalidate
 *   Body: { "secret": "energdive-revalidate-2026", "paths": ["/articles/some-slug", "/opinion/some-slug"] }
 *
 *   OR to purge everything:
 *   POST /api/revalidate
 *   Body: { "secret": "energdive-revalidate-2026", "all": true }
 */

const REVALIDATE_SECRET = "energdive-revalidate-2026";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Simple secret check
        if (body.secret !== REVALIDATE_SECRET) {
            return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
        }

        // Purge ALL paths
        if (body.all === true) {
            const allPaths = [
                "/",
                "/news",
                "/articles",
                "/opinion",
                "/cover-story",
                "/featured-stories",
                "/editorial",
                "/interviews",
                "/reports",
                "/issues",
                "/sectors",
                "/events",
                "/videos",
                "/case-study",
                "/feature",
                "/analysis",
                "/tags",
                "/authors",
            ];

            for (const p of allPaths) {
                revalidatePath(p, "layout");
            }

            // Also revalidate all dynamic content pages
            revalidatePath("/articles/[slug]", "page");
            revalidatePath("/news/[slug]", "page");
            revalidatePath("/opinion/[slug]", "page");
            revalidatePath("/cover-story/[slug]", "page");
            revalidatePath("/featured-stories/[slug]", "page");
            revalidatePath("/editorial/[slug]", "page");
            revalidatePath("/interviews/[slug]", "page");
            revalidatePath("/reports/[slug]", "page");
            revalidatePath("/issues/[slug]", "page");
            revalidatePath("/case-study/[slug]", "page");
            revalidatePath("/feature/[slug]", "page");
            revalidatePath("/analysis/[slug]", "page");
            revalidatePath("/sectors/[slug]", "page");
            revalidatePath("/author/[slug]", "page");
            revalidatePath("/tags/[slug]", "page");

            return NextResponse.json({
                revalidated: true,
                message: `Purged all ${allPaths.length} paths + dynamic routes`,
                timestamp: new Date().toISOString(),
            });
        }

        // Purge specific paths
        if (Array.isArray(body.paths) && body.paths.length > 0) {
            for (const p of body.paths) {
                revalidatePath(p);
            }
            return NextResponse.json({
                revalidated: true,
                paths: body.paths,
                timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json(
            { error: 'Provide either "all": true or "paths": ["/some/path"]' },
            { status: 400 }
        );
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Revalidation failed" },
            { status: 500 }
        );
    }
}
