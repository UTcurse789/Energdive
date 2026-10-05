import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { MarketplaceArticle } from "@/data/marketplace/types";

interface EnergyDiscoveriesProps {
  articles: MarketplaceArticle[];
}

export function EnergyDiscoveries({ articles }: EnergyDiscoveriesProps) {
  if (articles.length === 0) return null;

  const displayArticles = articles.slice(0, 4);

  return (
    <section className="max-w-[1240px] mx-auto px-6 sm:px-6 lg:px-8 font-sans">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            EDITORIAL PERSPECTIVE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
            LATEST ENERGY DISCOVERIES
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            Market intelligence, procurement trends, and technological developments from the Energdive editorial desk.
          </p>
        </div>

        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors shrink-0"
        >
          <span>All Energy News</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column Grid: 4 Articles per Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayArticles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="group bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-[#00A651] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Article Featured Image */}
              <div className="relative w-full aspect-16/10 bg-zinc-100 overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#00A651] text-white shadow-2xs">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5">
                <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 font-medium mb-2.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {article.date}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-950 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-2 mb-2">
                  {article.title}
                </h3>

                <p className="text-xs text-zinc-600 font-normal leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-900 group-hover:text-[#00A651] transition-colors mt-auto">
              <span>Read News</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
