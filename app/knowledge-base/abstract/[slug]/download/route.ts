import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { getUserProfile, addPaperDownload } from "@/lib/queries";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";

const KNOWLEDGE_BASE_QUERY =
    "populate[pdf][fields][0]=url&populate[pdf][fields][1]=name&populate[pdf][fields][2]=size&populate[pdf][fields][3]=ext&sort[0]=submitted_date:desc&filters[paper_status][$eq]=accepted&pagination[pageSize]=100";

function slugify(text: string) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function extractPdfUrl(pdf: any) {
    if (!pdf) return null;
    if (typeof pdf === "string") return pdf;

    const data = pdf?.data?.attributes ?? pdf?.data ?? pdf?.attributes ?? pdf;
    if (!data?.url) return null;

    const base =
        process.env.STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        "https://cms-staging.energdive.com";

    return data.url.startsWith("http") ? data.url : `${base}${data.url}`;
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
        // Redirect to auth, returning to this exact URL afterwards
        const redirectUrl = `/auth?redirect_url=${encodeURIComponent(requestUrl.pathname)}`;
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

    const paper = papers.find((p: any) => slugify(p.title || "untitled-paper") === slug);
    if (!paper) {
        return new NextResponse("Paper not found", { status: 404 });
    }

    const pdfUrl = extractPdfUrl(paper.pdf);
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
