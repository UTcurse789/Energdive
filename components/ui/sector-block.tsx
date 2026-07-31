import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Article } from "@/types";

interface SectorBlockProps {
    title: string;
    slug: string;
    articles: Article[];
}

export function SectorBlock({ title, slug, articles }: SectorBlockProps) {
    if (!articles || articles.length === 0) return null;
    const leadArticle = articles[0];
    const subArticles = articles.slice(1, 4);

    return (
        <section className="py-10 border-b border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-emerald-600">
                <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 bg-emerald-600 rounded-sm" />
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                        {title}
                    </h2>
                </div>
                <Link
                    href={`/sectors/${slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                    Explore {title}
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* 1 Main Highlighted Feature Card (7 Columns) */}
                <article className="lg:col-span-7 flex flex-col group">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-900 mb-4 border border-slate-200 shadow-sm">
                        <Image
                            src={leadArticle.image}
                            alt={leadArticle.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 58vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md">
                            {title}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <Link href={leadArticle.href || "#"} className="group-hover:text-emerald-600 transition-colors">
                            <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-tight mb-2">
                                {leadArticle.title}
                            </h3>
                        </Link>
                        {leadArticle.excerpt && (
                            <p className="text-sm text-slate-600 font-serif line-clamp-2 mb-3 leading-relaxed">
                                {leadArticle.excerpt}
                            </p>
                        )}
                        <div className="mt-auto flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="font-bold text-slate-800">{leadArticle.author?.name || "ENERGDIVE Desk"}</span>
                            <span>•</span>
                            <time dateTime={leadArticle.date}>{leadArticle.date}</time>
                        </div>
                    </div>
                </article>

                {/* 3 Stacked Horizontal Mini-cards (5 Columns) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {subArticles.map((article, i) => (
                        <article key={i} className="flex gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 hover:bg-white hover:shadow-md transition-all group">
                            <div className="relative w-28 sm:w-32 aspect-[4/3] shrink-0 overflow-hidden rounded-lg bg-slate-200 border border-slate-100">
                                <Image
                                    src={article.image}
                                    alt={article.title}
                                    fill
                                    sizes="128px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <Link href={article.href || "#"} className="group-hover:text-emerald-600 transition-colors">
                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                                        {article.title}
                                    </h4>
                                </Link>
                                <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-2">
                                    <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider">{title}</span>
                                    <span>•</span>
                                    <time dateTime={article.date}>{article.date}</time>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
