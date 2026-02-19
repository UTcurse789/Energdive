"use client";

import { useEffect, useState } from "react";
import MagicBento from '../MagicBento';
import { SectionHeading } from "./section-heading";

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
    /** * FIX 1: Ensure 'image' and 'slug' are explicitly included.
     * Some MagicBento implementations look for 'description' instead of 'excerpt'.
     */
    const formatBentoItem = (item: any) => ({
        ...item,
        title: item.title,
        description: item.excerpt || item.description || "",
        label: item.category || item.label || "Energy",
        image: item.image, // CRITICAL: Ensure image URL is passed
        slug: item.slug,   // CRITICAL: Ensure slug is passed for linking
        href: `/news/${item.slug}`, // Extra helper for some MagicBento link logic
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

    // Shared MagicBento Config
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
    };

    if (loading) return (
        <div className="container mx-auto px-4 py-20">
            <div className="h-[600px] bg-slate-50 animate-pulse rounded-3xl w-full" />
        </div>
    );

    return (
        <section className={`py-24 bg-white relative overflow-hidden ${className || ""}`}>
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(#09B697 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="container px-4 mx-auto relative z-10">
                <div className="transition-all duration-1000 ease-in-out">
                    <MagicBento {...bentoConfig} />
                </div>
            </div>
        </section>
    );
}