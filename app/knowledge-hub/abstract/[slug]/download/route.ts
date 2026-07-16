import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { getUserProfile, addPaperDownload } from "@/lib/queries";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";

const KNOWLEDGE_BASE_QUERY =
    "populate[abstract_pdf][fields][0]=url&populate[abstract_pdf][fields][1]=name&populate[abstract_pdf][fields][2]=size&populate[abstract_pdf][fields][3]=ext&populate[final_paper_submissions][fields][0]=final_status&populate[final_paper_submissions][fields][1]=final_submission_date&populate[final_paper_submissions][populate][full_paper][fields][0]=url&populate[final_paper_submissions][populate][full_paper][fields][1]=name&populate[final_paper_submissions][populate][full_paper][fields][2]=size&populate[final_paper_submissions][populate][full_paper][fields][3]=ext&sort[0]=submitted_date:desc&pagination[pageSize]=100";

function slugify(text: string) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

type PaperSubmission = {
    title?: string;
    pdf?: unknown;
    hasAcceptedFinalPaper?: boolean;
    status?: string;
    finalPaperPdf?: unknown;
    finalPaperSubmissions?: { final_status?: string; final_submission_date?: string; fullPaper?: unknown }[];
};

function getRelationData(relation: unknown) {
    if (!relation || typeof relation !== "object") return null;
    const value = relation as {
        data?: { attributes?: unknown } | unknown;
        attributes?: unknown;
    };

    if (value.data && typeof value.data === "object" && "attributes" in value.data) {
        return (value.data as { attributes?: unknown }).attributes;
    }

    return value.data ?? value.attributes ?? relation;
}

function extractPdfUrl(pdf: unknown) {
    if (!pdf) return null;
    if (typeof pdf === "string") return pdf;

    const data = getRelationData(pdf);
    if (!data || typeof data !== "object") return null;

    const url = (data as { url?: unknown }).url;
    if (typeof url !== "string") return null;

    const base =
        process.env.STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        "https://cms-staging.energdive.com";

    return url.startsWith("http") ? url : `${base}${url}`;
}

// Canonical app origin — avoids redirecting to localhost behind a proxy
function getAppOrigin(request: NextRequest): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");
    // Fallback: derive from x-forwarded-host header if present
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        return `${proto}://${host}`;
    }
    // Last resort: use request URL origin (may be localhost in dev, that's fine)
    return new URL(request.url).origin;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const requestUrl = new URL(request.url);
    const appOrigin = getAppOrigin(request);

    // 1. Check user authentication
    const { userId } = await auth();
    if (!userId) {
        // Require login first, then return to this download URL.
        const downloadPath = requestUrl.pathname;
        const redirectUrl = `${appOrigin}/auth?redirect_url=${encodeURIComponent(downloadPath)}`;
        return NextResponse.redirect(redirectUrl);
    }

    // 2. Check profile and onboarding completion
    const profile = await getUserProfile(userId);
    if (!profile || !profile.onboarding_completed) {
        const downloadPath = requestUrl.pathname;
        const redirectUrl = `${appOrigin}/onboarding?return_to=${encodeURIComponent(downloadPath)}`;
        return NextResponse.redirect(redirectUrl);
    }

    // 3. Find the paper by slug
    let papers = [];
    try {
        papers = await fetchPaperSubmissions(KNOWLEDGE_BASE_QUERY);
    } catch (error) {
        console.error("Error fetching papers for download:", error);
        return new NextResponse("Error fetching paper submissions", { status: 500 });
    }

    const paper = (papers as PaperSubmission[]).find((p) =>
        String(p.status ?? "").toLowerCase() === "accepted" &&
        slugify(p.title || "untitled-paper") === slug
    );
    if (!paper) {
        return new NextResponse("Paper not found", { status: 404 });
    }

    // Prefer final paper (full paper) over abstract PDF.
    // Priority order:
    //   1. Accepted/published final paper (finalPaperPdf)
    //   2. ANY final paper submission that has a file (regardless of status, e.g. pending)
    //   3. Abstract PDF as last resort
    let documentUrl = extractPdfUrl(paper.finalPaperPdf);

    if (!documentUrl && Array.isArray(paper.finalPaperSubmissions) && paper.finalPaperSubmissions.length > 0) {
        // Try accepted submissions first, then any submission with a file
        const sorted = [...paper.finalPaperSubmissions].sort((a, b) => {
            const aAccepted = ["accepted", "published", "approved"].includes((a.final_status ?? "").toLowerCase()) ? 0 : 1;
            const bAccepted = ["accepted", "published", "approved"].includes((b.final_status ?? "").toLowerCase()) ? 0 : 1;
            return aAccepted - bAccepted;
        });
        for (const fp of sorted) {
            const fpUrl = extractPdfUrl(fp.fullPaper);
            if (fpUrl) {
                documentUrl = fpUrl;
                break;
            }
        }
    }

    // Fall back to abstract PDF only if no final paper file found
    if (!documentUrl) {
        documentUrl = extractPdfUrl(paper.pdf);
    }
    if (!documentUrl) {
        return new NextResponse("Document not found for this paper", { status: 404 });
    }

    // 4. Save download record in the database
    try {
        await addPaperDownload(userId, slug, paper.title || "Untitled Paper", documentUrl);
    } catch (error) {
        console.error("Failed to record paper download in database:", error);
        return new NextResponse("Failed to record download", { status: 500 });
    }

    // 5. Redirect to user's dashboard My Downloads section (use canonical origin)
    return NextResponse.redirect(`${appOrigin}/dashboard/my-downloads`);
}
