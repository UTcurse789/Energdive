import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { 
  Building2, MapPin, Calendar, FileText, Sparkles, 
  ExternalLink, Download, ArrowLeft, ArrowRight, 
  CheckCircle2, AlertCircle, Share2, Tag, ShieldCheck,
  ChevronRight, Layers, Clock, DollarSign, ArrowUpRight,
  TrendingUp, Users, FileCheck2, Info, Building, HelpCircle,
  FileSpreadsheet, ShieldAlert, BadgeCheck, FileDown,
  Briefcase, Landmark, Check, Hash, CalendarDays, Timer
} from "lucide-react";
import { formatContentDate } from "@/lib/date";
import { getTenderBySlug, getRelatedTenders, UnifiedTender } from "@/lib/api/tenders";
import { getCanonicalUrl } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tender = await getTenderBySlug(slug);

  if (!tender) {
    return { title: { absolute: "Tender Details - ENERGDIVE" } };
  }

  const shareTitle = `${tender.title.replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim()} | ENERGDIVE Tenders`;
  const canonicalUrl = getCanonicalUrl(`/tenders/${slug}`);
  const description = tender.aiAnalysis?.summary || tender.description || "Explore government energy tender details, critical milestone dates, and official document downloads.";

  return {
    title: { absolute: shareTitle },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: shareTitle,
      description,
      url: canonicalUrl,
      siteName: "Energdive",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
    },
  };
}

export default async function TenderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tender: UnifiedTender | null = await getTenderBySlug(slug);

  if (!tender) {
    notFound();
  }

  const relatedTenders = await getRelatedTenders(tender.sector, tender.reference, 3);
  const isOpen = tender.tenderStatus?.toLowerCase().includes("open");
  const ai = tender.aiAnalysis;

  const pdfUrl = tender.pdfPath || tender.pdfUrl || null;
  const portalUrl = tender.officialUrl || "https://eprocure.gov.in";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#00A651] selection:text-white pb-32 sm:pb-36">
      <Header />

<<<<<<< HEAD
      <main className="pt-16 sm:pt-20 pb-20">
        
        {/* ── BREADCRUMB ── */}
        <div className="mx-auto w-full max-w-[1300px] px-3 sm:px-6 lg:px-8 mb-4 sm:mb-6">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 font-medium overflow-x-auto pb-1 scrollbar-none">
            <Link href="/" className="hover:text-emerald-600 transition-colors shrink-0">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
            <Link href="/tenders" className="hover:text-emerald-600 transition-colors shrink-0">Tenders</Link>
            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
            <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-[350px]">
              {tender.title}
            </span>
          </nav>
=======
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
>>>>>>> 8dd387824b3d621f0f1487e9afb1bfe5d2208896
        </div>

        {/* ── MAIN CONTENT & SIDEBAR GRID (Mobile-First) ── */}
        <div className="mx-auto w-full max-w-[1300px] px-3 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 sm:gap-8 lg:gap-10 items-start">
          
          {/* ──── LEFT COLUMN (CHRONOLOGICAL DETAILED SECTIONS) ──── */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* 1. 🏷️ HEADER BANNER & CLASSIFICATION */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-sm space-y-4 sm:space-y-6">
              
              {/* Top Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-lg ${
                  isOpen ? "bg-[#00A651] text-white shadow-sm" : "bg-slate-100 text-slate-600"
                }`}>
                  {isOpen ? "Active Tender" : "Closed"}
                </span>

                <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-lg">
                  {tender.sector || "Energy"}
                </span>

                {tender.tenderCategory && (
                  <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium bg-slate-100 text-slate-700 rounded-lg">
                    Category: {tender.tenderCategory}
                  </span>
                )}

                {tender.tenderType && (
                  <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium bg-slate-100 text-slate-700 rounded-lg">
                    Type: {tender.tenderType}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-[1.25] text-slate-900 tracking-tight">
                {tender.title}
              </h1>

              {/* Reference & Tender ID Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {tender.reference && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Ref No:</span>
                    <span className="font-semibold text-slate-900 select-all truncate ml-2">{tender.reference}</span>
                  </div>
                )}
                {tender.tenderId && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Tender ID:</span>
                    <span className="font-semibold text-slate-900 select-all truncate ml-2">{tender.tenderId}</span>
                  </div>
                )}
              </div>

              {/* Authority & Location Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                {tender.organization && (
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Organisation Chain</div>
                      <div className="font-semibold text-slate-900 leading-snug">{tender.organization}</div>
                      {tender.department && (
                        <div className="text-xs text-slate-500 mt-0.5">{tender.department}</div>
                      )}
                    </div>
                  </div>
                )}
                {(tender.state || tender.country || tender.location || tender.pincode) && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Location & Pincode</div>
                      <div className="font-semibold text-slate-900 leading-snug">
                        {[tender.location, tender.state, tender.country].filter(Boolean).join(", ")}
                      </div>
                      {tender.pincode && (
                        <div className="text-xs text-slate-500 mt-0.5">Pincode: {tender.pincode}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. 📅 COMPLETE CHRONOLOGICAL CRITICAL DATES TIMELINE */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  Chronological Critical Dates & Timeline
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">8-Stage Flow</span>
              </div>

              {/* Chronological Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                
                {/* 1. Published Date */}
                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> 1. Published Date
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {tender.publishedDate ? formatContentDate(tender.publishedDate) : "Refer Notice"}
                  </div>
                  <div className="text-[10px] text-slate-500">Tender notification issued</div>
                </div>

                {/* 2. Document Download Period */}
                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 2. Document Download
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {tender.docDownloadStartDate ? formatContentDate(tender.docDownloadStartDate) : "Available"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {tender.docDownloadEndDate ? `Closes: ${formatContentDate(tender.docDownloadEndDate)}` : "Until closing date"}
                  </div>
                </div>

                {/* 3. Clarification Period */}
                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> 3. Clarification Window
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {tender.clarificationStartDate ? formatContentDate(tender.clarificationStartDate) : "As per tender"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {tender.clarificationEndDate ? `Ends: ${formatContentDate(tender.clarificationEndDate)}` : "Online queries"}
                  </div>
                </div>

                {/* 4. Pre-Bid Meeting */}
                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> 4. Pre-Bid Meeting
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {tender.preBidMeetingDate ? formatContentDate(tender.preBidMeetingDate) : "Not Applicable / None"}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {tender.preBidMeetingPlace || "Virtual / Mine Office"}
                  </div>
                </div>

                {/* 5. Bid Submission Start & Deadline */}
                <div className={`p-3.5 rounded-2xl border space-y-1 ${
                  isOpen ? "bg-emerald-50/50 border-emerald-300" : "bg-slate-50 border-slate-200/70"
                }`}>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} /> 
                    5. Submission Deadline
                  </div>
                  <div className={`text-xs sm:text-sm font-bold ${isOpen ? "text-emerald-900" : "text-slate-900"}`}>
                    {tender.deadline ? formatContentDate(tender.deadline) : "Check Documents"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {tender.bidSubmissionStartDate ? `Starts: ${formatContentDate(tender.bidSubmissionStartDate)}` : "Bid closing time"}
                  </div>
                </div>

                {/* 6. Bid Opening Date */}
                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> 6. Bid Opening Date
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {tender.openingDate ? formatContentDate(tender.openingDate) : "Post Deadline"}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {tender.bidOpeningPlace || "Opening at authority office"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 📄 COMPLETE TENDERS DOCUMENTS & PDF DOWNLOAD CENTER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <FileDown className="w-4 h-4 text-emerald-400" /> Official Documentation & PDF Hub
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-light">
                    Direct access to official NIT documents, Price Bid sheets (.xls), and CPPP Tender Covers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Primary PDF
                    </a>
                  )}

                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                  >
                    CPPP Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Document List Table / Cards if metadata is present */}
              {tender.documentsMetadata && tender.documentsMetadata.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Attached NIT & Work Item Documents ({tender.documentsMetadata.length})
                  </div>
                  <div className="space-y-2">
                    {tender.documentsMetadata.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-white truncate">{doc.name}</div>
                            {doc.description && (
                              <div className="text-[10px] text-slate-400 truncate">{doc.description}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {doc.size_kb && (
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">{doc.size_kb} KB</span>
                          )}
                          <a
                            href={doc.download_url || portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                          >
                            Download <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. 💰 FINANCIAL & COMMERCIAL SPECIFICATIONS */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Financial & Commercial Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tender Value in ₹</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.tenderValue && tender.tenderValue !== "0.00" ? tender.tenderValue : "Refer to Notice"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">EMD Amount in ₹</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.emdAmount && tender.emdAmount !== "0.00" ? tender.emdAmount : "0.00 (Exempted)"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tender Fee in ₹</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.tenderFee && tender.tenderFee !== "0.00" ? tender.tenderFee : "0.00 (Nil)"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Period of Work</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.periodOfWorkDays ? `${tender.periodOfWorkDays} Days` : "As per tender"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bid Validity</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.bidValidityDays ? `${tender.bidValidityDays} Days` : "60 Days"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Form Of Contract</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.formOfContract || "Works / Services"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No. of Covers</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.noOfCovers || "2 (Fee/Tech & Finance)"}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Withdrawal Allowed</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                    {tender.withdrawalAllowed || "Yes"}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 🤖 AI TENDER INTELLIGENCE & ANALYSIS */}
            {ai && (ai.summary || ai.why_it_matters || (ai.key_scopes && ai.key_scopes.length > 0)) && (
              <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-emerald-800/40 shadow-xl space-y-5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  AI Tender Intelligence & Analysis
                </div>

                {/* AI Summary */}
                {ai.summary && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Executive Summary</h4>
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-light">
                      {ai.summary}
                    </p>
                  </div>
                )}

                {/* Key Scopes / Highlights */}
                {ai.key_scopes && ai.key_scopes.length > 0 && (
                  <div className="pt-2 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Key Technical Scope & Work Items
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {ai.key_scopes.map((scope, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{scope}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Eligibility Highlights */}
                {(ai.eligibility || ai.eligibility_highlights || tender.preQualification) && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs sm:text-sm text-emerald-200 space-y-1">
                    <strong className="text-emerald-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" /> Eligibility & Prequalification Criteria:
                    </strong>
                    <p className="text-slate-300 leading-relaxed pt-1">
                      {ai.eligibility || ai.eligibility_highlights || tender.preQualification}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. 📝 COMPLETE WORK ITEM DESCRIPTION */}
            {tender.description && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Work Description & Technical Specifications
                </h3>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100 font-sans">
                  {tender.description}
                </div>
              </div>
            )}

            {/* 7. 🏛️ TENDER INVITING AUTHORITY */}
            {(tender.invitingAuthorityName || tender.invitingAuthorityAddress || tender.organization) && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm space-y-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  Tender Inviting Authority
                </h3>

                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-2">
                  {tender.invitingAuthorityName && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Designated Officer / Authority</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">{tender.invitingAuthorityName}</div>
                    </div>
                  )}
                  {tender.invitingAuthorityAddress && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Office Address</div>
                      <div className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">{tender.invitingAuthorityAddress}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div>
              <Link
                href="/tenders"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors p-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to all tenders
              </Link>
            </div>
          </div>

          {/* ──── RIGHT COLUMN (STICKY SIDEBAR) ──── */}
          <aside className="space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="text-center pb-4 border-b border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Bid Submission Deadline
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {tender.deadline ? formatContentDate(tender.deadline) : "Check Document"}
                  </div>
                  <div className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-slate-100 text-slate-600"
                  }`}>
                    {isOpen ? "Active Opportunity" : "Closed"}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-[#00A651] hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" /> Download Official PDF
                    </a>
                  )}

                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all"
                  >
                    Open CPPP Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Related Tenders Card */}
              {relatedTenders.length > 0 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3.5">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Related in {tender.sector}
                  </h3>

                  <div className="space-y-2.5">
                    {relatedTenders.map((rel) => (
                      <Link
                        key={rel.reference || rel.id}
                        href={`/tenders/${rel.slug}`}
                        className="block p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 border border-slate-100 transition-all group"
                      >
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 line-clamp-2 mb-1">
                          {rel.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {rel.organization}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── MOBILE STICKY BOTTOM ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden shadow-2xl flex items-center gap-2.5">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#00A651] text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        ) : null}
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-xs"
        >
          CPPP Portal <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
