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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const requestUrl = new URL(request.url);

    // 1. Check user authentication
    const { userId } = await auth();
    if (!userId) {
        // Redirect to the abstract page if not logged in
        const redirectUrl = `/knowledge-base/abstract/${slug}`;
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // 2. Check profile and onboarding completion
    const profile = await getUserProfile(userId);
    if (!profile || !profile.onboarding_completed) {
        // Redirect to onboarding, returning to this exact URL afterwards
        const redirectUrl = `/onboarding?return_to=${encodeURIComponent(requestUrl.pathname)}`;
        return NextResponse.redirect(new URL(redirectUrl, request.url));
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
        p.hasAcceptedFinalPaper && slugify(p.title || "untitled-paper") === slug
    );
    if (!paper) {
        return new NextResponse("Paper not found", { status: 404 });
    }

    const pdfUrl = extractPdfUrl(paper.finalPaperPdf);
    if (!pdfUrl) {
        return new NextResponse("PDF not found for this paper", { status: 404 });
    }

    // 4. Save download record in the database
    try {
        await addPaperDownload(userId, slug, paper.title || "Untitled Paper", pdfUrl);
    } catch (error) {
        console.error("Failed to record paper download in database:", error);
        return new NextResponse("Failed to record download", { status: 500 });
    }

    // 5. Redirect to user's dashboard My Downloads section
    const targetUrl = new URL("/dashboard/my-downloads", request.url);
    return NextResponse.redirect(targetUrl);
}
