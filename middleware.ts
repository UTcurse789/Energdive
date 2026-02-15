import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/energclub/dashboard(.*)", "/dashboard(.*)", "/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, redirectToSignIn } = await auth();

    // If user is not logged in and trying to access a protected route
    if (!userId && isProtectedRoute(req)) {
        return redirectToSignIn();
    }

    // NOTE: Onboarding ↔ Dashboard redirects are handled at the page/layout
    // level using currentUser() which always returns fresh data from Clerk.
    // DO NOT add redirect logic here based on sessionClaims — the JWT can be
    // stale for up to 60s after metadata updates, causing redirect loops.
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
