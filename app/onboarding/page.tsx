// import OnboardingWizard from "@/components/onboarding/wizard";
// import { auth } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import { getUserProfile } from "@/lib/queries";
// import OnboardingBackground from "@/components/onboarding/onboarding-bg";

// export default async function OnboardingPage() {
//     // auth() reads from the middleware-verified session (no API call).
//     // Middleware already protects /onboarding — userId is guaranteed here.
//     const { userId } = await auth();

//     if (!userId) {
//         redirect("/auth");
//     }

//     // DB check — if profile already exists and completed, go to dashboard
//     const profile = await getUserProfile(userId);
//     if (profile?.onboarding_completed) {
//         redirect("/dashboard");
//     }

//     return (
//         <div className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col items-center justify-center p-4">
//             {/* DotGrid Background */}
//             <OnboardingBackground />

//             <div className="relative z-10 mb-8 text-center">
//                 <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome to Energdive</h1>
//                 <p className="text-zinc-500">Let&apos;s set up your personalized experience.</p>
//             </div>

//             <div className="relative z-10">
//                 <OnboardingWizard />
//             </div>

//             <div className="relative z-10 mt-8 text-center text-xs text-zinc-400">
//                 <p>&copy; {new Date().getFullYear()} Energdive. All rights reserved.</p>
//             </div>
//         </div>
//     );
// }


import Image from "next/image";
import OnboardingWizard from "@/components/onboarding/wizard";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUserProfileRow, getUserProfile } from "@/lib/queries";
import OnboardingBackground from "@/components/onboarding/onboarding-bg";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    POST_AUTH_REDIRECT_COOKIE,
    getSafeRedirectFromStoredValue,
    getSafeRedirectPath,
} from "@/lib/post-auth-redirect";

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams?: Promise<{ return_to?: string | string[] }>;
}) {
    // auth() reads from the middleware-verified session (no API call).
    // Middleware already protects /onboarding — userId is guaranteed here.
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth");
    }

    const clerkUser = await currentUser();
    const email =
        clerkUser?.primaryEmailAddress?.emailAddress ||
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        "";
    const phone = typeof clerkUser?.publicMetadata?.phone === "string"
        ? clerkUser.publicMetadata.phone
        : null;
    const clerkOnboardingCompleted = clerkUser?.publicMetadata?.onboarding_completed === true;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const cookieStore = await cookies();
    const returnToFromQuery = typeof resolvedSearchParams?.return_to === "string"
        ? getSafeRedirectPath(resolvedSearchParams.return_to)
        : null;
    const returnToFromCookie = getSafeRedirectFromStoredValue(
        cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value
    );
    const returnTo = returnToFromQuery ||
        (returnToFromCookie !== DEFAULT_POST_AUTH_REDIRECT ? returnToFromCookie : null) ||
        "/";

    if (email) {
        try {
            await ensureUserProfileRow({
                clerkId: userId,
                email,
                firstName: clerkUser?.firstName || null,
                lastName: clerkUser?.lastName || null,
                phone,
                onboardingCompleted: clerkOnboardingCompleted,
            });
        } catch (error) {
            console.error("[ONBOARDING_PAGE] Failed to ensure user profile row:", error);
        }
    }

    const profile = await getUserProfile(userId, email);
    if (profile?.onboarding_completed || clerkOnboardingCompleted) {
        console.warn("[ONBOARDING_PAGE] Redirecting completed user away from onboarding", {
            userId,
            email,
            dbOnboardingCompleted: profile?.onboarding_completed ?? null,
            clerkOnboardingCompleted,
            returnTo,
        });
        redirect(returnTo);
    }

    return (
        <div className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col items-center justify-center p-4">
            {/* DotGrid Background */}
            <OnboardingBackground />

            {/* Added Logo Here */}
            <div className="relative z-10 mb-8">
                <Image
                    src="/logo - energclub-energdive.png"
                    alt="Energdive"
                    width={250}
                    height={80}
                    className="w-auto h-12 sm:h-16 object-contain mx-auto"
                    priority // Loads the logo immediately
                />
            </div>

            <div className="relative z-10 mb-8 text-center">
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome to ENERGClub</h1>
                <p className="text-zinc-500">Let&apos;s set up your personalized experience.</p>
            </div>

            <div className="relative z-10 w-full max-w-3xl">
                <OnboardingWizard returnTo={returnTo} />
            </div>

            <div className="relative z-10 mt-8 text-center text-xs text-zinc-400">
                <p>&copy; {new Date().getFullYear()} ENERGDIVE. All rights reserved.</p>
            </div>
        </div>
    );
}
