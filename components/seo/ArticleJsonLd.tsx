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
    authorName,
    slug,
    imageUrl,
    section,
    description,
}: ArticleJsonLdProps) {
    // Normalise the date to ISO-8601 — Strapi may return "2026-04-08" or a
    // full ISO string; Date constructor handles both.
    const isoDate = (() => {
        try {
            const d = new Date(datePublished);
            return Number.isNaN(d.getTime()) ? datePublished : d.toISOString();
        } catch {
            return datePublished;
        }
    })();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        image: [imageUrl],
        datePublished: isoDate,
        dateModified: isoDate,
        author: [
            {
                "@type": "Person",
                name: authorName || "Energdive Editorial",
            },
        ],
        publisher: {
            "@type": "Organization",
            name: "Energdive",
            logo: {
                "@type": "ImageObject",
                url: "https://energdive.com/fav.jpg",
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://energdive.com/${section}/${slug}`,
        },
        ...(description ? { description } : {}),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
