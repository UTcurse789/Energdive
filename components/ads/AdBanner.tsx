"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "http://206.189.132.187:1337";

interface Ad {
    id: number;
    title: string;
    placement: string;
    partner_name: string | null;
    target_url: string | null;
    is_active: boolean;
    start_date: string;
    end_date: string;
    priority: number | null;
    logo: any[] | null;
    creative: any[] | null;
    sectors: any[];
}

function getImageUrl(media: any): string | null {
    if (!media) return null;
    const url =
        media.formats?.large?.url ||
        media.formats?.medium?.url ||
        media.formats?.small?.url ||
        media.url;
    if (!url) return null;
    return url.startsWith("http") ? url : `${STRAPI_BASE}${url}`;
}

interface AdBannerProps {
    placement: string;
    sectorSlug?: string;
    variant?: "banner" | "card" | "hero" | "vertical" | "native";
    className?: string;
}

/**
 * Client-side ad banner component.
 * Used in client components (header, sector pages, etc.)
 * where async server components can't be used.
 */
export function AdBanner({
    placement,
    sectorSlug,
    variant = "banner",
    className = "",
}: AdBannerProps) {
    const [ad, setAd] = useState<Ad | null>(null);

    useEffect(() => {
        async function fetchAd() {
            try {
                const now = new Date().toISOString().split("T")[0];
                let url =
                    `${STRAPI_BASE}/api/advertisements` +
                    `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
                    `&filters[is_active][$eq]=true` +
                    `&populate=*` +
                    `&sort=priority:desc`;

                if (sectorSlug) {
                    url += `&filters[sectors][slug][$eq]=${encodeURIComponent(sectorSlug)}`;
                }

                const res = await fetch(url);
                if (!res.ok) return;
                const json = await res.json();
                let ads: Ad[] = json.data || [];

                // Filter by date in code (null dates = always active)
                ads = ads.filter((ad) => {
                    if (ad.start_date && ad.start_date > now) return false;
                    if (ad.end_date && ad.end_date < now) return false;
                    return true;
                });

                // Fallback to placement-only if no sector match
                if (ads.length === 0 && sectorSlug) {
                    const fallbackUrl =
                        `${STRAPI_BASE}/api/advertisements` +
                        `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
                        `&filters[is_active][$eq]=true` +
                        `&populate=*` +
                        `&sort=priority:desc`;
                    const fallbackRes = await fetch(fallbackUrl);
                    if (fallbackRes.ok) {
                        const fallbackJson = await fallbackRes.json();
                        ads = fallbackJson.data || [];
                    }
                }

                if (ads.length > 0) {
                    // Sort by priority DESC
                    ads.sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));
                    setAd(ads[0]);
                }
            } catch (err) {
                console.error("[AdBanner] Failed to fetch ad:", err);
            }
        }

        fetchAd();
    }, [placement, sectorSlug]);

    if (!ad) return null;

    switch (variant) {
        case "banner":
            return <BannerAd ad={ad} className={className} />;
        case "card":
            return <CardAd ad={ad} className={className} />;
        case "hero":
            return <HeroBannerAd ad={ad} className={className} />;
        case "vertical":
            return <VerticalBannerAd ad={ad} className={className} />;
        case "native":
            return <NativeBannerAd ad={ad} className={className} />;
        default:
            return <BannerAd ad={ad} className={className} />;
    }
}

/* ═══════════════════════════════════════════
   BANNER — 728×90 / 900×90 header-style
   ═══════════════════════════════════════════ */

function BannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const content = (
        <div className={`flex justify-center ${className}`}>
            <div className="relative overflow-hidden rounded-lg" style={{ maxWidth: 728, width: "100%" }}>
                <div className="relative w-full" style={{ aspectRatio: "728/90" }}>
                    <Image
                        src={imageUrl}
                        alt={ad.title || "Advertisement"}
                        fill
                        loading="lazy"
                        className="object-cover"
                    />
                </div>
            </div>
        </div>
    );

    if (ad.target_url) {
        return (
            <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
                {content}
            </a>
        );
    }

    return content;
}

/* ═══════════════════════════════════════════
   CARD — 300×250 in-grid ad
   ═══════════════════════════════════════════ */

function CardAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const inner = (
        <div className={`relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100/60 group ${className}`}>
            <div className="relative w-full" style={{ aspectRatio: "300/250" }}>
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
            </div>
            <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full">
                Partner
            </span>
        </div>
    );

    if (ad.target_url) {
        return (
            <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
                {inner}
            </a>
        );
    }

    return inner;
}

/* ═══════════════════════════════════════════
   HERO BANNER — Full-width banner for pages
   ═══════════════════════════════════════════ */

function HeroBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const inner = (
        <div className={`relative w-full overflow-hidden rounded-2xl group ${className}`}>
            <div className="relative w-full" style={{ aspectRatio: "21/6" }}>
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                />
            </div>
            <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/70 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
                Partner
            </span>
        </div>
    );

    if (ad.target_url) {
        return (
            <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
                {inner}
            </a>
        );
    }

    return inner;
}

/* ═══════════════════════════════════════════
   VERTICAL — 300×600 vertical card
   ═══════════════════════════════════════════ */

function VerticalBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);
    const logoMedia = ad.logo?.[0];
    const logoUrl = getImageUrl(logoMedia);

    if (!imageUrl) return null;

    const inner = (
        <div
            className={`relative overflow-hidden rounded-2xl border border-gray-100/60 bg-white shadow-sm hover:shadow-xl transition-all duration-500 group ${className}`}
            style={{ width: "100%", maxWidth: 320 }}
        >
            <div className="relative w-full" style={{ aspectRatio: "300/600" }}>
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-center gap-3">
                {logoUrl && (
                    <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-white/90 shadow-sm ring-1 ring-white/30">
                        <Image src={logoUrl} alt={ad.partner_name || ""} fill className="object-contain p-0.5" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-300">Industry Partner</p>
                    <p className="text-sm font-semibold text-white truncate">{ad.partner_name || ad.title}</p>
                </div>
            </div>
            <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full">
                Partner
            </span>
        </div>
    );

    if (ad.target_url) {
        return (
            <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
                {inner}
            </a>
        );
    }

    return inner;
}

/* ═══════════════════════════════════════════
   NATIVE — Partner module with CTA
   ═══════════════════════════════════════════ */

function NativeBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const logoMedia = ad.logo?.[0];
    const logoUrl = getImageUrl(logoMedia);

    const inner = (
        <div className={`rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 group hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-500 ${className}`}>
            <div className="flex items-center gap-5">
                {logoUrl ? (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
                        <Image src={logoUrl} alt={ad.partner_name || ""} fill loading="lazy" className="object-contain p-1.5" />
                    </div>
                ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl">
                        {(ad.partner_name || ad.title || "P").charAt(0)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1">Industry Partner</p>
                    <p className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors truncate">{ad.partner_name || ad.title}</p>
                </div>
                <div className="shrink-0 hidden sm:flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-full group-hover:bg-teal-700 transition-colors shadow-sm">
                    Learn More
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );

    if (ad.target_url) {
        return (
            <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
                {inner}
            </a>
        );
    }

    return inner;
}
