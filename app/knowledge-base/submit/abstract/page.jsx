import { redirect } from "next/navigation";

export const metadata = {
    title: "Submit Abstract Form",
    description: "Complete your knowledge base abstract submission.",
};

export default async function KnowledgeBaseSubmitAbstractPage({ searchParams }) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const params = new URLSearchParams();
    if (typeof resolvedSearchParams?.institution === "string") {
        params.set("institution", resolvedSearchParams.institution);
    }
    if (typeof resolvedSearchParams?.profession === "string") {
        params.set("profession", resolvedSearchParams.profession);
    }
    const query = params.toString();
    redirect(query ? `/dashboard/my-submissions/new?${query}` : "/dashboard/my-submissions/new");
}
