import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/energclub/dashboard(.*)", "/dashboard(.*)", "/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    // Only handle authentication — NOT onboarding status.
    // Onboarding redirects are handled at the page/layout level using
    // currentUser() which always returns fresh data from Clerk's API.
    // The middleware JWT can be stale for up to 60s, causing redirect loops.
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Forward client IP to downstream API routes via custom header.
    // On Vercel Edge, req.ip is the real client IP.
    // Locally, x-forwarded-for won't be set, so IP stays null (expected).
    const requestWithIp = req as typeof req & { ip?: string };
    const clientIp =
        requestWithIp.ip ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;

    const response = NextResponse.next();
    if (clientIp) {
        response.headers.set("x-client-ip", clientIp);
    }
    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!api/(?:paper-submissions|submit-abstract|submit-paper|submit-final-paper)|ingest|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/trpc/(.*)',
    ],
};
