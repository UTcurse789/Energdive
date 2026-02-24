import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Calendar, ArrowRight, User, Briefcase } from "lucide-react";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

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
    const url = img.formats?.large?.url || img.formats?.medium?.url || img.url;
    if (!url) return "/magazine-default.jpg";
    return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
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
        { next: { revalidate: 120 } }
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
        { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
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
        ? (avatarData.url.startsWith("http") ? avatarData.url : `${STRAPI_BASE}${avatarData.url}`)
        : null;

    const contents = await getContentByAuthor(authorName);

    // Format content items
    const articles = contents.map((item: any) => {
        const a = item.attributes || item;
        return {
            id: item.id,
            title: a.Title || a.title || "",
            slug: a.slug || "",
            excerpt: getExcerpt(a.Excerpt) || "",
            image: getImageUrl(a.FeaturedImage),
            date: formatDate(a.Date || a.createdAt),
            category: a.type_of_content?.name || a.type_of_content?.data?.attributes?.name || "Article",
            sector: a.sectors?.[0]?.name || a.sectors?.data?.[0]?.attributes?.name || "",
        };
    });

    return (
        <div className="bg-white min-h-screen">
            <Header />

            {/* Author Profile Hero */}
            <section className="pt-28 pb-16 bg-gradient-to-b from-zinc-50 to-white">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                        {/* Avatar */}
                        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white shadow-xl shrink-0 bg-zinc-100">
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

                        {/* Info */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-zinc-900 mb-3">
                                {authorName}
                            </h1>

                            <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                                <Briefcase className="w-4 h-4 text-[#09B697]" />
                                <span className="text-sm font-semibold text-[#09B697] uppercase tracking-widest">
                                    {authorDesignation}
                                </span>
                            </div>

                            {authorBio && (
                                <p className="text-zinc-500 font-serif text-lg leading-relaxed max-w-2xl">
                                    {authorBio}
                                </p>
                            )}

                            <div className="mt-6 flex items-center justify-center md:justify-start gap-6 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{articles.length} {articles.length === 1 ? "Article" : "Articles"} Published</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content by Author */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="flex items-center justify-between mb-12 border-b border-zinc-100 pb-6">
                        <h2 className="text-2xl font-serif font-bold text-zinc-900">
                            All Articles by {authorName}
                        </h2>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            {articles.length} {articles.length === 1 ? "Post" : "Posts"}
                        </span>
                    </div>

                    {articles.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-zinc-400 font-serif text-lg">No articles published yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {articles.map((article: any) => (
                                <Link
                                    key={article.id}
                                    href={
                                        article.category === "Opinion"
                                            ? `/opinion/${article.slug}`
                                            : `/news/${article.slug}`
                                    }
                                    className="group flex flex-col md:flex-row gap-6 border-b border-zinc-50 pb-8 last:border-0"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-full md:w-64 aspect-video md:aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100 shrink-0">
                                        <Image
                                            src={article.image}
                                            alt={article.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            {article.sector && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#09B697]">
                                                    {article.sector}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-50 px-2 py-0.5 rounded">
                                                {article.category}
                                            </span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-serif font-bold leading-tight text-zinc-900 group-hover:text-[#09B697] transition-colors mb-2 line-clamp-2">
                                            {article.title}
                                        </h3>

                                        {article.excerpt && (
                                            <p className="text-sm text-zinc-500 font-serif line-clamp-2 mb-3">
                                                {article.excerpt}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{article.date}</span>
                                            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#09B697]" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
