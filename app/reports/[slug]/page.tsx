import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import {
    Download,
    ChevronLeft,
    Calendar,
    Clock,
    Share2,
    BarChart3,
    ShieldCheck,
    BookmarkPlus,
} from "lucide-react";

function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/* =========================
   TYPES
========================= */

interface PageProps {
    params: Promise<{ slug: string }>;
}

/* =========================
   FETCH REPORT FROM STRAPI
========================= */

async function getReport(slug: string) {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/type-of-contents?filters[slug][$eq]=reports&populate[contents][populate]=*`,
            {
                cache: "no-store",
                headers: {
                    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
                },
            }
        );

        const json = await res.json();

        const reports =
            json?.data?.[0]?.contents ||
            json?.data?.[0]?.attributes?.contents ||
            [];

        return reports.find((r: any) => r.slug === slug) || null;
    } catch (e) {
        console.error("STRAPI ERROR:", e);
        return null;
    }
}

/* =========================
   BLOCK RENDERER
========================= */

function RenderBlocks({ blocks }: any) {
    if (!blocks) return null;

    return blocks.map((block: any, i: number) => {
        if (block.type === "paragraph") {
            return (
                <p key={i}>
                    {block.children?.map((c: any) => c.text).join("")}
                </p>
            );
        }

        if (block.type === "heading") {
            const Tag = (`h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') || 'h3';

            return (
                <Tag key={i}>
                    {block.children?.map((c: any) => c.text).join("")}
                </Tag>
            );
        }

        return null;
    });
}

/* =========================
   PAGE
========================= */

export default async function ArticlePage(props: PageProps) {
    const { slug } = await props.params;
    const article = await getReport(slug);

    if (!article) {
        return <div className="p-20 text-center">Report not found</div>;
    }

    /* ---------- IMAGE ---------- */

    const imageUrl =
        article?.FeaturedImage?.url
            ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${article.FeaturedImage.url}`
            : article?.FeaturedImage?.data?.attributes?.url
                ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${article.FeaturedImage.data.attributes.url}`
                : null;

    /* ---------- AUTHOR ---------- */

    const author = article?.author;

    const authorBio =
        author?.bio?.[0]?.children?.[0]?.text || "";

    /* ✅ AUTHOR AVATAR (AUTO FROM STRAPI) */
    const authorAvatar =
        author?.avatar?.url
            ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${author.avatar.url}`
            : author?.avatar?.data?.attributes?.url
                ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${author.avatar.data.attributes.url}`
                : null;

    /* ---------- DOWNLOAD URL (SOURCE FIELD) ---------- */
    const downloadUrl = article?.source || "#";

    /* ---------- EXCERPT ---------- */

    const excerpt =
        article?.Excerpt?.[0]?.children?.[0]?.text || "";

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">

            <Header />

            <main className="pt-[40px] sm:pt-[60px] pb-16 sm:pb-32">
                <article className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl">

                    {/* TOP BAR */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8">
                        <Link
                            href="/reports"
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651]"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Intelligence
                        </Link>

                        <div className="flex gap-4">
                            <button className="p-2 rounded-full border">
                                <BookmarkPlus className="w-4 h-4 text-zinc-500" />
                            </button>
                            <button className="p-2 rounded-full border">
                                <Share2 className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>
                    </div>

                    {/* HEADER */}
                    <header className="text-center mb-10 sm:mb-16">
                        <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 border border-[#00A651] text-[#00A651] text-[9px] sm:text-[10px] font-black uppercase rounded-full mb-4 sm:mb-6">
                            HSE & Sustainability Analysis
                        </span>

                        <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase italic leading-[1.05] mb-6 sm:mb-10 px-2 sm:px-0">
                            {article.Title}
                        </h1>

                        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase">
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A651]" />
                                {article.Date}
                            </span>

                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A651]" />
                                8 min read
                            </span>

                            <span className="flex items-center gap-1.5 sm:gap-2 text-[#00A651]">
                                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                ENCIS Verified
                            </span>
                        </div>
                    </header>

                    {/* HERO IMAGE */}
                    {imageUrl && (
                        <div className="relative h-[250px] sm:h-[400px] md:h-[600px] w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl mb-12 sm:mb-24">
                            <Image
                                src={imageUrl}
                                alt={article.Title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    {/* CONTENT GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16">

                        {/* SIDEBAR */}
                        <aside className="lg:col-span-3 space-y-8 sm:space-y-10 order-2 lg:order-1">



                            {/* DOWNLOAD CARD */}
                            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900 text-white">
                                <h4 className="text-[10px] font-black uppercase text-[#00A651] mb-4">
                                    Official Publication
                                </h4>

                                <p className="text-xs text-zinc-400 mb-6">
                                    Recommendations and strategic insights from industry leaders.
                                </p>

                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                    <Button className="w-full bg-[#00A651] text-xs font-black uppercase py-6">
                                        Download Report
                                        <Download className="w-4 h-4 ml-2" />
                                    </Button>
                                </a>
                            </div>

                        </aside>

                        {/* MAIN CONTENT */}
                        <div className="lg:col-span-9 order-1 lg:order-2">
                            <div className="max-w-3xl">

                                {excerpt && (
                                    <div className="mb-10 sm:mb-16 p-5 sm:p-10 bg-white border-l-4 border-[#00A651] rounded-r-xl sm:rounded-r-3xl">
                                        <div className="flex items-center gap-2 text-[#00A651] mb-4">
                                            <BarChart3 className="w-5 h-5" />
                                            <span className="text-xs font-black uppercase">
                                                Core Mission
                                            </span>
                                        </div>

                                        <p className="text-lg sm:text-2xl font-serif italic text-zinc-700">
                                            {excerpt}
                                        </p>
                                    </div>
                                )}

                                <div className="prose prose-xl max-w-none">
                                    <RenderBlocks blocks={article.Content} />
                                </div>

                            </div>
                        </div>

                    </div>
                </article>
            </main>
        </div>
    );
}