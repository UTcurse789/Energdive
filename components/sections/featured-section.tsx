"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatContentDate } from "@/lib/date";
import { buildContentUrl } from "@/lib/content-routes";
import type { BentoItem } from "./hero";

// ── Types ────────────────────────────────────────────────────────────────────

interface StrapiMedia {
  url?: string;
  formats?: {
    large?: { url?: string };
    medium?: { url?: string };
    small?: { url?: string };
  };
}

interface PartnerAd {
  id: number;
  title: string;
  target_url: string | null;
  creative: StrapiMedia[] | null;
}

interface FeaturedSectionProps {
  articles: BentoItem[];
  partnerAds?: PartnerAd[];
}

function getAdImageUrl(media: StrapiMedia | undefined | null): string | null {
  if (!media) return null;
  const url =
    media.url ||
    media.formats?.large?.url ||
    media.formats?.medium?.url ||
    media.formats?.small?.url;
  return url || null;
}

// ── Rotating Ad Component ─────────────────────────────────────────────────────

function RotatingPartnerAd({ ads }: { ads: PartnerAd[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % ads.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (!ads.length) return null;

  const ad = ads[idx];
  const imageUrl = getAdImageUrl(ad.creative?.[0]);
  if (!imageUrl) return null;

  const inner = (
    <div className="relative w-full max-w-[300px] mx-auto overflow-hidden shadow-sm">
      <Image
        src={imageUrl}
        alt={ad.title || "Advertisement"}
        width={300}
        height={600}
        className="w-full h-auto object-contain"
      />
    </div>
  );

  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener sponsored"
        className="block w-full"
      >
        {inner}
      </a>
    );
  }

  return <>{inner}</>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FeaturedSection({ articles, partnerAds = [] }: FeaturedSectionProps) {
  if (!articles || articles.length === 0) return null;

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 5);

  return (
    <section className="bg-white py-8 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Left Side: Featured Content (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Section Heading */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-emerald-700 rounded-sm" />
              <h2
                className="text-[17px] font-black uppercase tracking-widest text-slate-900"
                style={{ fontFamily: "var(--font-playfair, serif)" }}
              >
                Featured
              </h2>
            </div>
            <div className="h-0.5 w-full bg-slate-100 mb-6 relative">
              <div className="absolute top-0 left-0 h-full w-24 bg-emerald-700" />
            </div>

            {/* Inner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Main Big Card */}
              {mainArticle && (
                <div className="md:col-span-6 flex flex-col">
                  <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 h-full">
                    <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={mainArticle.image}
                        alt={mainArticle.title}
                        fill
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 45vw"
                        priority
                      />
                      {mainArticle.category && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-3 py-1 bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
                            {mainArticle.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <Link
                          href={
                            mainArticle.href ||
                            buildContentUrl({
                              slug: mainArticle.slug,
                              type_of_content: { name: mainArticle.contentType },
                            })
                          }
                        >
                          <h3
                            className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors mb-2.5"
                            style={{ fontFamily: "var(--font-playfair, serif)" }}
                          >
                            {mainArticle.title}
                          </h3>
                        </Link>
                        {mainArticle.excerpt && (
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-4">
                            {mainArticle.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 pt-3 border-t border-slate-100 mt-auto">
                        <time dateTime={mainArticle.date}>
                          {formatContentDate(mainArticle.date || "")}
                        </time>
                      </div>
                    </div>
                  </article>
                </div>
              )}

              {/* Side Stacked Cards (2 Rows x 2 Columns in Latest News Card Style) */}
              <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sideArticles.map((article, idx) => (
                  <article
                    key={article.id || idx}
                    className="group flex flex-col bg-white rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 h-full"
                  >
                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      {article.category && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs">
                            {article.category}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-1 min-w-0">
                      <Link
                        href={
                          article.href ||
                          buildContentUrl({
                            slug: article.slug,
                            type_of_content: { name: article.contentType },
                          })
                        }
                      >
                        <h3
                          className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors mb-2"
                          style={{ fontFamily: "var(--font-playfair, serif)" }}
                        >
                          {article.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold pt-2 border-t border-slate-100 mt-auto">
                        <time dateTime={article.date}>
                          {formatContentDate(article.date || "")}
                        </time>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Partner Ad (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col">
            {partnerAds.length > 0 && (
              <div className="w-full flex justify-center items-start">
                <RotatingPartnerAd ads={partnerAds} />
              </div>
            )}
          </aside>

        </div>
      </div>
    </section>
  );
}
