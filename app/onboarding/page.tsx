import OnboardingWizard from "@/components/onboarding/wizard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries";

export default async function OnboardingPage() {
    // auth() reads from the middleware-verified session (no API call).
    // Middleware already protects /onboarding — userId is guaranteed here.
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // DB check — if profile already exists, go to dashboard
    const profile = await getUserProfile(userId);
    if (profile) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome to Energdive</h1>
                <p className="text-zinc-500">Let's set up your personalized experience.</p>
            </div>

            <OnboardingWizard />

            <div className="mt-8 text-center text-xs text-zinc-400">
                <p>&copy; {new Date().getFullYear()} Energdive. All rights reserved.</p>
            </div>
        </div>
    );
}
