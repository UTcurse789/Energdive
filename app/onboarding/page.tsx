import OnboardingWizard from "@/components/onboarding/wizard";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const user = await currentUser();

    // If already onboarded, send straight to dashboard.
    // currentUser() always fetches fresh data from Clerk API — no stale JWT issues.
    if (user?.publicMetadata?.onboarding_completed) {
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
