import { OPINION_PAGE_METADATA } from "@/lib/route-metadata";
import { toIsoDate } from "@/lib/date";
import { slugify } from "@/lib/utils";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getOpinionContentKind } from "@/lib/content-tags";

export const metadata = OPINION_PAGE_METADATA;

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const SITE = "https://www.energdive.com";
const DESK_REGEX = /\b(desk|editorial|team|energdive|newsroom)\b/i;

async function getOpinionListSchemas() {
    try {
        const res = await fetch(
            `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[FeaturedImage]=true&populate[content_tag]=true&populate[author][populate]=avatar&sort=Date:desc&pagination[pageSize]=30`,
            { next: { revalidate: 600 } }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const data: any[] = json?.data ?? [];
        const items = data.filter((item) => getOpinionContentKind(item) === "opinion");
        if (items.length === 0) return null;

        const breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                { "@type": "ListItem", position: 2, name: "Opinion", item: `${SITE}/opinion` },
            ],
        };

        const itemList = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: items.map((item, i) => {
                const imgUrl = item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : null;
                const authorName: string = item?.author?.name || "ENERGDIVE News Desk";
                const isOrg = !item?.author?.name || DESK_REGEX.test(authorName);
                return {
                    "@type": "ListItem",
                    position: i + 1,
                    item: {
                        "@type": "OpinionNewsArticle",
                        url: `${SITE}/opinion/${item.slug}`,
                        headline: item.Title,
                        datePublished: toIsoDate(item.Date || item.publishedAt || item.createdAt),
                        author: {
                            "@type": isOrg ? "Organization" : "Person",
                            name: authorName,
                            url: `${SITE}/author/${slugify(authorName)}`,
                        },
                        ...(imgUrl && {
                            image: {
                                "@type": "ImageObject",
                                url: imgUrl.startsWith("http") ? imgUrl : `${SITE}${imgUrl}`,
                                width: 1200,
                                height: 630,
                            },
                        }),
                    },
                };
            }),
        };
        return { breadcrumb, itemList };
    } catch {
        return null;
    }
}

export default async function OpinionLayout({ children }: { children: React.ReactNode }) {
    const schemas = await getOpinionListSchemas();
    return (
        <>
            {schemas && (
                <>
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb).replace(/</g, "\\u003c") }} />
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.itemList).replace(/</g, "\\u003c") }} />
                </>
            )}
            {children}
        </>
    );
}
