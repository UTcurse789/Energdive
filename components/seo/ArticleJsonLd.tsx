import Script from "next/script";
import { getCanonicalUrl } from "@/lib/seo";

/**
 * NewsArticle JSON-LD structured data component.
 *
 * Outputs a <script type="application/ld+json"> tag with schema.org
 * NewsArticle markup for Google Search rich results.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/article
 */

interface ArticleJsonLdProps {
    title: string;
    /** ISO-8601 date string (e.g. "2026-04-08") or raw Date string from Strapi */
    datePublished: string;
    /** ISO-8601 updated date string */
    dateModified?: string;
    /** Author display name */
    authorName?: string | null;
    /** Article slug used to build the canonical URL */
    slug: string;
    /** Absolute URL to the featured image */
    imageUrl: string;
    /** Route prefix, e.g. "news", "articles", "analysis" */
    section: string;
    /** Optional excerpt / description */
    description?: string;
}

export function ArticleJsonLd({
    title,
    datePublished,
    dateModified,
    authorName,
    slug,
    imageUrl,
    section,
    description,
}: ArticleJsonLdProps) {
    const toIsoDate = (value: string) => {
        try {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? value : d.toISOString();
        } catch {
            return value;
        }
    };

    const toAbsoluteUrl = (value: string) => {
        if (!value) return getCanonicalUrl("/og-image.jpg");
        if (value.startsWith("http://") || value.startsWith("https://")) return value;
        return getCanonicalUrl(value);
    };

    const canonicalUrl = getCanonicalUrl(`/${section}/${slug}`);
    const publishedIsoDate = toIsoDate(datePublished);
    const modifiedIsoDate = toIsoDate(dateModified || datePublished);
    const normalizedImageUrl = toAbsoluteUrl(imageUrl);
    const normalizedDescription = description?.trim();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        datePublished: publishedIsoDate,
        dateModified: modifiedIsoDate,
        author: {
            "@type": "Person",
            name: authorName || "EnergDive Editorial",
        },
        publisher: {
            "@type": "Organization",
            name: "EnergDive",
            logo: {
                "@type": "ImageObject",
                url: getCanonicalUrl("/logo.png"),
            },
        },
        image: normalizedImageUrl,
        url: canonicalUrl,
        ...(normalizedDescription ? { description: normalizedDescription } : {}),
    };

    return (
        <Script
            id={`news-article-json-ld-${section}-${slug}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
