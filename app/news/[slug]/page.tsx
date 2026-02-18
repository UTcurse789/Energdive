


import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import { notFound } from "next/navigation";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

const STRAPI_BASE_URL = "http://206.189.132.187:1337";

/* ================= FETCH ARTICLE ================= */

async function getArticle(slug: string) {
    const url = `${STRAPI_BASE_URL}/api/contents?filters[slug][$eq]=${slug}&populate=*`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.[0] || null;
}

/* ================= FETCH RELATED ================= */

async function getRelated(tags: string[], currentSlug: string) {
    if (!tags.length) return [];

    const tagFilters = tags
        .map((tag, i) => `filters[tags][slug][$in][${i}]=${tag}`)
        .join("&");

    const url = `${STRAPI_BASE_URL}/api/contents?${tagFilters}&filters[slug][$ne]=${currentSlug}&populate=FeaturedImage&pagination[limit]=4`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    return json.data || [];
}

/* ================= PAGE ================= */

export default async function ArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;


    const articleData = await getArticle(slug);
    if (!articleData) notFound();

    const attrs = articleData.attributes || articleData;

    const tagsData = attrs.tags?.data || attrs.tags || [];
    const tagSlugs = Array.isArray(tagsData)
        ? tagsData.map((t: any) => t.slug || t.attributes?.slug)
        : [];

    const relatedArticles = await getRelated(tagSlugs, slug);

    const author = attrs.author?.data?.attributes || attrs.author;

    const article = {
        title: attrs.Title,
        excerpt: attrs.Excerpt || [],
        content: attrs.Content || [],
        image: attrs.FeaturedImage?.url
            ? `${STRAPI_BASE_URL}${attrs.FeaturedImage.url}`
            : "/magazine-default.jpg",
        date: new Date(attrs.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }),
        author: author
            ? {
                name: author.name,
                avatar: author.avatar?.url
                    ? `${STRAPI_BASE_URL}${author.avatar.url}`
                    : null,
            }
            : null,
        tags: Array.isArray(tagsData)
            ? tagsData.map((t: any) => t.name || t.attributes?.name)
            : [],
        category:
            attrs.type_of_content?.name ||
            attrs.type_of_content?.data?.attributes?.name ||
            "News",
    };

    return (
        <div className="bg-white">
            <Header />

            <main className="pt-24 pb-24">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl">

                    {/* MAIN */}
                    <div className="lg:col-span-9">

                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                            <Link href="/">Home</Link> / <Link href="/news">News</Link> /{" "}
                            <span className="text-black">{article.category}</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif italic font-bold leading-[1.05] mb-6">
                            {article.title}
                        </h1>

                        <div className="text-xl text-gray-500 font-serif mb-8">
                            <BlocksRenderer content={article.excerpt} />
                        </div>

                        {article.author && (
                            <div className="flex items-center gap-4 mb-10">
                                {article.author.avatar && (
                                    <Image
                                        src={article.author.avatar}
                                        width={50}
                                        height={50}
                                        className="rounded-full"
                                        alt=""
                                    />
                                )}

                                <div>
                                    <p className="font-bold">{article.author.name}</p>
                                    <p className="text-sm text-gray-400">{article.date}</p>
                                </div>
                            </div>
                        )}

                        <div className="relative aspect-video mb-12">
                            <Image
                                src={article.image}
                                alt=""
                                fill
                                priority
                                className="object-cover"
                            />
                        </div>

                        <div className="prose max-w-none font-serif text-[18px] leading-[1.9]">
                            <BlocksRenderer content={article.content} />
                        </div>

                        {article.tags.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-gray-100">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-4">
                                    Tags
                                </h4>

                                <div className="flex flex-wrap gap-2">
                                    {article.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="bg-gray-100 px-3 py-1 text-xs uppercase tracking-widest text-gray-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR */}
                    <aside className="lg:col-span-3 space-y-12">

                        <div className="bg-black text-white p-8">
                            <h3 className="text-lg italic font-bold mb-4">
                                Daily Briefing
                            </h3>

                            <input
                                className="w-full bg-white/10 p-3 mb-4"
                                placeholder="Email"
                            />

                            <Button className="w-full bg-[#00A651]">
                                Subscribe
                            </Button>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                                Related
                            </h3>

                            <div className="space-y-8">
                                {relatedArticles.map((item: any) => {
                                    const r = item.attributes || item;
                                    const img = r.FeaturedImage?.url;

                                    return (
                                        <Link href={`/news/${r.slug}`} key={item.id}>
                                            <div>
                                                <div className="relative aspect-video mb-2">
                                                    <Image
                                                        src={
                                                            img
                                                                ? `${STRAPI_BASE_URL}${img}`
                                                                : "/magazine-default.jpg"
                                                        }
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                <h4 className="font-serif font-bold leading-tight">
                                                    {r.Title}
                                                </h4>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

