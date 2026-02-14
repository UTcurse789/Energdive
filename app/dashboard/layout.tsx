import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();

    // If user is not onboarded, redirect to onboarding
    if (!user?.publicMetadata?.onboardingComplete) {
        redirect("/onboarding");
    }

    return <>{children}</>;
}
