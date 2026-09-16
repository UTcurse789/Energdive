import { NextRequest, NextResponse } from "next/server";
import { getIssue } from "@/lib/api/issue-detail";

export const dynamic = "force-dynamic";

const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const issue = await getIssue(slug);

    if (!issue) {
        return new NextResponse("Issue not found", { status: 404 });
    }

    if (!issue.pdfUrl) {
        return new NextResponse("PDF not found for this issue", { status: 404 });
    }

    try {
        const pdfResponse = await fetch(issue.pdfUrl, {
            cache: "no-store",
            headers: {
                ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
            },
        });

        if (!pdfResponse.ok || !pdfResponse.body) {
            return NextResponse.redirect(issue.pdfUrl);
        }

        const headers = new Headers();
        headers.set("Content-Type", pdfResponse.headers.get("content-type") || "application/pdf");
        headers.set("Content-Disposition", "inline");
        headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
        headers.set("Accept-Ranges", "bytes");

        const contentLength = pdfResponse.headers.get("content-length");
        if (contentLength) {
            headers.set("Content-Length", contentLength);
        }

        return new NextResponse(pdfResponse.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("[ISSUE_PDF_PREVIEW] Error fetching PDF stream:", error);
        return NextResponse.redirect(issue.pdfUrl);
    }
}
