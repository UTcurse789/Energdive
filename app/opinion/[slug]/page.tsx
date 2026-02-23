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
//         ? `${STRAPI}${article.FeaturedImage.url}`
//         : article?.FeaturedImage?.data?.attributes?.url
//           ? `${STRAPI}${article.FeaturedImage.data.attributes.url}`
//           : "/placeholder.jpg",
//     image:
//       article?.FeaturedImage?.url
//         ? `${STRAPI}${article.FeaturedImage.url}`
//         : "/placeholder.jpg",
//     readTime: "5 min read",
//     author: {
//       name: article?.author?.name,
//       role: article?.author?.designation || "Author",
//       avatar:
//         article?.author?.avatar?.url
//           ? `${STRAPI}${article.author.avatar.url}`
//           : "/placeholder.jpg",
//       image:
//         article?.author?.avatar?.url
//           ? `${STRAPI}${article.author.avatar.url}`
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
//         ? `${STRAPI}${item.FeaturedImage.url}`
//         : item?.FeaturedImage?.data?.attributes?.url
//           ? `${STRAPI}${item.FeaturedImage.data.attributes.url}`
//           : "/placeholder.jpg",
//     image: item?.FeaturedImage?.url ? `${STRAPI}${item.FeaturedImage.url}` : "/placeholder.jpg",
//     readTime: "5 min read",
//     author: {
//       name: item?.author?.name,
//       avatar:
//         item?.author?.avatar?.url
//           ? `${STRAPI}${item.author.avatar.url}`
//           : "/placeholder.jpg",
//       image:
//         item?.author?.avatar?.url
//           ? `${STRAPI}${item.author.avatar.url}`
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
import { OpinionContent } from "./opinion-content";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

async function getOpinion(slug: string) {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate=FeaturedImage`,
    { next: { revalidate: 60 } }
  );
  const json = await res.json();
  return json?.data?.[0] ?? null;
}

async function getRecommended(currentSlug: string) {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[author][populate]=avatar&populate=FeaturedImage&pagination[limit]=3`,
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

  const opinion = {
    id: article.id,
    title: article.Title,
    excerpt: article?.Excerpt?.[0]?.children?.[0]?.text || "",
    content: article?.Content || [],
    category: "Strategic Opinion",
    readTime: "6 min read",
    featuredImage: article?.FeaturedImage?.url ? `${STRAPI}${article.FeaturedImage.url}` : "/placeholder.jpg",
    author: {
      name: article?.author?.name || "Editorial Staff",
      role: article?.author?.designation || "Senior Analyst",
      avatar: article?.author?.avatar?.url ? `${STRAPI}${article.author.avatar.url}` : "/placeholder.jpg",
    }
  };

  const recommended = recommendedRaw.map((item: any) => ({
    id: item.id,
    slug: item.slug,
    title: item.Title,
    category: "Insight",
    featuredImage: item?.FeaturedImage?.url ? `${STRAPI}${item.FeaturedImage.url}` : "/placeholder.jpg",
    author: { name: item?.author?.name }
  }));

  return <OpinionContent opinion={opinion} recommended={recommended} />;
}