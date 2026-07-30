import { Metadata } from "next";
import { toIsoDate } from "@/lib/date";
import { slugify } from "@/lib/utils";
import { strapiImageUrl } from "@/lib/strapi-image";

export const metadata: Metadata = {
  title: {
    default: "Energy Editorials & Policy Commentary India | ENERGDIVE",
    template: "%s - ENERGDIVE",
  },
  description:
    "Read ENERGDIVE editorials featuring sharp commentary, policy perspectives, and strong viewpoints on India's energy transition, markets, regulation, and leadership agenda.",
  keywords: [
    "energy editorials india",
    "energdive editorial",
    "energy policy commentary india",
    "energy market commentary india",
    "india energy leadership opinion",
    "power sector editorial india",
    "oil and gas editorial india",
    "renewable energy editorial india",
  ],
  authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
  publisher: "ENERGDIVE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://www.energdive.com/editorial",
  },
  openGraph: {
    title: "Energy Editorials & Policy Commentary India | ENERGDIVE",
    description:
      "Explore ENERGDIVE editorials on energy policy, markets, leadership, and India's transition priorities.",
    url: "https://www.energdive.com/editorial",
    type: "website",
    siteName: "ENERGDIVE",
    images: [
      {
        url: "https://www.energdive.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Energy Editorials India | ENERGDIVE",
    description:
      "Read ENERGDIVE editorials covering India's energy policy, markets, and leadership conversations.",
    site: "@energdive",
  },
};

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const SITE = "https://www.energdive.com";
const DESK_REGEX = /\b(desk|editorial|team|energdive|newsroom)\b/i;

async function getEditorialListSchemas() {
    try {
        const res = await fetch(
            `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&filters[content_tag][title][$eq]=Editorial&populate[FeaturedImage]=true&populate[author][populate]=avatar&sort=Date:desc&pagination[pageSize]=30`,
            { next: { revalidate: 600 } }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const items: any[] = json?.data ?? [];
        if (items.length === 0) return null;

        const breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
                { "@type": "ListItem", position: 2, name: "Editorial", item: `${SITE}/editorial` },
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
                        url: `${SITE}/editorial/${item.slug}`,
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

export default async function EditorialLayout({ children }: { children: React.ReactNode }) {
    const schemas = await getEditorialListSchemas();
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
