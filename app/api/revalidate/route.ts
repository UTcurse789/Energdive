import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";


const REVALIDATE_SECRET = "energdive-revalidate-2026";

// ─── Cloudflare Cache Purge ───────────────────────────────────────────────────
// Set CF_API_TOKEN and CF_ZONE_ID in .env to enable CDN purging.
async function purgeCloudflareCache(paths?: string[]) {
  const token = process.env.CF_API_TOKEN;
  const zoneId = process.env.CF_ZONE_ID;
  if (!token || !zoneId) return;
  try {
    const body = paths && paths.length > 0
      ? { files: paths.map(p => `https://www.energdive.com${p}`) }
      : { purge_everything: true };

    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) {
      console.error("[REVALIDATE] Cloudflare purge failed:", JSON.stringify(json.errors));
    }
  } catch (err) {
    console.error("[REVALIDATE] Cloudflare purge error:", err);
  }
}



export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Simple secret check
        if (body.secret !== REVALIDATE_SECRET) {
            return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
        }

        // Purge ALL paths
        if (body.all === true) {
            // Bust the fetch Data Cache first
            (revalidateTag as any)("strapi-contents");


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

            // Purge Cloudflare CDN cache too
            await purgeCloudflareCache();

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
            // Purge specific paths from Cloudflare CDN too
            await purgeCloudflareCache(body.paths);
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
