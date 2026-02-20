import React from "react";
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
    Quote
} from "lucide-react";
import { cn } from "@/lib/utils";

/* =========================
   TYPES & UTILS
========================= */

interface PageProps {
    params: Promise<{ slug: string }>;
}

/* ---------- Strapi inline text renderer ---------- */
function renderInlineChildren(children: any[]) {
    return children?.map((child: any, idx: number) => {
        let node: React.ReactNode = child.text;
        if (child.bold) node = <strong key={idx}>{node}</strong>;
        if (child.italic) node = <em key={idx}>{node}</em>;
        if (child.underline) node = <u key={idx}>{node}</u>;
        return node;
    });
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
        const reports = json?.data?.[0]?.contents || json?.data?.[0]?.attributes?.contents || [];

        return reports.find((r: any) => r.slug === slug) || null;
    } catch (e) {
        console.error("STRAPI ERROR:", e);
        return null;
    }
}

/* =========================
   BLOCK RENDERER
========================= */

function RenderBlocks({ blocks }: { blocks: any[] }) {
    if (!blocks) return null;

    return blocks.map((block: any, i: number) => {
        const text = block.children?.map((child: any) => child.text).join("") || "";
        if (!text.trim() && block.type !== "image") return null;

        switch (block.type) {
            case "heading":
                const level = block.level || 2;
                const Tag = (`h${level}` as any);
                return (
                    <Tag key={i} className="font-serif font-black text-zinc-900 mt-12 mb-6 leading-tight text-2xl md:text-4xl">
                        {renderInlineChildren(block.children)}
                    </Tag>
                );
            case "quote":
                return (
                    <blockquote key={i} className="my-16 not-prose">
                        <div className="bg-zinc-50 p-8 md:p-12 rounded-[2rem] relative overflow-hidden">
                            <Quote className="absolute -top-4 -left-4 w-20 h-20 text-zinc-200/50 z-0" />
                            <p className="text-2xl md:text-3xl font-black italic text-zinc-900 tracking-tight leading-snug relative z-10">
                                &ldquo;{renderInlineChildren(block.children)}&rdquo;
                            </p>
                        </div>
                    </blockquote>
                );
            case "paragraph":
            default:
                return (
                    <p key={i} className="font-serif text-lg md:text-xl leading-relaxed text-zinc-700 mb-8">
                        {renderInlineChildren(block.children)}
                    </p>
                );
        }
    });
}

/* =========================
   PAGE COMPONENT
========================= */

export default async function ArticlePage(props: PageProps) {
    const { slug } = await props.params;
    const article = await getReport(slug);

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Report not found</h1>
                    <Link href="/reports" className="text-[#00A651] underline">Back to Reports</Link>
                </div>
            </div>
        );
    }

    /* ---------- DATA MAPPING (Handling Case Sensitivity) ---------- */
    const title = article.Title || article.title;
    const date = article.Date || article.date;
    const contentBlocks = article.Content || article.content;

    // IMAGE LOGIC: Checks for FeaturedImage or featuredImage and handles Strapi's nested structure
    const rawImage = article.FeaturedImage || article.featuredImage;
    const imageUrl = rawImage?.url
        ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${rawImage.url}`
        : rawImage?.data?.attributes?.url
            ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${rawImage.data.attributes.url}`
            : null;

    const author = article.author;
    const authorBio = author?.bio?.[0]?.children?.[0]?.text || author?.bio || "";
    const authorAvatar = author?.avatar?.url
        ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${author.avatar.url}`
        : author?.avatar?.data?.attributes?.url
            ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${author.avatar.data.attributes.url}`
            : null;

    const downloadUrl = article.source || article.downloadUrl || "#";
    const excerpt = article.Excerpt?.[0]?.children?.[0]?.text || article.excerpt || "";

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900">
            <Header />

            <main className="pt-[80px] pb-32">
                <article className="container mx-auto px-6 lg:px-12 max-w-6xl">

                    {/* TOP NAVIGATION BAR */}
                    <div className="flex justify-between items-center mb-12 border-b border-zinc-100 pb-6">
                        <Link
                            href="/reports"
                            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-all"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Intelligence
                        </Link>

                        <div className="flex gap-4">
                            <button className="p-2 rounded-full border hover:bg-zinc-50 transition-colors">
                                <BookmarkPlus className="w-4 h-4 text-zinc-500" />
                            </button>
                            <button className="p-2 rounded-full border hover:bg-zinc-50 transition-colors">
                                <Share2 className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>
                    </div>

                    {/* HEADER SECTION */}
                    <header className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 border border-[#00A651] text-[#00A651] text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
                            {article.category || "HSE & Sustainability Analysis"}
                        </span>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic leading-[1.05] mb-10 tracking-tighter">
                            {title}
                        </h1>

                        <div className="flex justify-center flex-wrap gap-8 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#00A651]" />
                                {date}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#00A651]" />
                                8 min read
                            </span>
                            <span className="flex items-center gap-2 text-[#00A651]">
                                <ShieldCheck className="w-4 h-4" />
                                ENCIS Verified
                            </span>
                        </div>
                    </header>

                    {/* HERO IMAGE */}
                    {imageUrl && (
                        <div className="relative h-[400px] md:h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl mb-24 bg-zinc-100">
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 1200px) 100vw, 1200px"
                            />
                        </div>
                    )}

                    {/* CONTENT GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative">

                        {/* STICKY SIDEBAR */}
                        <aside className="lg:col-span-3 space-y-10 lg:sticky lg:top-32 h-fit">

                            {/* AUTHOR CARD */}
                            {author && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        Council Insights
                                    </h4>
                                    <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                                        <div className="flex gap-4 items-center mb-4">
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#00A651]/10 shrink-0">
                                                {authorAvatar ? (
                                                    <Image src={authorAvatar} alt={author.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full text-[#00A651] font-bold">
                                                        {author.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm leading-tight">{author.name}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase font-black">Editorial Author</div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-600 leading-relaxed font-serif italic">
                                            {authorBio}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* DOWNLOAD CARD */}
                            <div className="p-8 rounded-[2rem] bg-zinc-900 text-white shadow-xl">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00A651] mb-4">
                                    Official Publication
                                </h4>
                                <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
                                    Strategic insights and industry-leading recommendations for professionals.
                                </p>
                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="block">
                                    <Button className="w-full bg-[#00A651] hover:bg-[#008c44] text-white text-[10px] font-black uppercase py-7 rounded-2xl transition-all">
                                        Download PDF
                                        <Download className="w-4 h-4 ml-2" />
                                    </Button>
                                </a>
                            </div>
                        </aside>

                        {/* MAIN CONTENT AREA */}
                        <div className="lg:col-span-9">
                            <div className="max-w-3xl mx-auto lg:ml-0">

                                {/* EXCERPT / CORE MISSION */}
                                {excerpt && (
                                    <div className="mb-16 p-10 bg-white border-l-8 border-[#00A651] rounded-r-[2.5rem] shadow-sm">
                                        <div className="flex items-center gap-2 text-[#00A651] mb-6">
                                            <BarChart3 className="w-5 h-5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Core Mission</span>
                                        </div>
                                        <p className="text-2xl md:text-3xl font-serif italic text-zinc-800 leading-snug">
                                            &ldquo;{excerpt}&rdquo;
                                        </p>
                                    </div>
                                )}

                                {/* DYNAMIC BLOCKS */}
                                <div className="prose prose-xl prose-zinc max-w-none prose-p:font-serif prose-headings:font-black">
                                    <RenderBlocks blocks={contentBlocks} />
                                </div>
                            </div>
                        </div>

                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}