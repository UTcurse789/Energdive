// import { notFound } from "next/navigation";
// import { OpinionContent } from "./opinion-content";

// const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

// /* ================================
//    FETCH SINGLE OPINION
// ================================ */

// async function getOpinion(slug: string) {
//   const res = await fetch(
//     `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate=FeaturedImage`,
//     { cache: "no-store" }
//   );

//   const json = await res.json();
//   return json?.data?.[0] ?? null;
// }

// /* ================================
//    FETCH RECOMMENDED
// ================================ */

// async function getRecommended(currentSlug: string) {
//   const res = await fetch(
//     `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[author][populate]=avatar&populate=FeaturedImage`,
//     { cache: "no-store" }
//   );

//   const json = await res.json();

//   return (
//     json?.data
//       ?.filter((item: any) => item.slug !== currentSlug)
//       ?.slice(0, 3) ?? []
//   );
// }

// /* ================================
//    PAGE
// ================================ */

// export default async function OpinionDetailPage({
//   params,
// }: {
//   params: Promise<{ slug: string }>;
// }) {
//   const { slug } = await params;

//   const article = await getOpinion(slug);
//   if (!article) notFound();

//   const recommendedRaw = await getRecommended(slug);

//   /* ---------- FORMAT MAIN ---------- */

//   const opinion = {
//     id: article.id,
//     slug,
//     title: article.Title,
//     excerpt:
//       article?.Excerpt?.[0]?.children?.[0]?.text || "",
//     date: article.Date,
//     category: "Opinion",
//     content: article?.Content || [],
//     featuredImage:
//       article?.FeaturedImage?.url
//         ? strapiImageUrl(article.FeaturedImage.url)
//         : article?.FeaturedImage?.data?.attributes?.url
//           ? strapiImageUrl(article.FeaturedImage.data.attributes.url)
//           : "/placeholder.jpg",
//     image:
//       article?.FeaturedImage?.url
//         ? strapiImageUrl(article.FeaturedImage.url)
//         : "/placeholder.jpg",
//     readTime: "5 min read",
//     author: {
//       name: article?.author?.name,
//       role: article?.author?.designation || "Author",
//       avatar:
//         article?.author?.avatar?.url
//           ? strapiImageUrl(article.author.avatar.url)
//           : "/placeholder.jpg",
//       image:
//         article?.author?.avatar?.url
//           ? strapiImageUrl(article.author.avatar.url)
//           : "/placeholder.jpg",
//     },
//   };


//   /* ---------- FORMAT RECOMMENDED ---------- */

//   const recommended = recommendedRaw.map((item: any) => ({
//     id: item.id.toString(),
//     slug: item.slug,
//     title: item.Title,
//     category: "Opinion",
//     date: item.Date || "",
//     excerpt: item.Excerpt?.[0]?.children?.[0]?.text || "",
//     content: item.Content || [],
//     featuredImage:
//       item?.FeaturedImage?.url
//         ? strapiImageUrl(item.FeaturedImage.url)
//         : item?.FeaturedImage?.data?.attributes?.url
//           ? strapiImageUrl(item.FeaturedImage.data.attributes.url)
//           : "/placeholder.jpg",
//     image: item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : "/placeholder.jpg",
//     readTime: "5 min read",
//     author: {
//       name: item?.author?.name,
//       avatar:
//         item?.author?.avatar?.url
//           ? strapiImageUrl(item.author.avatar.url)
//           : "/placeholder.jpg",
//       image:
//         item?.author?.avatar?.url
//           ? strapiImageUrl(item.author.avatar.url)
//           : "/placeholder.jpg",
//       role: item?.author?.designation || "Contributing Analyst",
//     },
//   }));

//   return (
//     <OpinionContent
//       opinion={opinion}
//       recommended={recommended}
//     />
//   );
// }


import { notFound, redirect } from "next/navigation";
import OpinionContent from "./opinion-content";
import { strapiImageUrl } from "@/lib/strapi-image";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import type { Metadata } from "next";

type StrapiTag = {
  name?: string;
  slug?: string;
  title?: string;
  Title?: string;
  data?: StrapiTag | StrapiTag[];
  attributes?: StrapiTag;
};

type StrapiContentItem = {
  slug?: string;
  content_tag?: StrapiTag | StrapiTag[];
  attributes?: {
    content_tag?: StrapiTag | StrapiTag[];
  };
};

function slugifyTag(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeTag(tag: StrapiTag | null | undefined) {
    const source = tag?.attributes || tag;
    const name = source?.name || "";
    const slug = source?.slug || (name ? slugifyTag(name) : "");
    if (!name) return null;
    return { name, slug };
}

function extractContentTagTitle(contentTag: StrapiTag | StrapiTag[] | null | undefined): string | null {
  if (!contentTag) return null;

  if (Array.isArray(contentTag)) {
    const first = contentTag[0]?.attributes || contentTag[0];
    return first?.title || first?.Title || null;
  }

  const source = contentTag.data || contentTag.attributes || contentTag;

  if (Array.isArray(source)) {
    const first = source[0]?.attributes || source[0];
    return first?.title || first?.Title || null;
  }

  const normalizedSource = source.attributes || source;
  return normalizedSource.title || normalizedSource.Title || null;
}

function isInterviewContent(item: StrapiContentItem | null | undefined): boolean {
  const attrs = item?.attributes || item;
  const contentTag = extractContentTagTitle(attrs?.content_tag);
  return contentTag?.toLowerCase() === "interview";
}

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

async function getOpinion(slug: string) {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate=FeaturedImage&populate[content_tag]=true&populate[tags]=true`,
    { next: { revalidate: 3600 } }
  );
  const json = await res.json();
  return json?.data?.[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const articleData = await getOpinion(slug);

  if (!articleData) {
    return { title: { absolute: "Interview - ENERGDIVE" } };
  }

  const attrs = articleData.attributes || articleData;
  const baseTitle = attrs.Title || "Interview";
  const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
  const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
  const excerptBlock = attrs.Excerpt;
  const description =
    (Array.isArray(excerptBlock)
      ? excerptBlock[0]?.children?.[0]?.text
      : null) || "Read exclusive interviews with energy leaders at Energdive.";

  const imageUrl = attrs.FeaturedImage?.url
    ? strapiImageUrl(attrs.FeaturedImage.url)
    : attrs.FeaturedImage?.data?.attributes?.url
      ? strapiImageUrl(attrs.FeaturedImage.data.attributes.url)
      : "https://energdive.com/fav.jpg";

  return {
    title: { absolute: shareTitle },
    description,
    openGraph: {
      title: shareTitle,
      description,
      url: `https://energdive.com/interviews/${slug}`,
      siteName: "Energdive",
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

async function getRecommended(currentSlug: string) {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[author][populate]=avatar&populate=FeaturedImage&populate[content_tag]=true&pagination[limit]=12&sort=Date:desc`,
    { next: { revalidate: 3600 } }
  );
  const json = await res.json();
  const items = json?.data ?? [];

  return items
    .filter((item) => item.slug !== currentSlug)
    .filter((item) => isInterviewContent(item))
    .slice(0, 3);
}

export default async function OpinionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getOpinion(slug);
  if (!article) notFound();

  const contentTag = extractContentTagTitle((article.attributes || article)?.content_tag);
  if (contentTag && contentTag.toLowerCase() !== "interview") {
    redirect(`/opinion/${slug}`);
  }

  const recommendedRaw = await getRecommended(slug);

  // Extract and normalize tags
  const attrs = article.attributes || article;
  const tagsData = attrs.tags?.data || attrs.tags || [];
  const normalizedTags = Array.isArray(tagsData) ? tagsData.map((t) => normalizeTag(t)).filter(Boolean) : [];
  const sectorData = attrs.sectors || attrs.sector?.data?.attributes || null;
  const sectorSlug: string | undefined = Array.isArray(sectorData)
    ? sectorData[0]?.slug || undefined
    : sectorData?.slug || undefined;

  const opinion = {
    id: article.id,
    slug,
    title: article.Title || article.attributes?.Title,
    excerpt: article?.Excerpt?.[0]?.children?.[0]?.text || article.attributes?.Excerpt?.[0]?.children?.[0]?.text || "",
    content: article?.Content || article.attributes?.Content || [],
    category: "Interview",
    readTime: "6 min read",
    tags: normalizedTags,
    sectorSlug,
    featuredImage: (article.FeaturedImage?.url || article.attributes?.FeaturedImage?.data?.attributes?.url)
      ? strapiImageUrl(article.FeaturedImage?.url || article.attributes?.FeaturedImage?.data?.attributes?.url)
      : "/placeholder.jpg",
    author: {
      name: article?.author?.name || article.attributes?.author?.data?.attributes?.name || "Editorial Staff",
      role: article?.author?.designation || article.attributes?.author?.data?.attributes?.designation || "Senior Analyst",
      avatar: (article?.author?.avatar?.url || article.attributes?.author?.data?.attributes?.avatar?.data?.attributes?.url)
        ? strapiImageUrl(article?.author?.avatar?.url || article.attributes?.author?.data?.attributes?.avatar?.data?.attributes?.url)
        : "/placeholder.jpg",
    }
  };

  const recommended = recommendedRaw.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.Title,
    category: "Interview",
    featuredImage: item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : "/placeholder.jpg",
    author: { name: item?.author?.name }
  }));

  // Raw date for JSON-LD (needs ISO-8601, not formatted display string)
  const rawDate = article.Date || article.attributes?.Date || article.publishedAt || article.createdAt || "";

  return (
    <>
      <ArticleJsonLd
        title={opinion.title}
        datePublished={rawDate}
        authorName={opinion.author?.name}
        slug={slug}
        imageUrl={opinion.featuredImage}
        section="interview"
        description={opinion.excerpt}
      />
      <OpinionContent opinion={opinion} recommended={recommended} />
    </>
  );
}
