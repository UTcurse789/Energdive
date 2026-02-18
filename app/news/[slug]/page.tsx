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
    const url = `${STRAPI_BASE_URL}/api/contents?filters[slug][$eq]=${slug}&populate[author][populate]=avatar&populate[featuredImage]=*&populate[type_of_content]=*&populate[Content]=*`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.[0];
}

/* ================= FETCH RELATED ================= */

async function getRelated(slug: string) {
    const res = await fetch(
        `${STRAPI_BASE_URL}/api/contents?filters[slug][$ne]=${slug}&pagination[limit]=4&populate[featuredImage]=*`,
        { cache: "no-store" }
    );

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

    const relatedRaw = await getRelated(slug);

    const attrs = articleData.attributes || articleData;
    const authorData = attrs.author?.data?.attributes;

    const article = {
        title: attrs.TITLE || attrs.Title,
        excerpt: attrs.description || "",
        content: attrs.Content || [],
        category:
            attrs.type_of_content?.data?.attributes?.name ||
            attrs.type_of_content?.name ||
            "News",
        image: attrs.featuredImage?.data?.attributes?.url
            ? `${STRAPI_BASE_URL}${attrs.featuredImage.data.attributes.url}`
            : "/magazine-default.jpg",
        date: attrs.publishedAt
            ? new Date(attrs.publishedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "",
        author: authorData
            ? {
                name: authorData.name,
                avatar: authorData.avatar?.data?.attributes?.url,
            }
            : null,
    };

    return (
        <div className="bg-white">
            <Header />

            <main className="pt-24 pb-24">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl">

                    {/* MAIN */}
                    <div className="lg:col-span-9">

                        {/* Breadcrumb */}
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                            <Link href="/">Home</Link> / <Link href="/news">News</Link> /{" "}
                            <span className="text-black">{article.category}</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-7xl font-serif italic font-bold leading-[1.05] mb-6">
                            {article.title}
                        </h1>

                        {/* Excerpt */}
                        <p className="text-xl text-gray-500 font-serif mb-8">
                            {article.excerpt}
                        </p>

                        {/* Author */}
                        {article.author && (
                            <div className="flex items-center gap-4 mb-10">

                                {article.author.avatar && (
                                    <Image
                                        src={`${STRAPI_BASE_URL}${article.author.avatar}`}
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

                        {/* Hero */}
                        <div className="relative aspect-video mb-12">
                            <Image
                                src={article.image}
                                alt=""
                                fill
                                priority
                                className="object-cover"
                            />
                        </div>

                        {/* Body */}
                        <div className="prose max-w-none font-serif text-[18px] leading-[1.9]">
                            <BlocksRenderer content={article.content} />
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <aside className="lg:col-span-3 space-y-12">

                        {/* Newsletter */}
                        <div className="bg-black text-white p-8">
                            <h3 className="text-lg italic font-bold mb-4">
                                Daily Briefing
                            </h3>
                            <input className="w-full bg-white/10 p-3 mb-4" placeholder="Email" />
                            <Button className="w-full bg-[#00A651]">Subscribe</Button>
                        </div>

                        {/* Related */}
                        <div>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                                Related
                            </h3>

                            <div className="space-y-8">

                                {relatedRaw.map((item: any) => {
                                    const r = item.attributes || item;
                                    const img =
                                        r.featuredImage?.data?.attributes?.url;

                                    return (
                                        <Link href={`/news/${r.slug}`} key={item.id}>
                                            <div>
                                                <div className="relative aspect-video mb-2">
                                                    <Image
                                                        src={img ? `${STRAPI_BASE_URL}${img}` : "/magazine-default.jpg"}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>

                                                <h4 className="font-serif font-bold leading-tight">
                                                    {r.TITLE || r.Title}
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

            <Footer />
        </div>
    );
}
