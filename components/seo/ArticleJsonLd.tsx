import React from "react";
import { getCanonicalUrl } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import { toIsoDate } from "@/lib/date";
import { ORGANIZATION_SCHEMA } from "@/lib/organization-schema";

export interface ArticleJsonLdProps {
    title?: string;
    headline?: string;
    /** ISO-8601 date string or raw Date string from Strapi */
    datePublished: string;
    /** ISO-8601 updated date string */
    dateModified?: string;
    /** Author display name */
    authorName?: string | null;
    authorType?: 'Person' | 'Organization';
    authorUrl?: string;
    /** Article slug used to build canonical URL */
    slug?: string;
    url?: string;
    /** Absolute or relative URL to featured image */
    imageUrl?: string;
    image?: string;
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

function cleanHeadline(title: string): string {
    if (!title) return "";
    return title
        .replace(/\s*[\|-]\s*ENERGDIVE$/i, '')
        .replace(/\s*[\|-]\s*EnergDive$/i, '')
        .trim();
}

export function ArticleJsonLd({
    title,
    headline,
    datePublished,
    dateModified,
    authorName,
    authorType,
    authorUrl,
    slug,
    url,
    imageUrl,
    image,
    section = "news",
    description,
    category,
    categorySlug,
    schemaType = "NewsArticle",
}: ArticleJsonLdProps) {
    const rawHeadline = headline || title || "ENERGDIVE News";
    const finalHeadline = cleanHeadline(rawHeadline).substring(0, 110);

    const toAbsoluteUrl = (value?: string) => {
        if (!value) return getCanonicalUrl("/fav.jpg");
        if (value.startsWith("http://") || value.startsWith("https://")) return value;
        return getCanonicalUrl(value);
    };

    const canonicalUrl = url || (slug ? getCanonicalUrl(`/${section}/${slug}`) : getCanonicalUrl("/"));

    // Guard clause: enforce reliable fallback ISO strings to avoid string serialization omission
    const nowIso = new Date().toISOString();
    const parsedPublished = toIsoDate(datePublished);
    const finalPublished = parsedPublished && !isNaN(Date.parse(parsedPublished))
        ? new Date(parsedPublished).toISOString()
        : nowIso;

    const parsedModified = toIsoDate(dateModified);
    const finalModified = parsedModified && !isNaN(Date.parse(parsedModified))
        ? new Date(parsedModified).toISOString()
        : finalPublished;

    const targetImageUrl = image || imageUrl || "";
    const normalizedImageUrl = toAbsoluteUrl(targetImageUrl);
    const normalizedDescription = description?.trim() || finalHeadline;

    const rawAuthor = (authorName || "").trim();
    const effectiveAuthorName = rawAuthor || "ENERGDIVE Editorial Desk";
    const isOrgAuthor = authorType === "Organization" || !rawAuthor || GENERIC_DESK_REGEX.test(rawAuthor);

    const authorSchema = {
        "@type": isOrgAuthor ? "Organization" : (authorType || "Person"),
        "name": effectiveAuthorName,
        "url": authorUrl || getCanonicalUrl(`/author/${slugify(effectiveAuthorName)}`),
    };

    const articleSchema = {
        "@type": schemaType,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl,
        },
        "headline": finalHeadline,
        "description": normalizedDescription,
        "image": {
            "@type": "ImageObject",
            "url": normalizedImageUrl,
            "width": 1200,
            "height": 630,
        },
        "datePublished": finalPublished,
        "dateModified": finalModified,
        "author": authorSchema,
        "publisher": {
            "@type": "Organization",
            "@id": "https://www.energdive.com/#organization",
            "name": "ENERGDIVE",
            "url": "https://www.energdive.com",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.energdive.com/fav.jpg",
                "width": 192,
                "height": 192
            }
        },
        "url": canonicalUrl,
    };

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
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
            name: sectionName,
            item: getCanonicalUrl(`/${section}`),
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
            name: finalHeadline,
            item: canonicalUrl,
        });
    } else {
        breadcrumbs.push({
            "@type": "ListItem",
            position: 3,
            name: finalHeadline,
            item: canonicalUrl,
        });
    }

    const breadcrumbSchema = {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs,
    };

    const graphSchema = {
        "@context": "https://schema.org",
        "@graph": [
            ORGANIZATION_SCHEMA,
            articleSchema,
            breadcrumbSchema
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(graphSchema).replace(/</g, "\\u003c"),
            }}
        />
    );
}

export default ArticleJsonLd;
