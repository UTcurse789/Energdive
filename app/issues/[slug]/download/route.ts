import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { saveArticleForUser } from "@/lib/queries/saved-articles";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export const dynamic = "force-dynamic";

type StrapiIssue = {
    id?: number | string;
    Month?: string;
    Year?: number | string;
    Title?: string;
    issue_Epdf?: unknown;
};

function parseSlug(slug: string): { month: string; year: number } | null {
    const parts = slug.split("-");
    if (parts.length < 2) return null;

    const yearStr = parts[parts.length - 1];
    const year = Number.parseInt(yearStr, 10);
    if (!Number.isFinite(year) || !/^\d{4}$/.test(yearStr)) return null;

    const month = parts.slice(0, -1).join("-").replace(/-/g, " ");
    return { month, year };
}

function getRelationData(relation: unknown) {
    if (!relation || typeof relation !== "object") return null;

    const value = relation as {
        data?: unknown;
        attributes?: unknown;
        url?: unknown;
        name?: unknown;
    };

    if (Array.isArray(value.data)) {
        const first = value.data[0] as { attributes?: unknown } | undefined;
        return first?.attributes ?? first ?? null;
    }

    if (value.data && typeof value.data === "object") {
        const data = value.data as { attributes?: unknown };
        return data.attributes ?? data;
    }

    return value.attributes ?? relation;
}

function extractPdfMeta(pdf: unknown) {
    if (!pdf) return null;

    const data = getRelationData(Array.isArray(pdf) ? pdf[0] : pdf);
    if (!data || typeof data !== "object") return null;

    const attrs = data as { url?: unknown; name?: unknown };
    if (typeof attrs.url !== "string" || !attrs.url) return null;

    const url = attrs.url.startsWith("http") ? attrs.url : `${STRAPI_URL}${attrs.url}`;
    const name = typeof attrs.name === "string" && attrs.name.trim() ? attrs.name.trim() : "issue.pdf";

    return { url, name };
}

function safeFilename(value: string) {
    const fallback = "energdive-issue.pdf";
    const normalized = value
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);

    return `${normalized || fallback.replace(/\.pdf$/i, "")}.pdf`;
}

async function fetchIssue(slug: string) {
    const parsed = parseSlug(slug);
    if (!parsed) return null;

    let res: Response;
    try {
        res = await fetch(`${STRAPI_URL}/api/issues?populate[0]=issue_Epdf&pagination[pageSize]=100`, {
            cache: "no-store",
        });
    } catch (error) {
        console.error("[ISSUE_PDF_DOWNLOAD] Failed to fetch issues from Strapi", error);
        return null;
    }

    if (!res.ok) {
        console.error("[ISSUE_PDF_DOWNLOAD] Strapi issue fetch failed", {
            status: res.status,
            statusText: res.statusText,
        });
        return null;
    }

    const json = await res.json().catch((error) => {
        console.error("[ISSUE_PDF_DOWNLOAD] Failed to parse Strapi response", error);
        return null;
    }) as { data?: StrapiIssue[] } | null;

    if (!json) return null;

    const item = json.data?.find((issue) =>
        String(issue.Month || "").toLowerCase() === parsed.month.toLowerCase() &&
        String(issue.Year || "") === String(parsed.year)
    );

    if (!item) return null;

    const title = item.Title || `${item.Month || parsed.month} ${item.Year || parsed.year}`;
    const pdf = extractPdfMeta(item.issue_Epdf);

    return { title, pdf };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const { userId } = await auth();

    if (!userId) {
        const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
        const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
        const origin = `${forwardedProto}://${forwardedHost}`;
        const returnTo = `/issues/${slug}/download`;
        const redirectUrl = `${origin}/auth?redirect_url=${encodeURIComponent(returnTo)}`;
        return NextResponse.redirect(redirectUrl);
    }

    const issue = await fetchIssue(slug);
    if (!issue) {
        return new NextResponse("Issue not found", { status: 404 });
    }

    if (!issue.pdf) {
        return new NextResponse("PDF not found for this issue", { status: 404 });
    }

    try {
        const user = await currentUser();
        await saveArticleForUser(
            {
                clerkId: userId,
                email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null,
                firstName: user?.firstName || null,
                lastName: user?.lastName || null,
            },
            {
                title: `${issue.title} Issue PDF`,
                url: `/issues/${slug}/download`,
            }
        );
    } catch (error) {
        console.error("[ISSUE_PDF_DOWNLOAD] Failed to save issue PDF to dashboard", error);
    }

    let pdfResponse: Response;
    try {
        pdfResponse = await fetch(issue.pdf.url, { cache: "no-store" });
    } catch (error) {
        console.error("[ISSUE_PDF_DOWNLOAD] Failed to proxy PDF, redirecting to source", error);
        return NextResponse.redirect(issue.pdf.url);
    }

    if (!pdfResponse.ok || !pdfResponse.body) {
        return NextResponse.redirect(issue.pdf.url);
    }

    const filename = safeFilename(issue.pdf.name || issue.title);

    return new NextResponse(pdfResponse.body, {
        headers: {
            "Content-Type": pdfResponse.headers.get("content-type") || "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
        },
    });
}
