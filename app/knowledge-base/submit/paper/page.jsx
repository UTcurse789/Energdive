import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import KnowledgeBasePaperForm from "@/components/paper-submission/knowledge-base-paper-form";
import { fetchPaperSectors, PAPER_PROFESSION_OPTIONS } from "@/lib/paper-submission-taxonomy";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
    title: "Submit Paper Form",
    description: "Complete your knowledge base paper submission.",
};

export default async function KnowledgeBaseSubmitPaperPage({ searchParams }) {
    const { userId } = await auth();

    if (!userId) {
        redirect(`/auth?redirect_url=${encodeURIComponent("/knowledge-base/submit")}`);
    }

    const profile = await getUserProfile(userId);
    const resolvedSearchParams = searchParams ? await searchParams : {};

    if (!profile?.onboarding_completed) {
        redirect(`/onboarding?return_to=${encodeURIComponent("/knowledge-base/submit")}`);
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? profile.email ?? "";
    const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
        || [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
        || "";

    const institution = typeof resolvedSearchParams?.institution === "string"
        ? resolvedSearchParams.institution
        : profile.organization ?? "";

    const profession = typeof resolvedSearchParams?.profession === "string" &&
        PAPER_PROFESSION_OPTIONS.includes(resolvedSearchParams.profession)
        ? resolvedSearchParams.profession
        : "";

    const sectors = await fetchPaperSectors();

    return (
        <KnowledgeBasePaperForm
            initialAuthorName={authorName}
            initialAuthorEmail={email}
            initialAffiliation={institution}
            initialProfession={profession}
            sectors={sectors}
        />
    );
}
