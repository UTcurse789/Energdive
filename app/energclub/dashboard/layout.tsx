import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/queries";
import {
    DEFAULT_POST_AUTH_REDIRECT,
    POST_AUTH_REDIRECT_COOKIE,
    getSafeRedirectFromStoredValue,
} from "@/lib/post-auth-redirect";

export default async function EnergClubDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth");
    }

    const profile = await getUserProfile(userId);

    if (!profile?.onboarding_completed) {
        const cookieStore = await cookies();
        const storedReturnTo = getSafeRedirectFromStoredValue(
            cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value
        );
        const returnTo = storedReturnTo !== DEFAULT_POST_AUTH_REDIRECT
            ? storedReturnTo
            : "/energclub/dashboard";

        redirect(`/onboarding?return_to=${encodeURIComponent(returnTo)}`);
    }

    return <>{children}</>;
}
