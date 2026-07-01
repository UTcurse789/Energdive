import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Layers3,
    ArrowUpRight,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { cn } from "@/lib/utils";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getCanonicalUrl } from "@/lib/seo";
import { formatContentDate } from "@/lib/date";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

const COVER_PALETTES = [
    "from-zinc-950 via-emerald-950 to-emerald-700",
    "from-slate-950 via-blue-950 to-cyan-700",
    "from-neutral-950 via-zinc-800 to-amber-700",
    "from-stone-950 via-teal-950 to-lime-700",
    "from-zinc-950 via-indigo-950 to-sky-700",
    "from-neutral-950 via-rose-950 to-orange-700",
];

function hashIndex(value: string | number, length: number) {
    return Math.abs(
        String(value).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
    ) % length;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function readAttrs(item: any) {
    return item?.attributes || item || {};
}

function getRelationList(raw: any) {
    const list = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
            ? raw
            : raw?.data
                ? [raw.data]
                : raw
                    ? [raw]
                    : [];

    return list.map((entry: any) => readAttrs(entry));
}

function normalizeTag(tag: any) {
    const source = readAttrs(tag);
    const name = source?.name || source?.Name || "";
    const tagSlug = source?.slug || (name ? slugify(name) : "");

    if (!name) return null;

    return { name, slug: tagSlug };
}

function extractText(blocks: any): string {
    if (typeof blocks === "string") return blocks.trim();
    if (!Array.isArray(blocks)) return "";

    return blocks
        .map((block: any) =>
            Array.isArray(block?.children)
                ? block.children.map((child: any) => child?.text || "").join("")
                : ""
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function getMediaUrl(media: any): string | null {
    if (!media) return null;

    const source = Array.isArray(media) ? media[0] : media;
    const attrs = readAttrs(source?.data || source);
    const path =
        attrs?.formats?.large?.url ||
        attrs?.formats?.medium?.url ||
        attrs?.formats?.small?.url ||
        attrs?.formats?.thumbnail?.url ||
        attrs?.url ||
        null;

    return path ? strapiImageUrl(path) : null;
}

function normalizeExternalUrl(value: unknown): string | null {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) {
        return raw;
    }

    if (raw.startsWith("/")) {
        return `${STRAPI.replace(/\/$/, "")}${raw}`;
    }

    if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(raw)) {
        return `https://${raw}`;
    }

    return raw;
}

/* ==========================================================
   DATA FETCHING
   ========================================================== */

async function getReport(slug: string) {
    try {
        const res = await fetch(
            `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&filters[type_of_content][name][$eq]=Reports&populate=*`,
            { next: { revalidate: 3600 } }
        );
        const json = await res.json();
        return json?.data?.[0] ?? null;
    } catch (e) {
        console.error("Strapi Fetch Error:", e);
        return null;
    }
}

async function fetchReportCollection(query: string) {
    try {
        const res = await fetch(`${STRAPI}/api/contents?${query}`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const json = await res.json();
        return json?.data ?? [];
    } catch {
        return [];
    }
}

async function getRelatedReports(currentSlug: string, sectorSlugs: string[], tagSlugs: string[]) {
    const baseQuery = [
        "filters[type_of_content][name][$eq]=Reports",
        `filters[slug][$ne]=${encodeURIComponent(currentSlug)}`,
        "populate[FeaturedImage]=true",
        "populate[sectors]=true",
        "populate[tags]=true",
        "sort[0]=Date:desc",
        "sort[1]=publishedAt:desc",
        "pagination[limit]=4",
    ].join("&");

    if (sectorSlugs.length > 0) {
        const sectorFilters = sectorSlugs
            .map((sectorSlug, index) => `filters[sectors][slug][$in][${index}]=${encodeURIComponent(sectorSlug)}`)
            .join("&");
        const sectorMatches = await fetchReportCollection(`${baseQuery}&${sectorFilters}`);
        if (sectorMatches.length > 0) return sectorMatches;
    }

    if (tagSlugs.length > 0) {
        const tagFilters = tagSlugs
            .map((tagSlug, index) => `filters[tags][slug][$in][${index}]=${encodeURIComponent(tagSlug)}`)
            .join("&");
        const tagMatches = await fetchReportCollection(`${baseQuery}&${tagFilters}`);
        if (tagMatches.length > 0) return tagMatches;
    }

    return fetchReportCollection(baseQuery);
}

function mapSidebarReport(item: any) {
    const report = readAttrs(item);
    return {
        id: item?.id ?? report?.id ?? report?.documentId ?? report?.slug,
        slug: report?.slug || "",
        title: report?.Title || report?.title || "Untitled Report",
        imageUrl: getMediaUrl(report?.FeaturedImage || report?.featuredImage),
    };
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const article = await getReport(slug);

    if (!article) {
        return {
            title: { absolute: "Report - ENERGDIVE" },
            description: "Read in-depth energy reports on ENERGDIVE.",
        };
    }

    const report = readAttrs(article);
    const baseTitle = report.Title || report.title || "Report";
    const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
    const canonicalUrl = getCanonicalUrl(`/reports/${slug}`);
    const excerpt = extractText(report.Excerpt || report.excerpt) || "Read in-depth energy reports on ENERGDIVE.";
    const imageUrl = getMediaUrl(report.FeaturedImage || report.featuredImage) || getCanonicalUrl("/fav.jpg");

    return {
        title: { absolute: shareTitle },
        description: excerpt,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: shareTitle,
            description: excerpt,
            url: canonicalUrl,
            siteName: "ENERGDIVE",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: shareTitle,
                },
            ],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description: excerpt,
            images: [imageUrl],
        },
    };
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
                    <div key={i} className="my-16 border-l-4 border-[#00A651] bg-[#00A651]/5 pl-6 py-4 rounded-r-lg">
                        <p className="text-xl font-serif italic text-zinc-700 leading-snug">
                            {renderInlineChildren(block.children)}
                        </p>
                    </div>
                );
            default:
                return (
                    <p key={i} className="font-serif text-[17px] leading-[1.8] text-zinc-700 mb-6">
                        {renderInlineChildren(block.children)}
                    </p>
                );
        }
    });
}

/* ==========================================================
   HELPER COMPONENTS
   ========================================================== */

function SummaryItem({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Building2;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-lg border border-zinc-200 bg-[#fbfcfb] p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Icon className="h-3.5 w-3.5 text-[#00A651]" />
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                {label}
            </p>
            <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
                {value}
            </p>
        </div>
    );
}

function ReportCover({
    title,
    imageUrl,
    tag,
    year,
    id,
}: {
    title: string;
    imageUrl: string | null;
    tag: string;
    year: string;
    id: string;
}) {
    const palette = COVER_PALETTES[hashIndex(id, COVER_PALETTES.length)];

    if (imageUrl) {
        return (
            <div className="flex justify-start">
                <Image
                    src={imageUrl}
                    alt={title}
                    width={1200}
                    height={675}
                    priority
                    sizes="(max-width: 1024px) 340px, 350px"
                    className="h-auto w-full rounded-lg border border-zinc-200 shadow-sm"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative aspect-[5/3] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br text-white shadow-inner",
                palette
            )}
        >
            <div className="absolute inset-0 opacity-35">
                <div className="absolute left-0 top-1/4 h-px w-full bg-white/30" />
                <div className="absolute left-0 top-1/2 h-px w-full bg-white/20" />
                <div className="absolute bottom-1/4 left-0 h-px w-full bg-white/20" />
                <div className="absolute bottom-0 right-10 top-0 w-px bg-white/20" />
                <div className="absolute bottom-0 right-24 top-0 w-px bg-white/10" />
            </div>
            <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                        REPORT
                    </span>
                    <span className="text-right text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                        {year}
                    </span>
                </div>
                <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100">
                        {tag}
                    </p>
                    <h2 className="line-clamp-2 max-w-[92%] text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                        {title}
                    </h2>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
                        ENERGDIVE Intelligence
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ==========================================================
   PAGE COMPONENT
   ========================================================== */

export default async function IntelligenceReportPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getReport(slug);

    if (!article) notFound();

    const report = readAttrs(article);
    const sectorSlugs = getRelationList(report.sectors)
        .map((sector: any) => sector?.slug)
        .filter(Boolean);
    const tagSlugs = getRelationList(report.tags)
        .map((tag: any) => normalizeTag(tag))
        .filter(Boolean)
        .map((tag: any) => tag.slug)
        .filter(Boolean);
    const relatedReports = (await getRelatedReports(slug, sectorSlugs, tagSlugs))
        .map((item: any) => mapSidebarReport(item))
        .filter((item: any) => item.slug);

    const title = report.Title || report.title || "Untitled Report";
    const imageUrl = getMediaUrl(report.FeaturedImage || report.featuredImage);
    const downloadUrl = normalizeExternalUrl(
        report.source || report.Source || report.downloadUrl || report.DownloadUrl
    );
    const excerpt = extractText(report.Excerpt || report.excerpt);

    // Derived values for UI
    const dateObj = new Date(report.Date || report.publishedAt || report.createdAt);
    const yearStr = dateObj.getFullYear().toString();
    const primarySector = getRelationList(report.sectors)[0]?.name || getRelationList(report.sectors)[0]?.Name || "Energy";
    
    // For rendering multiple tags
    const displaySectors = getRelationList(report.sectors).map((s: any) => s.name || s.Name).filter(Boolean);

    return (
        <div className="min-h-screen bg-white font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
            <ScrollProgress />
            <Header />

            {/* HERO SECTION */}
            <main>
                <section className="bg-white dark:bg-zinc-950 pt-16 pb-20">
                    <div className="mx-auto max-w-[1200px] px-8 sm:px-14 lg:px-20">
                        <Link
                            href="/reports"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-400 transition hover:text-zinc-900 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Reports
                        </Link>

                        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-20">
                            {/* LEFT SIDE: Info */}
                            <div>
                                <div className="mb-6 flex flex-wrap gap-3">
                                    <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-900 dark:bg-zinc-800 dark:text-white">
                                        REPORT
                                    </span>
                                    {report.isFeatured && (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#00A651] dark:bg-emerald-900/30">
                                            FEATURED
                                        </span>
                                    )}
                                </div>

                                <h1 className="max-w-4xl font-serif text-4xl font-normal leading-[1.1] tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl xl:text-[64px]">
                                    {title}
                                </h1>
                                {excerpt && (
                                    <p className="mt-8 max-w-[65ch] text-lg font-light leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
                                        {excerpt}
                                    </p>
                                )}
                            </div>

                            {/* RIGHT SIDE: Cover & Download */}
                            <div className="lg:sticky lg:top-32 flex flex-col items-center sm:items-start w-full">
                                <div className="w-full max-w-[300px] xl:max-w-[340px]">
                                    <ReportCover
                                        title={title}
                                        imageUrl={imageUrl}
                                        tag={primarySector}
                                        year={yearStr}
                                        id={article.id || slug}
                                    />
                                    <div className="mt-6 w-full">
                                        {downloadUrl ? (
                                            <ReportDownloadButton slug={slug} title={title} downloadUrl={downloadUrl} />
                                        ) : (
                                            <div className="rounded-lg bg-zinc-100 p-4 text-center text-sm font-semibold text-zinc-500 dark:bg-zinc-900">
                                                Download Not Available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* REPORT OVERVIEW (EDITORIAL BODY) */}
                <section className="bg-[#fcfcfc] dark:bg-[#0a0a0a] border-t border-zinc-100 dark:border-zinc-900 px-8 py-20 sm:px-14 lg:px-20">
                    <div className="mx-auto max-w-[65ch]">
                        <h2 className="mb-10 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                            Report Overview
                        </h2>
                        
                        <div className="prose prose-zinc prose-lg dark:prose-invert max-w-none prose-p:leading-loose prose-p:font-light prose-headings:font-serif prose-headings:font-normal text-zinc-800 dark:text-zinc-300">
                            <RenderBlocks blocks={report.Content || report.content || []} />
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
