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


import { notFound } from "next/navigation";
import OpinionContent from "./opinion-content";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

async function getOpinion(slug: string) {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate=FeaturedImage`,
    { next: { revalidate: 3600 } }
  );
  const json = await res.json();
  return json?.data?.[0] ?? null;
}

async function getRecommended(currentSlug: string) {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[author][populate]=avatar&populate=FeaturedImage&pagination[limit]=3&sort=Date:desc`,
    { next: { revalidate: 3600 } }
  );
  const json = await res.json();
  return json?.data?.filter((item: any) => item.slug !== currentSlug) ?? [];
}

export default async function OpinionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getOpinion(slug);
  if (!article) notFound();

  const recommendedRaw = await getRecommended(slug);

  // page.tsx mein mapping thodi safe kar dete hain
  const opinion = {
    id: article.id,
    slug,
    // Agar Strapi v4 use kar rahe ho toh article.attributes.Title ho sakta hai
    title: article.Title || article.attributes?.Title,
    excerpt: article?.Excerpt?.[0]?.children?.[0]?.text || article.attributes?.Excerpt?.[0]?.children?.[0]?.text || "",
    content: article?.Content || article.attributes?.Content || [],
    category: "Opinion",
    readTime: "6 min read",
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

  const recommended = recommendedRaw.map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.Title,
    category: "Opinion",
    featuredImage: item?.FeaturedImage?.url ? strapiImageUrl(item.FeaturedImage.url) : "/placeholder.jpg",
    author: { name: item?.author?.name }
  }));

  return <OpinionContent opinion={opinion} recommended={recommended} />;
}