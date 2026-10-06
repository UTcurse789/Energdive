import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo";
import { getIssue, generateIssueStaticParams } from "@/lib/api/issue-detail";
import EpdfReaderClient from "@/components/epdf-reader/epdf-reader-client";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const issue = await getIssue(slug);

    if (!issue) {
        return {
            title: { absolute: "ePDF Reader - ENERGDIVE" },
            description: "Read digital magazine editions on ENERGDIVE.",
        };
    }

    const cleanIssueTitle = String(issue.title).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `Read ${cleanIssueTitle} Digital ePDF Edition | ENERGDIVE Magazine`;
    const canonicalUrl = getCanonicalUrl(`/issues/${slug}`);
    const description =
        issue.description?.trim() ||
        `Read the complete digital ePDF edition of ${issue.title} featuring insights on India's energy transition directly in your browser.`;
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
            url: getCanonicalUrl(`/issues/${slug}/epdf`),
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

export default async function EpdfReaderPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const issue = await getIssue(slug);

    if (!issue) {
        notFound();
    }

    return <EpdfReaderClient issue={issue} />;
}
