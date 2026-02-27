// import Link from "next/link";
// import Image from "next/image";
// import { Header } from "@/components/layout/header";
// import { Footer } from "@/components/layout/footer";
// import { Button } from "@/components/ui/buttons";
// import {
//     Download,
//     ChevronLeft,
//     Calendar,
//     Clock,
//     Share2,
//     BarChart3,
//     ShieldCheck,
//     BookmarkPlus,
// } from "lucide-react";

// function slugify(text: string): string {
//     return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
// }

// /* =========================
//    TYPES
// ========================= */

// interface PageProps {
//     params: Promise<{ slug: string }>;
// }

// /* =========================
//    FETCH REPORT FROM STRAPI
// ========================= */

// async function getReport(slug: string) {
//     try {
//         const res = await fetch(
//             `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/type-of-contents?filters[slug][$eq]=reports&populate[contents][populate]=*`,
//             {
//                 cache: "no-store",
//                 headers: {
//                     Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
//                 },
//             }
//         );

//         const json = await res.json();

//         const reports =
//             json?.data?.[0]?.contents ||
//             json?.data?.[0]?.attributes?.contents ||
//             [];

//         return reports.find((r: any) => r.slug === slug) || null;
//     } catch (e) {
//         console.error("STRAPI ERROR:", e);
//         return null;
//     }
// }

// /* =========================
//    BLOCK RENDERER
// ========================= */

// function RenderBlocks({ blocks }: any) {
//     if (!blocks) return null;

//     return blocks.map((block: any, i: number) => {
//         if (block.type === "paragraph") {
//             return (
//                 <p key={i}>
//                     {block.children?.map((c: any) => c.text).join("")}
//                 </p>
//             );
//         }

//         if (block.type === "heading") {
//             const Tag = (`h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') || 'h3';

//             return (
//                 <Tag key={i}>
//                     {block.children?.map((c: any) => c.text).join("")}
//                 </Tag>
//             );
//         }

//         return null;
//     });
// }

// /* =========================
//    PAGE
// ========================= */

// export default async function ArticlePage(props: PageProps) {
//     const { slug } = await props.params;
//     const article = await getReport(slug);

//     if (!article) {
//         return <div className="p-20 text-center">Report not found</div>;
//     }

//     /* ---------- IMAGE ---------- */

//     const imageUrl =
//         article?.FeaturedImage?.url
//             ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${article.FeaturedImage.url}`
//             : article?.FeaturedImage?.data?.attributes?.url
//                 ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${article.FeaturedImage.data.attributes.url}`
//                 : null;

//     /* ---------- AUTHOR ---------- */

//     const author = article?.author;

//     const authorBio =
//         author?.bio?.[0]?.children?.[0]?.text || "";

//     /* ✅ AUTHOR AVATAR (AUTO FROM STRAPI) */
//     const authorAvatar =
//         author?.avatar?.url
//             ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${author.avatar.url}`
//             : author?.avatar?.data?.attributes?.url
//                 ? `${process.env.NEXT_PUBLIC_STRAPI_URL}${author.avatar.data.attributes.url}`
//                 : null;

//     /* ---------- DOWNLOAD URL (SOURCE FIELD) ---------- */
//     const downloadUrl = article?.source || "#";

//     /* ---------- EXCERPT ---------- */

//     const excerpt =
//         article?.Excerpt?.[0]?.children?.[0]?.text || "";

//     return (
//         <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">

//             <Header />

//             <main className="pt-[40px] sm:pt-[60px] pb-16 sm:pb-32">
//                 <article className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl">

//                     {/* TOP BAR */}
//                     <div className="flex flex-wrap justify-between items-center gap-4 mb-6 sm:mb-8">
//                         <Link
//                             href="/reports"
//                             className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651]"
//                         >
//                             <ChevronLeft className="w-4 h-4" />
//                             Back to Intelligence
//                         </Link>

//                         <div className="flex gap-4">
//                             <button className="p-2 rounded-full border">
//                                 <BookmarkPlus className="w-4 h-4 text-zinc-500" />
//                             </button>
//                             <button className="p-2 rounded-full border">
//                                 <Share2 className="w-4 h-4 text-zinc-500" />
//                             </button>
//                         </div>
//                     </div>

//                     {/* HEADER */}
//                     <header className="text-center mb-10 sm:mb-16">
//                         <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 border border-[#00A651] text-[#00A651] text-[9px] sm:text-[10px] font-black uppercase rounded-full mb-4 sm:mb-6">
//                             HSE & Sustainability Analysis
//                         </span>

//                         <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase italic leading-[1.05] mb-6 sm:mb-10 px-2 sm:px-0">
//                             {article.Title}
//                         </h1>

//                         <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase">
//                             <span className="flex items-center gap-1.5 sm:gap-2">
//                                 <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A651]" />
//                                 {article.Date}
//                             </span>

//                             <span className="flex items-center gap-1.5 sm:gap-2">
//                                 <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A651]" />
//                                 8 min read
//                             </span>

//                             <span className="flex items-center gap-1.5 sm:gap-2 text-[#00A651]">
//                                 <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//                                 ENCIS Verified
//                             </span>
//                         </div>
//                     </header>

//                     {/* HERO IMAGE */}
//                     {imageUrl && (
//                         <div className="relative h-[250px] sm:h-[400px] md:h-[600px] w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl mb-12 sm:mb-24">
//                             <Image
//                                 src={imageUrl}
//                                 alt={article.Title}
//                                 fill
//                                 className="object-cover"
//                                 priority
//                             />
//                         </div>
//                     )}

//                     {/* CONTENT GRID */}
//                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16">

//                         {/* SIDEBAR */}
//                         <aside className="lg:col-span-3 space-y-8 sm:space-y-10 order-2 lg:order-1">



//                             {/* DOWNLOAD CARD */}
//                             <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-900 text-white">
//                                 <h4 className="text-[10px] font-black uppercase text-[#00A651] mb-4">
//                                     Official Publication
//                                 </h4>

//                                 <p className="text-xs text-zinc-400 mb-6">
//                                     Recommendations and strategic insights from industry leaders.
//                                 </p>

//                                 <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
//                                     <Button className="w-full bg-[#00A651] text-xs font-black uppercase py-6">
//                                         Download Report
//                                         <Download className="w-4 h-4 ml-2" />
//                                     </Button>
//                                 </a>
//                             </div>

//                         </aside>

//                         {/* MAIN CONTENT */}
//                         <div className="lg:col-span-9 order-1 lg:order-2">
//                             <div className="max-w-3xl">

//                                 {excerpt && (
//                                     <div className="mb-10 sm:mb-16 p-5 sm:p-10 bg-white border-l-4 border-[#00A651] rounded-r-xl sm:rounded-r-3xl">
//                                         <div className="flex items-center gap-2 text-[#00A651] mb-4">
//                                             <BarChart3 className="w-5 h-5" />
//                                             <span className="text-xs font-black uppercase">
//                                                 Core Mission
//                                             </span>
//                                         </div>

//                                         <p className="text-lg sm:text-2xl font-serif italic text-zinc-700">
//                                             {excerpt}
//                                         </p>
//                                     </div>
//                                 )}

//                                 <div className="prose prose-xl max-w-none">
//                                     <RenderBlocks blocks={article.Content} />
//                                 </div>

//                             </div>
//                         </div>

//                     </div>
//                 </article>
//             </main>
//         </div>
//     );
// }
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { DateChip } from "@/components/ui/date-chip";
import {
    Download,
    ChevronLeft,
    Calendar,
    ShieldCheck,
    BookmarkPlus,
    Share2,
    ArrowUpRight,
    FileText,
    TrendingUp,
    Clock,
    Quote
} from "lucide-react";
import { formatContentDate } from "@/lib/date";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

/* ==========================================================
   DATA FETCHING
   ========================================================== */

async function getReport(slug: string) {
    try {
        const res = await fetch(
            `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&filters[type_of_content][name][$eq]=Reports&populate=*`,
            { next: { revalidate: 120 } }
        );
        const json = await res.json();
        return json?.data?.[0] ?? null;
    } catch (e) {
        console.error("Strapi Fetch Error:", e);
        return null;
    }
}

async function getTrending() {
    try {
        const res = await fetch(
            `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Reports&pagination[limit]=3&populate=*`,
            { next: { revalidate: 120 } }
        );
        const json = await res.json();
        return json?.data ?? [];
    } catch (e) {
        return [];
    }
}

/* ==========================================================
   CONTENT RENDERERS
   ========================================================== */

function renderInlineChildren(children: any[]) {
    return children?.map((child: any, idx: number) => {
        let node: React.ReactNode = child.text;
        if (child.bold) node = <strong key={idx} className="font-black text-zinc-900">{node}</strong>;
        if (child.italic) node = <em key={idx} className="italic text-zinc-400">{node}</em>;
        return node;
    });
}

function RenderBlocks({ blocks }: { blocks: any[] }) {
    if (!blocks) return null;
    return blocks.map((block: any, i: number) => {
        switch (block.type) {
            case "heading":
                const Tag = (`h${block.level || 2}` as any);
                return (
                    <Tag key={i} className="font-serif font-bold tracking-tight text-zinc-900 mt-14 mb-5 leading-tight text-2xl md:text-3xl">
                        {renderInlineChildren(block.children)}
                    </Tag>
                );
            case "quote":
                return (
                    <div key={i} className="my-16 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00A651] to-emerald-300 rounded-full" />
                        <div className="pl-10 py-6">
                            <Quote className="w-8 h-8 text-[#00A651]/30 mb-4" />
                            <p className="text-2xl md:text-3xl font-serif italic text-zinc-700 leading-snug">
                                {renderInlineChildren(block.children)}
                            </p>
                        </div>
                    </div>
                );
            default:
                return (
                    <p key={i} className="font-serif text-lg leading-[1.9] text-zinc-600 mb-8">
                        {renderInlineChildren(block.children)}
                    </p>
                );
        }
    });
}

/* ==========================================================
   PAGE COMPONENT
   ========================================================== */

export default async function IntelligenceReportPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getReport(slug);
    const trending = await getTrending();

    if (!article) notFound();

    const imageUrl = article.FeaturedImage?.url ? `${STRAPI}${article.FeaturedImage.url}` : null;
    const downloadUrl = article.source || "#";
    const excerpt = article.Excerpt?.[0]?.children?.[0]?.text || "";

    return (
        <div className="min-h-screen  font-sans text-zinc-900">
            <ScrollProgress />
            <Header />

            <main className="pt-24 pb-32">
                <div className="container mx-auto px-6 max-w-[1440px]">

                    {/* ── BREADCRUMB ── */}
                    <div className="mb-10 pb-6 border-b border-zinc-200">
                        <Link
                            href="/reports"
                            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-colors duration-200"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                            Report
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                        {/* ════════════════════════════════════════
                            LEFT COLUMN — DOWNLOAD + ACTIONS
                        ════════════════════════════════════════ */}
                        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-4 sticky top-28">

                            {/* Download Card */}
                            <div className="relative bg-zinc-950 rounded-3xl overflow-hidden border border-white/5">
                                {/* Green top bar */}
                                <div className="h-[3px] w-full bg-gradient-to-r from-[#00A651] via-emerald-300 to-[#00A651]" />

                                {/* <div className="absolute inset-0 bg-linear-to-r from-white via-white/50 to-transparent pointer-events-none" /> */}
                                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                                <div className="relative z-10 p-7">
                                    {/* Live badge */}
                                    <div className="inline-flex items-center gap-2 bg-[#00A651]/10 border border-[#00A651]/25 rounded-full px-3.5 py-1.5 mb-7">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#00A651]">
                                             Publication
                                        </span>
                                    </div>

                                    {/* Icon box */}
                                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-[#00A651]" />
                                    </div>

                                    
                                    <h4 className="text-white font-black text-base leading-snug mb-3 mt-4">
                                        Access the Full Report
                                    </h4>
                                    <p className="text-[11px] text-zinc-500 font-serif italic leading-relaxed mb-8">
                                        Download the comprehensive analysis trusted by policymakers, industry leaders, and investors.
                                    </p>

                                    {/* Download button */}
                                    <a href={downloadUrl} target="_blank" rel="noreferrer" className="block mb-3">
                                        <button className="w-full group bg-[#00A651] hover:bg-white rounded-2xl py-4 transition-all duration-300">
                                            <span className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white group-hover:text-zinc-900 transition-colors duration-300">
                                                <Download className="w-3.5 h-3.5" />
                                                Download Report
                                            </span>
                                        </button>
                                    </a>
                                    
                                </div>
                            </div>

                            {/* Actions card */}
                            {/* <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
                                {[
                                    { icon: BookmarkPlus, label: "Save Report" },
                                    { icon: Share2, label: "Share Intel" },
                                ].map(({ icon: Icon, label }, idx) => (
                                    <button
                                        key={label}
                                        className={`w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#00A651] hover:bg-zinc-50 transition-all duration-200 group ${idx === 0 ? "border-b border-zinc-100" : ""}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-zinc-100 group-hover:bg-[#00A651]/10 flex items-center justify-center transition-colors duration-200">
                                                <Icon size={13} className="group-hover:text-[#00A651] transition-colors duration-200" />
                                            </span>
                                            {label}
                                        </span>
                                        <span className="text-zinc-300 group-hover:text-[#00A651] group-hover:translate-x-0.5 transition-all duration-200">→</span>
                                    </button>
                                ))}
                            </div> */}

                            {/* Meta card */}
                            <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-4">Report Details</p>
                                <DateChip value={formatContentDate(article.Date || article.publishedAt || article.createdAt)} />
                                <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-500">
                                    <Clock size={13} className="text-[#00A651]" />
                                    12 min read
                                </div>
                                
                            </div>

                        </aside>

                        {/* ════════════════════════════════════════
                            CENTER COLUMN — ARTICLE BODY
                        ════════════════════════════════════════ */}
                        <article className="lg:col-span-6">

                            {/* Title block */}
                            <header className="mb-14">
                                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-10 text-zinc-900">
                                    {article.Title}
                                </h1>

                                {/* Mobile meta */}
                                <div className="flex flex-wrap gap-5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400 border-t border-zinc-200 pt-7 lg:hidden">
                                    <DateChip value={formatContentDate(article.Date || article.publishedAt || article.createdAt)} className="text-[10px]" />
                                    <span className="flex items-center gap-2">
                                        <Clock size={11} className="text-[#00A651]" />
                                        12 min read
                                    </span>
                                </div>
                            </header>

                            {/* Featured image */}
                            {imageUrl && (
                                <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden shadow-xl mb-16 bg-zinc-100">
                                    <Image src={imageUrl} alt="Report Cover" fill className="object-cover" priority />
                                    <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-transparent" />
                                </div>
                            )}

                            {/* Excerpt callout */}
                            {excerpt && (
                                <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 md:p-10 mb-10">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00A651] via-emerald-300 to-transparent" />
                                    
                                    <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#00A651]/10 rounded-full blur-3xl pointer-events-none" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#00A651] mb-4 relative z-10">
                                        Core Mission
                                    </p>
                                    <p className="text-xl md:text-2xl font-serif italic text-white leading-snug relative z-10">
                                        &ldquo;{excerpt}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Body content */}
                                <div className="mb-20">
                                    <div className="prose prose-lg max-w-none

                                                /* Base Typography */
                                                font-serif text-gray-800 leading-relaxed

                                                /* Headings - Clean & Minimal */
                                                prose-headings:font-sans
                                                prose-headings:font-bold
                                                prose-headings:text-gray-900
                                                prose-headings:tracking-tight

                                                /* H1 */
                                                prose-h1:text-4xl
                                                prose-h1:mt-12
                                                prose-h1:mb-6

                                                /* H2 */
                                                prose-h2:text-3xl
                                                prose-h2:mt-10
                                                prose-h2:mb-5

                                                /* H3 */
                                                prose-h3:text-2xl
                                                prose-h3:mt-8
                                                prose-h3:mb-4

                                                /* H4 */
                                                prose-h4:text-xl
                                                prose-h4:mt-6
                                                prose-h4:mb-3

                                                /* Paragraphs */
                                                prose-p:text-lg
                                                prose-p:leading-[1.9]
                                                prose-p:mb-6
                                                prose-p:text-gray-700

                                                /* Links */
                                                prose-a:text-teal-600
                                                prose-a:font-medium
                                                prose-a:no-underline
                                                prose-a:border-b
                                                prose-a:border-teal-300
                                                hover:prose-a:text-teal-800
                                                hover:prose-a:border-teal-600
                                                prose-a:transition-colors

                                                /* Strong/Bold */
                                                prose-strong:text-gray-900
                                                prose-strong:font-bold

                                                /* Blockquotes */
                                                prose-blockquote:border-l-4
                                                prose-blockquote:border-teal-500
                                                prose-blockquote:bg-teal-50/40
                                                prose-blockquote:py-4
                                                prose-blockquote:px-6
                                                prose-blockquote:my-8
                                                prose-blockquote:rounded-r-lg
                                                prose-blockquote:italic
                                                prose-blockquote:text-gray-700

                                                /* Lists */
                                                prose-ul:my-6
                                                prose-ul:space-y-2
                                                prose-ul:pl-6

                                                prose-ol:my-6
                                                prose-ol:space-y-2
                                                prose-ol:pl-6

                                                prose-li:text-lg
                                                prose-li:leading-relaxed
                                                prose-li:text-gray-700

                                                prose-li:marker:text-teal-600
                                                prose-li:marker:font-bold

                                                /* Images */
                                                prose-img:rounded-xl
                                                prose-img:shadow-lg
                                                prose-img:my-12
                                                prose-img:border
                                                prose-img:border-gray-200

                                                /* Captions */
                                                prose-figcaption:text-center
                                                prose-figcaption:text-sm
                                                prose-figcaption:text-gray-500
                                                prose-figcaption:mt-4
                                                prose-figcaption:italic
                                                prose-figcaption:font-sans

                                                /* Tables */
                                                prose-table:my-8
                                                prose-table:border-collapse
                                                prose-table:w-full
                                                prose-table:shadow-md
                                                prose-table:rounded-lg
                                                prose-table:overflow-hidden

                                                prose-thead:bg-teal-600
                                                prose-thead:text-white

                                                prose-th:py-3
                                                prose-th:px-4
                                                prose-th:text-left
                                                prose-th:font-semibold
                                                prose-th:text-sm
                                                prose-th:uppercase
                                                prose-th:tracking-wide

                                                prose-td:py-3
                                                prose-td:px-4
                                                prose-td:border-b
                                                prose-td:border-gray-200

                                                prose-tr:even:bg-gray-50
                                                hover:prose-tr:bg-teal-50/30
                                                prose-tr:transition-colors

                                                /* Inline Code */
                                                prose-code:bg-gray-100
                                                prose-code:text-teal-700
                                                prose-code:px-2
                                                prose-code:py-0.5
                                                prose-code:rounded
                                                prose-code:text-sm
                                                prose-code:font-mono
                                                prose-code:before:content-none
                                                prose-code:after:content-none

                                                /* Code Blocks */
                                                prose-pre:bg-gray-900
                                                prose-pre:text-gray-100
                                                prose-pre:rounded-lg
                                                prose-pre:p-6
                                                prose-pre:my-8
                                                prose-pre:shadow-lg
                                                prose-pre:overflow-x-auto

                                                /* Horizontal Rule */
                                                prose-hr:my-12
                                                prose-hr:border-gray-300
                                                "
                                            >
                                                <RenderBlocks blocks={article.Content} />
                                            </div>
                                            </div>

                            {/* Bottom CTA */}
                            {/* <div className="border-t border-zinc-200 pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Full Document</p>
                                    <p className="text-sm font-bold text-zinc-700">Download the complete whitepaper</p>
                                </div>
                                <a href={downloadUrl} target="_blank" rel="noreferrer">
                                    <button className="group inline-flex items-center gap-2 bg-zinc-950 hover:bg-[#00A651] text-white rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all duration-300">
                                        <Download className="w-3.5 h-3.5" />
                                        Download PDF
                                    </button>
                                </a>
                            </div> */}

                        </article>

                        {/* ════════════════════════════════════════
                            RIGHT COLUMN — DISCOVERY RAIL
                        ════════════════════════════════════════ */}
                        <aside className="lg:col-span-3 flex flex-col gap-5 lg:sticky lg:top-28">

                            {/* Top Priority card */}
                            {trending[0] && (
                                <div className="rounded-3xl overflow-hidden border border-zinc-100 bg-white shadow-sm group">
                                    {/* Image */}
                                    <div className="relative aspect-16/10 w-full bg-zinc-100 overflow-hidden">
                                        {trending[0].FeaturedImage?.url && (
                                            <Image
                                                src={`${STRAPI}${trending[0].FeaturedImage.url}`}
                                                fill
                                                alt={trending[0].Title}
                                                className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                                            />
                                        )}
                                        {/* Label pill */}
                                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-sm rounded-full px-3 py-1.5">
                                            <TrendingUp size={9} className="text-[#00A651]" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white">Top Priority</span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#00A651] mb-2">Report</p>
                                        <h5 className="font-black text-sm leading-snug text-zinc-900 mb-5 group-hover:text-[#00A651] transition-colors duration-200 line-clamp-3">
                                            {trending[0].Title}
                                        </h5>
                                        <Link
                                            href={`/reports/${trending[0].slug}`}
                                            className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-[#00A651] text-white rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                                        >
                                            Open Report <ArrowUpRight size={11} />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Related Briefings */}
                            {trending.slice(1).length > 0 && (
                                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-zinc-100">
                                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400 flex items-center gap-2">
                                            <span className="w-3 h-px bg-zinc-300 inline-block" />
                                            Related Reports
                                        </p>
                                    </div>

                                    {trending.slice(1).map((item: any, idx: number) => (
                                        <Link
                                            key={item.id}
                                            href={`/reports/${item.slug}`}
                                            className={`group flex items-start gap-4 p-5 hover:bg-zinc-50 transition-all duration-200 ${idx < trending.slice(1).length - 1 ? "border-b border-zinc-100" : ""}`}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                                                {item.FeaturedImage?.url && (
                                                    <Image
                                                        src={`${STRAPI}${item.FeaturedImage.url}`}
                                                        fill
                                                        alt={item.Title}
                                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-[#00A651] mb-1">
                                                    Report {idx + 2}
                                                </p>
                                                <p className="text-xs font-bold text-zinc-800 leading-snug group-hover:text-[#00A651] transition-colors duration-200 line-clamp-2">
                                                    {item.Title}
                                                </p>
                                            </div>

                                            <ArrowUpRight
                                                size={12}
                                                className="text-zinc-300 group-hover:text-[#00A651] mt-0.5 flex-shrink-0 transition-colors duration-200"
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Newsletter / promo nudge */}
                            <div className="relative rounded-3xl overflow-hidden bg-zinc-950 p-6">
                                <div className="h-[2px] absolute top-0 left-0 right-0 bg-gradient-to-r from-[#00A651] via-emerald-300 to-transparent" />
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#00A651]/10 rounded-full blur-2xl pointer-events-none" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#00A651] mb-3 relative z-10">
                                    Stay Ahead of the Curve
                                </p>
                                <p className="text-white font-black text-sm leading-snug mb-5 relative z-10">
                                    Get exclusive energy insights, market analysis, and expert commentary delivered to your inbox.
                                </p>
                                <button className="relative z-10 w-full bg-[#00A651] hover:bg-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-white hover:text-zinc-900 transition-all duration-300">
                                    Subscribe Now
                                </button>
                            </div>

                        </aside>

                    </div>
                </div>
            </main>

           
        </div>
    );
}

