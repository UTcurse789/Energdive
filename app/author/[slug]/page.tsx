import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight, Briefcase, FileText, Tag } from "lucide-react";
import { DateChip } from "@/components/ui/date-chip";
import { formatContentDate } from "@/lib/date";
import { buildContentUrl } from "@/lib/content-routes";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

/* ==================== HELPERS ==================== */

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getImageUrl(img: any): string {
    if (!img) return "/magazine-default.jpg";
    const source = img?.data || img;
    const attrs = source?.attributes || source;
    const url = attrs?.formats?.large?.url || attrs?.formats?.medium?.url || attrs?.formats?.small?.url || attrs?.url;
    if (!url) return "/magazine-default.jpg";
    return strapiImageUrl(url);
}

function getExcerpt(excerpt: any): string {
    if (!excerpt || !Array.isArray(excerpt)) return "";
    return excerpt
        .map((block: any) =>
            (block.children || []).map((child: any) => child.text || "").join("")
        )
        .filter(Boolean)
        .join(" ")
        .trim();
}

/** Safely extract text from a Strapi field that may be a string, rich text array, or object */
function extractText(field: any): string {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (Array.isArray(field)) {
        return field
            .map((block: any) =>
                (block.children || []).map((child: any) => child.text || "").join("")
            )
            .filter(Boolean)
            .join(" ")
            .trim();
    }
    if (typeof field === "object" && field.children) {
        return (field.children || []).map((child: any) => child.text || "").join("");
    }
    return String(field);
}

/* ==================== DATA FETCHING ==================== */

async function getAllAuthors() {
    const res = await fetch(
        `${STRAPI_BASE}/api/authors?populate=avatar&pagination[pageSize]=100`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
}

async function getAuthorBySlug(slug: string) {
    // Fetch all authors and match by slugified name
    const authors = await getAllAuthors();
    return authors.find((author: any) => {
        const name = author.name || author.attributes?.name || "";
        return slugify(name) === slug;
    }) || null;
}

async function getContentByAuthor(authorName: string) {
    const encodedName = encodeURIComponent(authorName);
    const res = await fetch(
        `${STRAPI_BASE}/api/contents?filters[author][name][$eq]=${encodedName}&populate[0]=FeaturedImage&populate[1]=author.avatar&populate[2]=sectors&populate[3]=type_of_content&pagination[pageSize]=50&sort=createdAt:desc`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
}

function getContentRoute(item: any) {
    return buildContentUrl({ slug: item.slug, contentType: item.category });
}

function getCategoryBadgeTone(type: string) {
    const key = String(type || "").toLowerCase();
    if (key.includes("opinion")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (key.includes("report")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (key.includes("news")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-zinc-50 text-zinc-600 border-zinc-200";
}

/* ==================== PAGE ==================== */

export default async function AuthorPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    const authorData = await getAuthorBySlug(slug);
    if (!authorData) notFound();

    const attrs = authorData.attributes || authorData;
    const authorName = extractText(attrs.name) || "Unknown Author";
    const authorDesignation = extractText(attrs.designation) || "Author";
    const authorBio = extractText(attrs.bio);

    const avatarData = attrs.avatar?.data?.attributes || attrs.avatar;
    const avatarUrl = avatarData?.url
        ? (avatarData.url.startsWith("http") ? avatarData.url : strapiImageUrl(avatarData.url))
        : null;

    const contents = await getContentByAuthor(authorName);

    // Format content items
    const articles = contents.map((item: any) => {
        const a = item.attributes || item;
        const sectorSource = Array.isArray(a.sectors?.data) ? a.sectors.data[0] : a.sectors?.[0];
        const sectorAttrs = sectorSource?.attributes || sectorSource || {};
        return {
            id: item.id,
            title: a.Title || a.title || "",
            slug: a.slug || "",
            excerpt: getExcerpt(a.Excerpt) || "",
            image: getImageUrl(a.FeaturedImage),
            date: formatContentDate(a.Date || a.publishedAt || a.createdAt),
            category: a.type_of_content?.name || a.type_of_content?.data?.attributes?.name || "Article",
            sector: sectorAttrs?.name || "",
        };
    }).filter((item: any) => item.slug);

    return (
        <div className="min-h-screen bg-[#f5f7fa] text-zinc-900">
            {/* Author Profile Hero */}
            <section className="relative overflow-hidden border-b border-zinc-200 bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,166,81,0.3),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(9,182,151,0.18),transparent_40%)]" />
                <div className="container relative z-10 mx-auto px-6 lg:px-16 max-w-[1400px] py-16 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10 items-center">
                        <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-3xl overflow-hidden border border-white/25 shadow-[0_25px_70px_rgba(0,0,0,0.35)] shrink-0 bg-zinc-900">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={authorName}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a4731] to-[#09B697]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#00A651]/20 to-transparent rounded-full blur-2xl -mr-16 -mt-16" />
                                    <span className="text-5xl font-bold text-white">
                                        {authorName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 mb-6 mt-6">
                                <Tag size={12} />
                                Author Desk
                            </div>
                            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-white mb-3">
                                {authorName}
                            </h1>

                            <div className="flex items-center gap-2 mb-6 text-emerald-300">
                                <Briefcase className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                                    {authorDesignation}
                                </span>
                            </div>

                            {authorBio && (
                                <p className="text-zinc-300 font-serif text-lg leading-relaxed max-w-3xl">
                                    {authorBio}
                                </p>
                            )}

                            <div className="mt-8 mb-8 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white">
                                    <FileText size={12} />
                                    {articles.length} {articles.length === 1 ? "Article" : "Articles"}
                                </div>
                                {articles[0]?.date && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-200">
                                        <Calendar size={12} />
                                        Latest: <DateChip value={articles[0].date} className="text-[10px]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content by Author */}
            <section className="py-14 md:py-20">
                <div className="container mx-auto px-6 lg:px-16 max-w-[1400px]">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-10 border-b border-zinc-200 pb-5">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900">
                            All Articles by {authorName}
                        </h2>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em]">
                            {articles.length} {articles.length === 1 ? "Post" : "Posts"}
                        </span>
                    </div>

                    {articles.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white py-20 text-center">
                            <p className="text-zinc-500 font-serif text-lg">No articles published yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
                            {articles.map((article: any) => (
                                <article
                                    key={article.id}
                                    className="group h-full rounded-3xl border border-zinc-200/80 bg-white overflow-hidden shadow-[0_12px_34px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-300"
                                >
                                    <Link href={getContentRoute(article)} className="block h-full">
                                        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                                            <Image
                                                src={article.image}
                                                alt={article.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                                            <span className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getCategoryBadgeTone(article.category)}`}>
                                                {article.category}
                                            </span>
                                        </div>

                                        <div className="p-6 flex flex-col h-[calc(100%-0px)]">
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                                                <DateChip value={article.date || "Recent"} className="text-[10px]" />
                                                {article.sector && (
                                                    <>
                                                        <span className="text-zinc-300">|</span>
                                                        <span className="text-zinc-500">{article.sector}</span>
                                                    </>
                                                )}
                                            </div>

                                            <h3 className="text-2xl font-serif font-bold leading-tight text-zinc-900 group-hover:text-[#00A651] transition-colors line-clamp-2 mb-3">
                                                {article.title}
                                            </h3>

                                            <p className="text-[15px] text-zinc-500 leading-relaxed line-clamp-3 mb-6">
                                                {article.excerpt || "Read the full intelligence brief for deeper context and market signals."}
                                            </p>

                                            <div className="mt-auto inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#00A651]">
                                                Read Intelligence
                                                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
