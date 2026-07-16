import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import KnowledgeBaseExtraInfoForm from "@/components/paper-submission/knowledge-base-extra-info-form";
import { getUserProfile } from "@/lib/queries";
import { PAPER_PROFESSION_OPTIONS } from "@/lib/paper-submission-taxonomy";

export const metadata = {
    title: "Submit Paper",
    description: "Start the ENERGDIVE knowledge hub paper submission flow.",
};

export default async function KnowledgeBaseSubmitPage({ searchParams }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/knowledge-hub");
    }

    const profile = await getUserProfile(userId);
    const resolvedSearchParams = searchParams ? await searchParams : {};

    if (!profile?.onboarding_completed) {
        redirect(`/onboarding?return_to=${encodeURIComponent("/knowledge-hub/submit")}`);
    }

    if (profile?.has_submitted_abstract) {
        redirect("/dashboard/my-submissions/new");
    }

    const safeInstitution =
        typeof resolvedSearchParams?.institution === "string"
            ? resolvedSearchParams.institution
            : profile.organization ?? "";

    const professionFromQuery =
        typeof resolvedSearchParams?.profession === "string"
            ? resolvedSearchParams.profession
            : "";

    const safeProfession = PAPER_PROFESSION_OPTIONS.includes(professionFromQuery)
        ? professionFromQuery
        : "";

    return (
        <KnowledgeBaseExtraInfoForm
            defaultInstitution={safeInstitution}
            defaultProfession={safeProfession}
        />
    );
}
