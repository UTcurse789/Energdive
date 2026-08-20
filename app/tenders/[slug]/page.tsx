import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { notFound } from "next/navigation";
import { SidebarSubscribe } from "@/components/sidebar-subscribe";
import { TagBadge } from "@/components/ui/tag-badge";
import { ShareButton } from "@/components/ui/share-button";
import { ArrowLeft, ExternalLink, Calendar, Building2, MapPin, FileText, CheckCircle2, ChevronRight, Tags, ArrowRight } from "lucide-react";
import { formatContentDate } from "@/lib/date";
import ArticleBody from "@/components/ArticleBody";
import { fetchDataBlocks } from "@/lib/parse-content-blocks";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { SaveArticleButton } from "@/components/article/SaveArticleButton";
import { ContentAccessWrapper } from "@/components/ui/content-access-wrapper";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getCanonicalUrl } from "@/lib/seo";
import { getTenderBySlug, getRelatedTenders, normalizeTenderAttrs } from "@/lib/api/tenders";
import type { Metadata } from "next";

function slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeTag(tag: any) {
    const source = tag?.attributes || tag;
    const name = source?.name || "";
    const slug = source?.slug || (name ? slugify(name) : "");
    if (!name) return null;
    return { name, slug };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const tenderData = await getTenderBySlug(slug);

    if (!tenderData) return { title: { absolute: "Tenders - ENERGDIVE" } };

    const attrs = normalizeTenderAttrs(tenderData);
    const baseTitle = attrs.title || attrs.Title || "Tender";
    const shareTitle = `${String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim()} - ENERGDIVE Tenders`;
    const canonicalUrl = getCanonicalUrl(`/tenders/${slug}`);
    
    let description = "Explore global energy tenders and procurement opportunities.";
    if (attrs.seo?.metaDescription) {
        description = attrs.seo.metaDescription;
    } else if (attrs.excerpt) {
        if (typeof attrs.excerpt === 'string') description = attrs.excerpt;
        else if (Array.isArray(attrs.excerpt)) description = attrs.excerpt[0]?.children?.[0]?.text || description;
    }

    const imageUrl = attrs.featured_image?.data?.attributes?.url
        ? strapiImageUrl(attrs.featured_image.data.attributes.url)
        : attrs.featured_image?.url ? strapiImageUrl(attrs.featured_image.url) : getCanonicalUrl("/fav.jpg");

    return {
        title: { absolute: shareTitle },
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: shareTitle,
            description,
            url: canonicalUrl,
            siteName: "Energdive",
            images: [{ url: imageUrl, width: 1200, height: 630, alt: shareTitle }],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: shareTitle,
            description,
            images: [imageUrl],
        },
    };
}

export default async function TenderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const tenderData = await getTenderBySlug(slug);
    if (!tenderData) notFound();

    const attrs = normalizeTenderAttrs(tenderData);
    const sectorData = attrs.sectors?.data || attrs.sectors || [];
    const normalizedSectors = Array.isArray(sectorData) ? sectorData.map((t: any) => normalizeTag(t)).filter(Boolean) : [];
    const sectorSlugs = normalizedSectors.map((t: any) => t.slug).filter(Boolean);
    const relatedTenders = await getRelatedTenders(sectorSlugs, slug);

    const contentBlocks = attrs.content || attrs.Content || [];
    const dataBlocks = await fetchDataBlocks(contentBlocks);

    const gatedContentRaw = attrs.gated_content;
    const gatedContent = Array.isArray(gatedContentRaw) ? gatedContentRaw[0] : gatedContentRaw || null;
    const isPremium = gatedContent ? gatedContent.access_type === 'premium' : false;
    const requiresLogin = gatedContent ? (gatedContent.access_type === 'registered' || gatedContent.access_type === 'authenticated') : false;

    const rawDate = attrs.publishedAt || attrs.createdAt || "";
    const modifiedDate = attrs.updatedAt || rawDate;
    const displayDate = formatContentDate(rawDate);
    const canonicalUrl = getCanonicalUrl(`/tenders/${slug}`);

    let excerptText = "";
    if (attrs.excerpt && Array.isArray(attrs.excerpt)) excerptText = attrs.excerpt[0]?.children?.[0]?.text || "";
    else if (typeof attrs.excerpt === 'string') excerptText = attrs.excerpt;

    const imgUrl = attrs.featured_image?.data?.attributes?.url ? strapiImageUrl(attrs.featured_image.data.attributes.url) : attrs.featured_image?.url ? strapiImageUrl(attrs.featured_image.url) : "/placeholder.jpg";
    const isOpen = attrs.tender_status?.toLowerCase().includes('open');

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-[#00A651] selection:text-white pb-32">
            <ArticleJsonLd
                title={attrs.title || attrs.Title || "Tender"}
                datePublished={rawDate}
                dateModified={modifiedDate}
                slug={slug}
                imageUrl={imgUrl}
                section="tenders"
                description={excerptText}
            />
            <Header />

            <main className="pt-20 pb-24">
                
                {/* ── BREADCRUMB ── */}
                <div className="mx-auto w-full max-w-[1300px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 mb-6 sm:mb-8">
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-sans">
                        <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
                        <ChevronRight className="h-3 w-3" />
                        <Link href="/tenders" className="hover:text-teal-600 transition-colors">Tenders</Link>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-gray-600 font-medium truncate max-w-[200px]">{attrs.title || attrs.Title}</span>
                    </nav>
                </div>

                <div className="mx-auto w-full max-w-[1300px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 sm:gap-12 lg:gap-x-10 xl:gap-x-12 items-start">
                    
                    {/* MAIN COLUMN */}
                    <div className="min-w-0">
                        {/* Status Label */}
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                            <span className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm shadow-sm ${isOpen ? 'bg-[#00A651] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {attrs.tender_status || 'Status Unknown'}
                            </span>
                            {normalizedSectors.map((tag: any, i: number) => (
                                <span key={i} className="text-[11px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1">
                                    {i > 0 && <span className="text-gray-300">|</span>}
                                    {tag.name}
                                </span>
                            ))}
                        </div>

                        {/* Title (Smaller Size) */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-[1.1] tracking-tight text-gray-900 mb-6">
                            {attrs.title || attrs.Title}
                        </h1>

                        {/* Featured Image (Smaller Size) */}
                        <div className="relative aspect-video max-h-[450px] w-full mb-8 rounded-xl overflow-hidden shadow-lg shadow-black/10 group bg-gray-100">
                            <Image
                                src={imgUrl}
                                alt={attrs.title || attrs.Title || "Tender Image"}
                                fill
                                priority
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                {attrs.organization && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building2 className="w-4 h-4 text-teal-600" />
                                        <span className="font-semibold text-gray-900">{attrs.organization}</span>
                                    </div>
                                )}
                                {(attrs.country || attrs.state) && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-teal-600" />
                                        <span>{[attrs.state, attrs.country].filter(Boolean).join(", ")}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-teal-600" />
                                    <span>{displayDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Excerpt */}
                        {excerptText && (
                            <p className="text-base sm:text-xl text-gray-500 font-serif leading-relaxed mb-8 border-l-4 border-teal-500 pl-4 sm:pl-5 break-words">
                                {excerptText}
                            </p>
                        )}

                        {/* Full Description */}
                        <ContentAccessWrapper isPremium={isPremium} requiresLogin={requiresLogin}>
                            <article className="relative">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-teal-600" /> Tender Details
                                </h3>
                                <div className="prose prose-lg max-w-none font-serif text-[18px] leading-[1.95] text-gray-800
        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
        prose-h2:text-[32px] prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
        prose-a:text-teal-600 prose-a:decoration-teal-300 hover:prose-a:text-teal-800
        prose-strong:text-gray-900
        prose-li:marker:text-teal-500 break-words">
                                    <ArticleBody content={contentBlocks} dataBlocks={dataBlocks} />
                                </div>
                                
                                {/* Source Footer */}
                                {attrs.source && (
                                    <div className="mt-12 pt-6 border-t border-gray-100 flex items-center gap-4 text-sm">
                                        <span className="font-bold uppercase tracking-wider text-gray-400 text-xs">Source</span>
                                        <div className="font-medium text-gray-800">
                                            {attrs.source_url ? (
                                                <a href={attrs.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors flex items-center gap-1">
                                                    {attrs.source} <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : attrs.source}
                                        </div>
                                    </div>
                                )}
                            </article>
                        </ContentAccessWrapper>
                    </div>

                    {/* SIDEBAR */}
                    <aside>
                        <div className="sticky top-24 space-y-8">
                            
                            {/* Action Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    <span className="h-px flex-1 bg-gray-200" />
                                    Tender Deadline
                                    <span className="h-px flex-1 bg-gray-200" />
                                </h3>
                                <div className="text-center mb-6">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {attrs.tender_deadline ? formatContentDate(attrs.tender_deadline) : "Not Specified"}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {attrs.official_tender_link && (
                                        <a href={attrs.official_tender_link} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#00A651] hover:bg-teal-600 text-white py-3 rounded-lg font-bold transition-all shadow-sm">
                                            Official Tender <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex justify-center items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg py-2 transition-colors">
                                            <SaveArticleButton title={attrs.title || attrs.Title} url={canonicalUrl} />
                                        </div>
                                        <ShareButton title={attrs.title || attrs.Title} text={excerptText} url={canonicalUrl} className="w-12 justify-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors" iconClassName="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="mx-auto w-full max-w-[300px]">
                                <SidebarSubscribe />
                            </div>

                            {/* Related Tenders */}
                            {relatedTenders.length > 0 && (
                                <div className="mx-auto w-full max-w-[300px]">
                                    <h3 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        <span className="h-px flex-1 bg-gray-200" />
                                        Related Tenders
                                        <span className="h-px flex-1 bg-gray-200" />
                                    </h3>

                                    <div className="space-y-5">
                                        {relatedTenders.map((item: any) => {
                                            const r = normalizeTenderAttrs(item);
                                            const imgUrl = r.featured_image?.data?.attributes?.url 
                                                ? strapiImageUrl(r.featured_image.data.attributes.url) 
                                                : r.featured_image?.url 
                                                    ? strapiImageUrl(r.featured_image.url) 
                                                    : "/placeholder.jpg";
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={`/tenders/${r.slug}`}
                                                    className="group flex gap-4 rounded-lg p-2 -mx-2 transition-colors hover:bg-gray-50"
                                                >
                                                    <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                                        <Image src={imgUrl} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {r.organization && (
                                                            <span className="block text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-1 truncate bg-teal-50 px-2 py-0.5 rounded-full w-fit">
                                                                {r.organization}
                                                            </span>
                                                        )}
                                                        <h4 className="font-serif font-bold text-sm leading-snug text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-1">
                                                            {r.title || r.Title}
                                                        </h4>
                                                        {r.tender_deadline && (
                                                            <div className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" /> Due: {formatContentDate(r.tender_deadline)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
