"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { buildContentUrl } from "@/lib/content-routes";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = "https://cms.energdive.com";
const API_URL =
    `${STRAPI_BASE}/api/contents` +
    `?filters[$and][0][type_of_content][name][$eq]=News` +
    `&pagination[pageSize]=20` +
    `&populate[FeaturedImage]=*` +
    `&populate[sectors]=*` +
    `&populate[tags]=*` +
    `&populate[type_of_content]=*` +
    `&populate[author][populate][avatar]=*`;

export interface BentoItem {
    id: string | number;
    title: string;
    category: string;
    contentType?: string;
    contentTag?: any;
    image: string;
    slug: string;
    excerpt: string;
    description?: string;
    label?: string;
    authorName?: string;
    date?: string;
}

interface BentoGridProps {
    items?: BentoItem[];
    className?: string;
}

function extractImageUrl(article: any): string {
    const img = article.FeaturedImage;
    if (!img) return "/magazine-default.jpg";
    const url =
        img.formats?.large?.url ||
        img.formats?.medium?.url ||
        img.formats?.small?.url ||
        img.url;
    if (!url) return "/magazine-default.jpg";
    return strapiImageUrl(url);
}

function extractExcerpt(article: any): string {
    const excerpt = article.Excerpt;
    if (!excerpt || !Array.isArray(excerpt)) return "";
    return excerpt
        .map((block: any) =>
            (block.children || []).map((child: any) => child.text || "").join("")
        )
        .filter(Boolean)
        .join(" ")
        .trim();
}

export function BentoGrid({ items: propItems, className }: BentoGridProps) {
    const formatBentoItem = (item: any) => ({
        id: item.id || item.documentId,
        title: item.title || item.Title || "",
        category: item.category || item.sectors?.[0]?.name || item.label || "Energy",
        contentType: item.contentType || item.type_of_content?.name || "News",
        contentTag: item.contentTag,
        image: item.image || extractImageUrl(item),
        slug: item.slug || "",
        excerpt: item.excerpt || extractExcerpt(item) || "Key market intelligence, policy analysis, and strategic developments shaping the future of global energy.",
        authorName: item.authorName || item.author?.name || "Energy Dive Intelligence",
        href: item.href || buildContentUrl({ slug: item.slug, contentType: item.contentType, content_tag: item.contentTag }),
    });

    const [items, setItems] = useState<any[]>(
        propItems ? propItems.map(formatBentoItem) : []
    );
    const [loading, setLoading] = useState(!propItems);

    useEffect(() => {
        if (propItems) {
            setItems(propItems.map(formatBentoItem));
            setLoading(false);
            return;
        }

        const fetchArticles = async () => {
            try {
                const res = await fetch(API_URL);
                const json = await res.json();
                const data: any[] = json.data || [];

                const mapped = data.map((article: any) => formatBentoItem(article));
                setItems(mapped.slice(0, 4));
            } catch (err) {
                console.error("Bento fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [propItems]);

    if (loading) {
        return (
            <div className="w-full divide-y divide-slate-100 py-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="py-6 flex items-center justify-between gap-6 animate-pulse">
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-slate-100 rounded w-3/4" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                            <div className="h-3 bg-slate-100 rounded w-1/4" />
                        </div>
                        <div className="w-[180px] h-[115px] bg-slate-100 rounded-md shrink-0" />
                    </div>
                ))}
            </div>
        );
    }

    const displayItems = items.slice(0, 6);

    return (
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-6", className)}>
            {displayItems.map((item, idx) => (
                <Link
                    key={item.id || idx}
                    href={item.href || buildContentUrl({ slug: item.slug, contentType: item.contentType, content_tag: item.contentTag })}
                    className="group flex flex-col justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500/40 hover:shadow-md transition-all"
                >
                    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-slate-100 mb-3 border border-slate-100">
                        <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 350px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.category && (
                            <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">
                                {item.category}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-sm sm:text-base leading-snug text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1.5">
                                {item.title}
                            </h3>
                            {item.excerpt && (
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                                    {item.excerpt}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100 mt-auto">
                            <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                {item.authorName || "ENERGDIVE Desk"}
                            </span>
                            {item.date && (
                                <time dateTime={item.date} className="shrink-0 text-slate-400">
                                    {item.date}
                                </time>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
