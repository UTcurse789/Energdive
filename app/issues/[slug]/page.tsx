import { notFound } from "next/navigation";
import type { Metadata } from "next";
import IssueDetailClient from "@/components/issue-detail-client";
import { getCanonicalUrl } from "@/lib/seo";
import { getIssue, generateIssueStaticParams } from "@/lib/api/issue-detail";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const issue = await getIssue(slug);

    if (!issue) {
        return {
            title: { absolute: "Issue - ENERGDIVE" },
            description: "Explore ENERGDIVE magazine issues and editions.",
        };
    }

    const cleanIssueTitle = String(issue.title).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanIssueTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/issues/${slug}`);
    const description =
        issue.description?.trim() ||
        `Explore ${issue.title} featuring expert insights on India's energy transition.`;
    const imageUrl = issue.coverImage?.startsWith("http")
        ? issue.coverImage
        : getCanonicalUrl(issue.coverImage || "/fav.jpg");

    return {
        title: { absolute: shareTitle },
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: shareTitle,
            description,
            url: canonicalUrl,
            siteName: "ENERGDIVE",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: shareTitle,
                },
            ],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description,
            images: [imageUrl],
        },
    };
}

export async function generateStaticParams() {
    return generateIssueStaticParams();
}

export default async function IssueDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const issue = await getIssue(slug);
    if (!issue) notFound();
    return <IssueDetailClient issue={issue} />;
}
