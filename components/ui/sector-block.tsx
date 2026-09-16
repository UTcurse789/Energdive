import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Article } from "@/types";

interface SectorBlockProps {
    title: string;
    slug: string;
    articles: Article[];
}

export function SectorBlock({ title, slug, articles }: SectorBlockProps) {
    if (!articles || articles.length === 0) return null;

    return (
        <section className="py-3 sm:py-4 border-b border-slate-200">
            {/* Section Header: Title > */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-4">
                <Link
                    href={`/sectors/${slug}`}
                    className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-emerald-600 transition-colors"
                >
                    {title}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-900 group-hover:text-emerald-600 transition-colors stroke-[2.5]" />
                </Link>
            </div>

            {/* Grid Row of Cards (Image Top + Title Below) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {articles.slice(0, 4).map((article, i) => (
                    <article key={i} className="group flex flex-col">
                        {/* Thumbnail Image */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100 mb-2 border border-slate-200 shadow-xs">
                            <Image
                                src={article.image}
                                alt={article.title}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Date Above Title */}
                        {article.date && (
                            <time
                                dateTime={article.date}
                                className="mt-1.5 mb-1 block text-[10px] text-slate-600 font-semibold uppercase tracking-wide"
                            >
                                {article.date}
                            </time>
                        )}
                        <Link href={article.href || "#"} className="group">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-3">
                                {article.title}
                            </h3>
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}
