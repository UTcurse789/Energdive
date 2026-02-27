"use client";

import { useEffect, useState } from "react";
import MagicBento from '../MagicBento';
import { cn } from "@/lib/utils";

const STRAPI_BASE = "http://206.189.132.187:1337";
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
    image: string;
    slug: string;
    excerpt: string;
    description?: string;
    label?: string;
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
    return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
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
        ...item,
        title: item.title,
        description: item.excerpt || item.description || "",
        label: item.category || item.label || "Energy",
        image: item.image,
        slug: item.slug,
        href: `/news/${item.slug}`,
        color: item.color || "#060010",
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

        const fetchAndRandomize = async () => {
            try {
                const res = await fetch(API_URL);
                const json = await res.json();
                const data: any[] = json.data || [];

                const mapped = data.map((article: any) => {
                    const bentoItem = {
                        id: article.id,
                        title: article.Title || "",
                        category: article.sectors?.[0]?.name || "Energy",
                        image: extractImageUrl(article),
                        slug: article.slug || "",
                        excerpt: extractExcerpt(article),
                    };
                    return formatBentoItem(bentoItem);
                });

                const randomSelection = mapped
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 6);

                setItems(randomSelection);
            } catch (err) {
                console.error("Bento fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndRandomize();
    }, [propItems]);

    const bentoConfig = {
        items,
        textAutoHide: true,
        enableStars: true,
        enableSpotlight: true,
        enableBorderGlow: true,
        enableTilt: false,
        enableMagnetism: false,
        clickEffect: true,
        spotlightRadius: 400,
        particleCount: 12,
        glowColor: "9, 182, 151",
        disableAnimations: false,
        // Passing image fit classes if the component supports it
        imgClassName: "object-cover w-full h-full block",
    };

    if (loading) return (
        <div className="container mx-auto px-4 py-20 flex justify-center">
            <div className="h-[600px] max-w-7xl bg-slate-100 animate-pulse rounded-3xl w-full" />
        </div>
    );

    return (
        <section className={cn("w-full py-12", className)}>
            {/* CSS Hack to ensure images fill their parent blocks within MagicBento */}
            <style jsx global>{`
            .magic-bento-container {
  width: 100% !important;
  max-width: 100% !important;
}
                .magic-bento-container img, 
                [data-bento-grid] img {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                    display: block !important;
                }
            `}</style>

            <div className="w-full">
                <div className="w-full transition-all duration-1000 ease-in-out">
                    <MagicBento {...bentoConfig} />
                </div>
            </div>
        </section>
    );
}