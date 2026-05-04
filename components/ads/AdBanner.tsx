"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

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
    return strapiImageUrl(url);
}

interface AdBannerProps {
    placement: string;
    sectorSlug?: string;
    variant?: "banner" | "card" | "hero" | "vertical" | "native" | "mobile_banner";
    className?: string;
    showSkeleton?: boolean;
}

function adHasRenderableMedia(ad: Ad, variant: NonNullable<AdBannerProps["variant"]>): boolean {
    if (variant === "native") return true;
    return Boolean(getImageUrl(ad.creative?.[0]));
}

function getRotationStorageKey(placement: string, sectorSlug?: string): string {
    return `ad-rotation:${placement}:${sectorSlug || "global"}`;
}

function pickRotatingAd(ads: Ad[], placement: string, sectorSlug?: string): Ad | null {
    if (ads.length === 0) return null;
    if (ads.length === 1) return ads[0];

    try {
        const storageKey = getRotationStorageKey(placement, sectorSlug);
        const lastAdId = window.sessionStorage.getItem(storageKey);
        const lastIndex = lastAdId
            ? ads.findIndex((ad) => String(ad.id) === lastAdId)
            : -1;
        const nextIndex = (lastIndex + 1 + ads.length) % ads.length;
        const nextAd = ads[nextIndex];

        window.sessionStorage.setItem(storageKey, String(nextAd.id));
        return nextAd;
    } catch {
        return ads[0];
    }
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
                // Use local date to avoid UTC timezone mismatch
                const nowDate = new Date();
                const year = nowDate.getFullYear();
                const month = String(nowDate.getMonth() + 1).padStart(2, "0");
                const day = String(nowDate.getDate()).padStart(2, "0");
                const now = `${year}-${month}-${day}`;

                let url =
                    `${STRAPI_BASE}/api/advertisements` +
                    `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
                    `&filters[is_active][$eq]=true` +
                    `&populate=*` +
                    `&sort=priority:desc`;

                if (sectorSlug) {
                    url += `&filters[sectors][slug][$eq]=${encodeURIComponent(sectorSlug)}`;
                }

                console.log(`[AdBanner] Fetching: placement=${placement}, today=${now}`);

                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`[AdBanner] Strapi error: ${res.status}`);
                    return;
                }
                const json = await res.json();
                let ads: Ad[] = json.data || [];

                console.log(`[AdBanner] Raw ads: ${ads.length} for "${placement}"`);

                // Filter by date in code (null/empty dates = always active)
                ads = ads.filter((ad) => {
                    if (ad.start_date && ad.start_date > now) return false;
                    if (ad.end_date && ad.end_date < now) return false;
                    return true;
                });

                console.log(`[AdBanner] After date filter: ${ads.length} ads`);

                // Fallback to global (no-sector) ads if no sector match
                if (ads.length === 0 && sectorSlug) {
                    console.log(`[AdBanner] No sector-specific ads, falling back to global ads only`);
                    const fallbackUrl =
                        `${STRAPI_BASE}/api/advertisements` +
                        `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
                        `&filters[is_active][$eq]=true` +
                        `&populate=*` +
                        `&sort=priority:desc`;
                    const fallbackRes = await fetch(fallbackUrl);
                    if (fallbackRes.ok) {
                        const fallbackJson = await fallbackRes.json();
                        const allAds: Ad[] = fallbackJson.data || [];
                        // Only keep ads that have NO sectors assigned (global/untargeted ads)
                        ads = allAds.filter((a) => !a.sectors || a.sectors.length === 0);
                    }
                }

                ads = ads.filter((ad) => adHasRenderableMedia(ad, variant));

                if (ads.length > 0) {
                    // Sort by priority DESC
                    ads.sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));
                    setAd(pickRotatingAd(ads, placement, sectorSlug));
                } else {
                    setAd(null);
                }
            } catch (err) {
                console.error("[AdBanner] Failed to fetch ad:", err);
                setAd(null);
            }
        }

        fetchAd();
    }, [placement, sectorSlug, variant]);

    if (!ad) {
        return null;
    }

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
        case "mobile_banner":
            return <MobileBannerAd ad={ad} className={className} />;
        default:
            return <BannerAd ad={ad} className={className} />;
    }
}

/** Wraps content in a clickable link if target_url is present */
function wrapWithLink(targetUrl: string | null | undefined, content: React.ReactNode) {
    const url = (targetUrl || "").trim();
    if (!url) return <>{content}</>;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer sponsored" className="block">
            {content}
        </a>
    );
}

/* ═══════════════════════════════════════════
   BANNER — 728×90 / 900×90 header-style
   ═══════════════════════════════════════════ */

function BannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const content = (
        <div className={`flex justify-center group ${className}`}>
            <div className="relative overflow-hidden rounded-none bg-white" style={{ maxWidth: 728, width: "100%" }}>
                <div className="relative w-full bg-white" style={{ aspectRatio: "728/90" }}>
                    <Image
                        src={imageUrl}
                        alt={ad.title || "Advertisement"}
                        fill
                        loading="lazy"
                        unoptimized
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.015]"
                    />
                </div>
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-[0.15em] text-white/80 bg-black/25 backdrop-blur-md px-2 py-0.5 rounded-full pointer-events-none">
                    Sponsored
                </span>
            </div>
        </div>
    );

    return wrapWithLink(ad.target_url, content);
}

/* ═══════════════════════════════════════════
   CARD — 300×250 in-grid ad
   ═══════════════════════════════════════════ */

function CardAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const inner = (
        <div className={`relative overflow-hidden bg-white shadow-sm border border-gray-100/60 group h-fit ${className} rounded-none`}>
            <div className="relative w-full" style={{ aspectRatio: "300/250" }}>
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    loading="lazy"
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
            </div>
            <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-none">
                Sponsored
            </span>
        </div>
    );

    return wrapWithLink(ad.target_url, inner);
}

/* ═══════════════════════════════════════════
   HERO BANNER — Full-width banner for pages
   ═══════════════════════════════════════════ */

function HeroBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const inner = (
        <div className={`flex justify-center w-full group overflow-hidden ${className}`}>
            <div className="relative inline-block rounded-none overflow-hidden">
                <img
                    src={imageUrl}
                    alt={ad.title || "Advertisement"}
                    loading="lazy"
                    className="max-w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.015]"
                />
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-none">
                    Sponsored
                </span>
            </div>
        </div>
    );

    return wrapWithLink(ad.target_url, inner);
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
            className={`relative overflow-hidden border border-gray-100/60 bg-white shadow-sm hover:shadow-xl transition-all duration-500 group w-[300px] shrink-0 ${className} rounded-none`}
        >
            <div className="relative w-full" style={{ aspectRatio: "300/600" }}>
                <Image
                    src={imageUrl}
                    alt={ad.title || "Advertisement"}
                    fill
                    loading="lazy"
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-center gap-3">
                {logoUrl && (
                    <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-white/90 shadow-sm ring-1 ring-white/30">
                        <Image src={logoUrl} alt={ad.partner_name || ""} fill unoptimized className="object-contain p-0.5" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ad.partner_name || ad.title}</p>
                </div>
            </div>
            <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/80 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full pointer-events-none">
                Sponsored
            </span>
        </div>
    );

    return wrapWithLink(ad.target_url, inner);
}

/* ═══════════════════════════════════════════
   NATIVE — Partner module with CTA
   ═══════════════════════════════════════════ */

function NativeBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const logoMedia = ad.logo?.[0];
    const logoUrl = getImageUrl(logoMedia);

    const inner = (
        <div className={`relative border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 group hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-500 ${className} rounded-none`}>
            <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                Sponsored
            </span>
            <div className="flex items-center gap-5">
                {logoUrl ? (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
                        <Image src={logoUrl} alt={ad.partner_name || ""} fill loading="lazy" unoptimized className="object-contain p-1.5" />
                    </div>
                ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl">
                        {(ad.partner_name || ad.title || "P").charAt(0)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
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

    return wrapWithLink(ad.target_url, inner);
}

/* ═══════════════════════════════════════════
   MOBILE BANNER — 320×100 mobile leaderboard
   ═══════════════════════════════════════════ */

function MobileBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const content = (
        <div className={`flex justify-center group ${className}`}>
            <div className="relative overflow-hidden rounded-none" style={{ maxWidth: 320, width: "100%" }}>
                <div className="relative w-full" style={{ aspectRatio: "320/100" }}>
                    <Image
                        src={imageUrl}
                        alt={ad.title || "Advertisement"}
                        fill
                        loading="lazy"
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                    />
                </div>
                <span className="absolute top-1.5 right-1.5 text-[7px] font-bold uppercase tracking-[0.15em] text-white/70 bg-black/25 backdrop-blur-md px-1.5 py-0.5 rounded-full pointer-events-none">
                    Sponsored
                </span>
            </div>
        </div>
    );

    return wrapWithLink(ad.target_url, content);
}
