import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import KnowledgeBaseExtraInfoForm from "@/components/paper-submission/knowledge-base-extra-info-form";
import { getUserProfile } from "@/lib/queries";
import { PAPER_PROFESSION_OPTIONS } from "@/lib/paper-submission-taxonomy";

export const metadata = {
    title: "Submit Paper",
    description: "Start the ENERGDIVE knowledge base paper submission flow.",
};

export default async function KnowledgeBaseSubmitPage({ searchParams }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/knowledge-base");
    }

    const profile = await getUserProfile(userId);
    const resolvedSearchParams = searchParams ? await searchParams : {};

    if (!profile?.onboarding_completed) {
        redirect(`/onboarding?return_to=${encodeURIComponent("/knowledge-base/submit")}`);
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
