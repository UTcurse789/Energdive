import React from "react";
import { getCanonicalUrl } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import { toIsoDate } from "@/lib/date";

interface ArticleJsonLdProps {
    title: string;
    /** ISO-8601 date string or raw Date string from Strapi */
    datePublished: string;
    /** ISO-8601 updated date string */
    dateModified?: string;
    /** Author display name */
    authorName?: string | null;
    /** Article slug used to build canonical URL */
    slug: string;
    /** Absolute or relative URL to featured image */
    imageUrl: string;
    /** Route prefix, e.g. "news" */
    section?: string;
    /** Optional excerpt / description */
    description?: string;
    /** Category / Sector display name */
    category?: string;
    /** Category / Sector URL slug */
    categorySlug?: string;
    /** Override the root schema type, defaults to NewsArticle */
    schemaType?: "NewsArticle" | "OpinionNewsArticle" | "Article";
}

const GENERIC_DESK_REGEX = /\b(desk|editorial|team|energdive|newsroom)\b/i;

export function ArticleJsonLd({
    title,
    datePublished,
    dateModified,
    authorName,
    slug,
    imageUrl,
    section = "news",
    description,
    category,
    categorySlug,
    schemaType = "NewsArticle",
}: ArticleJsonLdProps) {
    const toAbsoluteUrl = (value: string) => {
        if (!value) return getCanonicalUrl("/fav.jpg");
        if (value.startsWith("http://") || value.startsWith("https://")) return value;
        return getCanonicalUrl(value);
    };

    const canonicalUrl = getCanonicalUrl(`/${section}/${slug}`);
    const publishedIsoDate = toIsoDate(datePublished);
    const modifiedIsoDate = toIsoDate(dateModified || datePublished);
    const normalizedImageUrl = toAbsoluteUrl(imageUrl);
    const normalizedDescription = description?.trim() || title;

    const rawAuthor = (authorName || "").trim();
    const effectiveAuthorName = rawAuthor || "ENERGDIVE News Desk";
    const isOrgAuthor = !rawAuthor || GENERIC_DESK_REGEX.test(rawAuthor);

    const authorSchema = isOrgAuthor
        ? {
            "@type": "Organization",
            name: effectiveAuthorName,
            url: getCanonicalUrl(`/author/${slugify(effectiveAuthorName)}`),
        }
        : {
            "@type": "Person",
            name: effectiveAuthorName,
            url: getCanonicalUrl(`/author/${slugify(effectiveAuthorName)}`),
        };

    const newsArticleJsonLd = {
        "@context": "https://schema.org",
        "@type": schemaType,
        headline: title,
        description: normalizedDescription,
        datePublished: publishedIsoDate,
        dateModified: modifiedIsoDate,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonicalUrl,
        },
        author: authorSchema,
        publisher: {
            "@type": "Organization",
            name: "ENERGDIVE",
            url: getCanonicalUrl("/"),
            logo: {
                "@type": "ImageObject",
                url: getCanonicalUrl("/logo.png"),
                width: 600,
                height: 60,
            },
        },
        image: {
            "@type": "ImageObject",
            url: normalizedImageUrl,
            width: 1200,
            height: 630,
        },
        url: canonicalUrl,
    };

    const breadcrumbs = [
        {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: getCanonicalUrl("/"),
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "News",
            item: getCanonicalUrl("/news"),
        },
    ];

    if (category && categorySlug) {
        breadcrumbs.push({
            "@type": "ListItem",
            position: 3,
            name: category,
            item: getCanonicalUrl(`/sectors/${categorySlug}`),
        });
        breadcrumbs.push({
            "@type": "ListItem",
            position: 4,
            name: title,
            item: canonicalUrl,
        });
    } else {
        breadcrumbs.push({
            "@type": "ListItem",
            position: 3,
            name: title,
            item: canonicalUrl,
        });
    }

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(newsArticleJsonLd).replace(/</g, "\\u003c"),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
                }}
            />
        </>
    );
}
