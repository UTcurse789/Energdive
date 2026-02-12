import { ISSUES } from "@/data/dummy";
import { notFound } from "next/navigation";
import { IssueDetailClient } from "@/components/issue-detail-client";

interface IssuePageProps {
    params: Promise<{ slug: string }>;
}

export default async function IssueDetailPage({ params }: IssuePageProps) {
    const { slug } = await params;
    const issue = ISSUES.find((i) => i.slug === slug);

    if (!issue) {
        notFound();
    }

    return <IssueDetailClient issue={issue} />;
}
