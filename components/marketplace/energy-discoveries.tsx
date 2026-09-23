import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Newspaper, Calendar, Clock } from "lucide-react";
import { MarketplaceArticle } from "@/data/marketplace/types";

interface EnergyDiscoveriesProps {
  articles: MarketplaceArticle[];
}

export function EnergyDiscoveries({ articles }: EnergyDiscoveriesProps) {
  if (articles.length === 0) return null;

  const leadArticle = articles[0];
  const sideArticles = articles.slice(1, 3);

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            EDITORIAL PERSPECTIVE
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950">
            LATEST ENERGY DISCOVERIES
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            Market intelligence, procurement trends, and technological developments from the Energdive editorial desk.
          </p>
        </div>

        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
        >
          <span>All Editorial Coverage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Asymmetric Editorial Layout: 1 Large Lead Story + 2 Compact Side Stories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large Lead Story (7 cols) */}
        {leadArticle && (
          <Link
            href="/news"
            className="lg:col-span-7 group bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-[#00A651] hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative w-full aspect-16/9 bg-zinc-100 overflow-hidden">
              <Image
                src={leadArticle.image}
                alt={leadArticle.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded bg-[#00A651] text-white">
                  {leadArticle.category}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium mb-2.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {leadArticle.date}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {leadArticle.readTime}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-zinc-950 group-hover:text-[#00A651] transition-colors leading-snug mb-3">
                  {leadArticle.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed line-clamp-2">
                  {leadArticle.excerpt}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-900 group-hover:text-[#00A651] transition-colors">
                <span>Read Full Coverage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        {/* 2 Side Editorial Stories (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {sideArticles.map((article) => (
            <Link
              key={article.id}
              href="/news"
              className="group flex-1 bg-white border border-zinc-200/90 rounded-2xl p-5 sm:p-6 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00A651]">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {article.date}
                  </span>
                </div>
                <h4 className="text-base font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-2 mb-2">
                  {article.title}
                </h4>
                <p className="text-xs text-zinc-500 font-normal line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-700 group-hover:text-[#00A651] transition-colors">
                <span>Analysis</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
