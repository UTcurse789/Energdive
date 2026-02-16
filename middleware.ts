import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/energclub/dashboard(.*)", "/dashboard(.*)", "/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, redirectToSignIn } = await auth();

    // Only handle authentication — NOT onboarding status.
    // Onboarding redirects are handled at the page/layout level using
    // currentUser() which always returns fresh data from Clerk's API.
    // The middleware JWT can be stale for up to 60s, causing redirect loops.
    if (!userId && isProtectedRoute(req)) {
        return redirectToSignIn();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
