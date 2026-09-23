import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { MarketplaceArticle } from "@/data/marketplace/types";

interface MarketplaceArticleCardProps {
  article: MarketplaceArticle;
}

export function MarketplaceArticleCard({ article }: MarketplaceArticleCardProps) {
  return (
    <div className="group bg-white border border-zinc-200/90 rounded-xl overflow-hidden hover:border-[#00A651] hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full">
      <Link
        href={`/news`}
        className="relative w-full aspect-16/10 bg-zinc-100 overflow-hidden block"
      >
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-black/80 text-white backdrop-blur-xs">
            {article.category}
          </span>
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-2">
            <span>{article.date}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTime}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-2">
            <Link href="/news">
              {article.title}
            </Link>
          </h3>

          <p className="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        <div className="mt-4 pt-3.5 border-t border-zinc-100">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 group-hover:text-[#00A651] uppercase tracking-wider transition-colors"
          >
            <span>Read More</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
