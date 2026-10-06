"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Newspaper, ChevronRight } from "lucide-react";
import { strapiMediaUrl } from "@/lib/strapi-image";
import { buildContentUrl } from "@/lib/content-routes";
import { formatContentDate } from "@/lib/date";
import { DeferredAdBanner } from "@/components/ads/deferred-ad-banner";

interface NewsItem {
  id: number | string;
  Title?: string | null;
  slug?: string | null;
  type_of_content?: any;
  sectors?: Array<{ name?: string | null }> | null;
  content_tag?: unknown;
  Date?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  Excerpt?: any;
  FeaturedImage?: any;
  author?: { name?: string | null } | null;
}

interface LatestNewsSectionProps {
  news: NewsItem[];
}

function extractExcerpt(article: any): string {
  const excerpt = article?.Excerpt;
  if (!excerpt) return "";
  if (typeof excerpt === "string") return excerpt;
  if (!Array.isArray(excerpt)) return "";
  return excerpt
    .map((block: any) =>
      (block.children || []).map((child: any) => child.text || "").join("")
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function NewsCard({ item }: { item: NewsItem }) {
  const href = buildContentUrl({
    slug: item.slug || "",
    type_of_content: item.type_of_content,
    content_tag: item.content_tag,
  });
  const imgUrl = strapiMediaUrl(item.FeaturedImage, "/magazine-default.jpg");
  const sectorName = item.sectors?.[0]?.name;
  const dateStr = formatContentDate(item.Date || item.publishedAt || item.createdAt || "");

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 h-full">
      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
        <Image
          src={imgUrl}
          alt={item.Title || "News image"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <Link href={href}>
            <h3
              className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              {item.Title}
            </h3>
          </Link>
          {extractExcerpt(item) && (
            <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2 mt-1.5 mb-3">
              {extractExcerpt(item)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium pt-3 border-t border-slate-100 mt-auto">
          {sectorName ? (
            <Link
              href={`/sectors/${slugify(sectorName)}`}
              className="text-emerald-700 font-black uppercase tracking-wider hover:text-emerald-900 transition-colors"
            >
              {sectorName}
            </Link>
          ) : <span />}
          {dateStr && (
            <div className="flex items-center gap-1 text-slate-600 font-medium">
              <Clock className="w-3 h-3" />
              <span>{dateStr}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function LatestNewsSection({ news }: LatestNewsSectionProps) {
  if (!news || news.length === 0) return null;

  // First 3 news items for the top row (alongside the ad = 4 cols)
  const topNews = news.slice(0, 3);
  // Next 4 news items for the bottom grid
  const gridCards = news.slice(3, 7);

  return (
    <section className="bg-slate-50/80 border-t border-b border-slate-200/90 py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-700">
              <Newspaper className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
                style={{ fontFamily: "var(--font-playfair, serif)" }}
              >
                Latest Energy News
              </h2>
            </div>
          </div>

          <Link
            href="/news"
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-600 text-slate-800 hover:text-white border border-slate-200 hover:border-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-2xs hover:shadow-md self-start sm:self-auto"
          >
            Explore All News
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Top Row: 3 News Cards + 1 new_sidebar Ad Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-stretch">
          {topNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}

          {/* Ad Card (3rd Column) */}
          <div className="flex items-center justify-center w-full h-full overflow-hidden">
            <DeferredAdBanner
              placement="new_sidebar"
              variant="card"
              adIndex={0}
              maxItems={1}
              className="w-full flex justify-center"
            />
          </div>
        </div>

        {/* Grid Cards Below: 4 cards in 4-column grid */}
        {gridCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {gridCards.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* View All Bottom Bar */}
        <div className="mt-10 text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.16em] rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group"
          >
            View Full News Archive
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
}
