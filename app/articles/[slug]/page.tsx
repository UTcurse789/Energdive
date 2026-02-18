import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import { notFound } from "next/navigation";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

const STRAPI = "http://206.189.132.187:1337";

/* ================= FETCH ARTICLE ================= */

async function getArticle(slug: string) {

    const url =
        `${STRAPI}/api/contents?` +
        `filters[slug][$eq]=${slug}` +
        `&populate=*`;

    console.log("FETCH ARTICLE:", url);

    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    console.log("ARTICLE RESPONSE:", json);

    return json?.data?.[0] ?? null;
}

/* ================= FETCH RELATED ================= */

async function getRelated(slug: string) {

    const res = await fetch(
        `${STRAPI}/api/contents?filters[slug][$ne]=${slug}&pagination[limit]=3&populate=*`,
        { cache: "no-store" }
    );

    const json = await res.json();
    return json?.data || [];
}

/* ================= PAGE ================= */

export default async function ArticlePage(props: any) {

    const params = await props.params;
    const slug = params.slug;

    const articleData = await getArticle(slug);
    if (!articleData) notFound();

    const related = await getRelated(slug);

    const article = {
        title: articleData.Title,
        excerpt:
            articleData.Excerpt?.[0]?.children?.[0]?.text || "",
        content: articleData.Content || [],
        image: articleData.FeaturedImage?.url
            ? `${STRAPI}${articleData.FeaturedImage.url}`
            : "/magazine-default.jpg",
        date: articleData.publishedAt
            ? new Date(articleData.publishedAt).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "short", year: "numeric" }
            )
            : "",
        author: articleData.author
            ? {
                name: articleData.author.name,
                avatar: articleData.author.avatar?.url || null,
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

                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                            <Link href="/">Home</Link> / Articles
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif italic font-bold mb-6">
                            {article.title}
                        </h1>

                        <p className="text-xl text-gray-500 font-serif mb-8">
                            {article.excerpt}
                        </p>

                        {article.author && (
                            <div className="flex items-center gap-4 mb-10">
                                {article.author.avatar && (
                                    <Image
                                        src={`${STRAPI}${article.author.avatar}`}
                                        width={48}
                                        height={48}
                                        alt=""
                                        className="rounded-full"
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
                                className="object-cover rounded-lg"
                            />
                        </div>

                        <div className="prose max-w-none font-serif text-[18px] leading-[1.9]">
                            <BlocksRenderer content={article.content} />
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <aside className="lg:col-span-3 space-y-10">

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
                                Related Stories
                            </h3>

                            <div className="space-y-6">
                                {related.map((item: any) => (
                                    <Link key={item.id} href={`/articles/${item.slug}`}>
                                        <div className="relative aspect-video mb-2 rounded overflow-hidden">
                                            <Image
                                                src={
                                                    item.FeaturedImage?.url
                                                        ? `${STRAPI}${item.FeaturedImage.url}`
                                                        : "/magazine-default.jpg"
                                                }
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        <h4 className="font-serif font-bold">
                                            {item.Title}
                                        </h4>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </aside>
                </div>
            </main>
        </div>
    );
}
