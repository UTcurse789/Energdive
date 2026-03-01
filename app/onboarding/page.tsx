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
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries";
import OnboardingBackground from "@/components/onboarding/onboarding-bg";

export default async function OnboardingPage() {
    // auth() reads from the middleware-verified session (no API call).
    // Middleware already protects /onboarding — userId is guaranteed here.
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth");
    }

    // Check Clerk metadata FIRST (always available, no DB needed)
    const user = await currentUser();
    if (user?.publicMetadata?.onboarding_completed) {
        redirect("/dashboard");
    }

    // DB check — if profile already exists and completed, go to dashboard
    const profile = await getUserProfile(userId);
    if (profile?.onboarding_completed) {
        redirect("/dashboard");
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

            <div className="relative z-10 w-full max-w-2xl">
                <OnboardingWizard />
            </div>

            <div className="relative z-10 mt-8 text-center text-xs text-zinc-400">
                <p>&copy; {new Date().getFullYear()} Energdive. All rights reserved.</p>
            </div>
        </div>
    );
}