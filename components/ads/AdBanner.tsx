"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { strapiImageUrl } from "@/lib/strapi-image";
import { useAdTracking } from "./useAdTracking";
import { isAdMatchingSector, getSectorsArray } from "@/lib/sector-content";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

interface StrapiMedia {
    url?: string;
    formats?: {
        large?: { url?: string };
        medium?: { url?: string };
        small?: { url?: string };
    };
}

interface Ad {
    id: number;
    documentId: string;
    title: string;
    placement: string;
    partner_name: string | null;
    target_url: string | null;
    is_active: boolean;
    start_date: string;
    end_date: string;
    priority: number | null;
    logo: any;
    creative: any;
    sectors: unknown[];
}

function getCreativeMedia(ad: any): any {
    if (!ad) return null;
    const creative = ad.creative;
    if (!creative) return null;
    if (Array.isArray(creative)) return creative[0] || null;
    if (creative.data) {
        if (Array.isArray(creative.data)) return creative.data[0] || null;
        return creative.data;
    }
    return creative;
}

function getLogoMedia(ad: any): any {
    if (!ad) return null;
    const logo = ad.logo;
    if (!logo) return null;
    if (Array.isArray(logo)) return logo[0] || null;
    if (logo.data) {
        if (Array.isArray(logo.data)) return logo.data[0] || null;
        return logo.data;
    }
    return logo;
}

function getImageUrl(media: any): string | null {
    if (!media) return null;
    const attrs = media.attributes || media;
    const url =
        attrs.url ||
        attrs.formats?.large?.url ||
        attrs.formats?.medium?.url ||
        attrs.formats?.small?.url;
    if (!url) return null;
    return strapiImageUrl(url);
}

interface AdBannerProps {
    placement: string;
    sectorSlug?: string;
    variant?: "banner" | "card" | "hero" | "vertical" | "native" | "mobile_banner";
    className?: string;
    showSkeleton?: boolean;
    maxItems?: number;
    width?: number;
    height?: number;
    adIndex?: number;
}

function adHasRenderableMedia(ad: Ad, variant: NonNullable<AdBannerProps["variant"]>): boolean {
    if (variant === "native") return true;
    return Boolean(getImageUrl(getCreativeMedia(ad)));
}

function getRotationStorageKey(placement: string, sectorSlug?: string): string {
    return `ad-rotation:${placement}:${sectorSlug || "global"}`;
}

function pickRotatingAds(
    ads: Ad[],
    placement: string,
    sectorSlug?: string,
    maxItems = 1
): Ad[] {
    if (ads.length === 0) return [];

    const itemCount = Math.max(1, Math.min(maxItems, ads.length));
    if (ads.length === 1) return ads.slice(0, itemCount);

    try {
        const storageKey = getRotationStorageKey(placement, sectorSlug);
        const lastAdId = window.sessionStorage.getItem(storageKey);
        const lastIndex = lastAdId
            ? ads.findIndex((ad) => String(ad.id) === lastAdId)
            : -1;
        const startIndex = (lastIndex + 1 + ads.length) % ads.length;
        const nextAds = Array.from({ length: itemCount }, (_, offset) => {
            const index = (startIndex + offset) % ads.length;
            return ads[index];
        });

        window.sessionStorage.setItem(storageKey, String(nextAds[nextAds.length - 1].id));
        return nextAds;
    } catch {
        return ads.slice(0, itemCount);
    }
}

function pickAdsToDisplay(
    ads: Ad[],
    placement: string,
    sectorSlug?: string,
    maxItems?: number
): Ad[] {
    if (ads.length === 0) return [];

    if (EXACT_LEADERBOARD_PLACEMENTS.has(placement)) {
        return pickRotatingAds(ads, placement, sectorSlug, maxItems ?? 1);
    }

    if (typeof maxItems !== "number" || maxItems < 1) {
        return ads;
    }

    return ads.slice(0, Math.min(maxItems, ads.length));
}

const EXACT_LEADERBOARD_PLACEMENTS = new Set([
    "sector_banner",
    "home_platform_hero",
    "new_top",
    "sector_hero",
]);

const EXACT_LEADERBOARD_SIZE = {
    width: 728,
    height: 90,
} as const;

const EXACT_VERTICAL_CARD_PLACEMENTS = new Set([
    "opinion_left",
    "opinion_right",
    "interview_left",
    "interview_right",
]);

const EXACT_VERTICAL_SIZE = {
    width: 300,
    height: 600,
} as const;

const EXACT_CARD_SIZE = {
    width: 300,
    height: 250,
} as const;

const CAROUSEL_PLACEMENTS = new Set([
    "home_featured_partner",
    "home_opinion",
    "home_interview",
]);

const AD_CAROUSEL_INTERVAL_MS = 2000;

export function AdBanner({
    placement,
    sectorSlug,
    variant = "banner",
    className = "",
    maxItems,
    width,
    height,
    adIndex,
}: AdBannerProps) {
    const [selectedAds, setSelectedAds] = useState<Ad[]>([]);
    const [activeAdIndex, setActiveAdIndex] = useState(0);

    useEffect(() => {
        async function fetchAd() {
            try {
                const nowDate = new Date();
                const year = nowDate.getFullYear();
                const month = String(nowDate.getMonth() + 1).padStart(2, "0");
                const day = String(nowDate.getDate()).padStart(2, "0");
                const now = `${year}-${month}-${day}`;

                const url =
                    `${STRAPI_BASE}/api/advertisements` +
                    `?filters[placement][$eq]=${encodeURIComponent(placement)}` +
                    `&filters[is_active][$eq]=true` +
                    `&populate=*` +
                    `&sort=priority:desc`;

                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`[AdBanner] Strapi error: ${res.status}`);
                    return;
                }
                const json = await res.json();
                let allAds: Ad[] = json.data || [];

                allAds = allAds.filter((ad) => {
                    if (ad.start_date && ad.start_date > now) return false;
                    if (ad.end_date && ad.end_date < now) return false;
                    return true;
                });

                allAds = allAds.filter((ad) => adHasRenderableMedia(ad, variant));

                let ads: Ad[] = [];
                if (sectorSlug) {
                    const matchingAds = allAds.filter((ad) => isAdMatchingSector(ad, sectorSlug));
                    if (matchingAds.length > 0) {
                        ads = matchingAds;
                    } else {
                        ads = allAds.filter((a) => {
                            const secs = getSectorsArray(a);
                            return secs.length === 0;
                        });
                    }
                } else {
                    ads = allAds;
                }

                if (ads.length > 0) {
                    ads.sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));
                    if (typeof adIndex === "number") {
                        const targetAd = ads[adIndex];
                        setSelectedAds(targetAd ? [targetAd] : []);
                    } else {
                        setSelectedAds(pickAdsToDisplay(ads, placement, sectorSlug, maxItems));
                    }
                } else {
                    setSelectedAds([]);
                }
            } catch (err) {
                console.error("[AdBanner] Failed to fetch ad:", err);
                setSelectedAds([]);
            }
        }

        fetchAd();
    }, [placement, sectorSlug, variant, maxItems, adIndex]);

    useEffect(() => {
        if (!CAROUSEL_PLACEMENTS.has(placement) || selectedAds.length <= 1) return;

        const intervalId = window.setInterval(() => {
            setActiveAdIndex((currentIndex) => (currentIndex + 1) % selectedAds.length);
        }, AD_CAROUSEL_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [placement, selectedAds.length]);

    if (selectedAds.length === 0) {
        return null;
    }

    function renderSelectedAds(renderAd: (ad: Ad, index: number) => React.ReactNode) {
        if (selectedAds.length === 1) {
            return (
                <TrackedAdWrapper ad={selectedAds[0]}>
                    {renderAd(selectedAds[0], 0)}
                </TrackedAdWrapper>
            );
        }

        if (CAROUSEL_PLACEMENTS.has(placement)) {
            const visibleAdIndex = selectedAds[activeAdIndex] ? activeAdIndex : 0;
            const activeAd = selectedAds[visibleAdIndex];

            return (
                <TrackedAdWrapper key={`${activeAd.id}-${visibleAdIndex}`} ad={activeAd}>
                    {renderAd(activeAd, visibleAdIndex)}
                </TrackedAdWrapper>
            );
        }

        return (
            <div className="space-y-6">
                {selectedAds.map((ad, index) => (
                    <TrackedAdWrapper key={`${ad.id}-${index}`} ad={ad}>
                        {renderAd(ad, index)}
                    </TrackedAdWrapper>
                ))}
            </div>
        );
    }

    switch (variant) {
        case "banner":
            return renderSelectedAds((ad) => <BannerAd ad={ad} placement={placement} className={className} />);
        case "card":
            return renderSelectedAds((ad) => <CardAd ad={ad} placement={placement} className={className} />);
        case "hero":
            return renderSelectedAds((ad) => <HeroBannerAd ad={ad} className={className} />);
        case "vertical":
            return renderSelectedAds((ad) => (
                <VerticalBannerAd
                    ad={ad}
                    className={className}
                    width={width}
                    height={height}
                />
            ));
        case "native":
            return renderSelectedAds((ad) => <NativeBannerAd ad={ad} className={className} />);
        case "mobile_banner":
            return renderSelectedAds((ad) => <MobileBannerAd ad={ad} className={className} />);
        default:
            return renderSelectedAds((ad) => <BannerAd ad={ad} placement={placement} className={className} />);
    }
}

function TrackedAdWrapper({ ad, children }: { ad: Ad; children: React.ReactNode }) {
    const { trackClick } = useAdTracking(ad.documentId);
    return (
        <div onClickCapture={trackClick}>
            {children}
        </div>
    );
}

function wrapWithLink(
    targetUrl: string | null | undefined,
    content: React.ReactNode,
    className = "block"
) {
    const url = (targetUrl || "").trim();
    if (!url) return <>{content}</>;
    return (
        <a href={url} target="_blank" rel="noopener sponsored" className={className}>
            {content}
        </a>
    );
}

function BannerAd({
    ad,
    placement,
    className,
}: {
    ad: Ad;
    placement: string;
    className: string;
}) {
    const creative = getCreativeMedia(ad);
    const imageUrl = getImageUrl(creative);
    const isExactSizedPlacement = EXACT_LEADERBOARD_PLACEMENTS.has(placement);

    if (!imageUrl) return null;

    if (isExactSizedPlacement) {
        const creativeContent = (
            <div className="relative w-full max-w-[728px] overflow-hidden rounded-none bg-white">
                <div className="relative w-full" style={{ aspectRatio: `${EXACT_LEADERBOARD_SIZE.width}/${EXACT_LEADERBOARD_SIZE.height}` }}>
                    <Image
                        src={imageUrl}
                        alt={ad.title || "Advertisement"}
                        fill
                        sizes="(max-width: 767px) 100vw, 728px"
                        loading="lazy"
                        unoptimized
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.015]"
                    />
                </div>
            </div>
        );

        return (
            <div className={`group w-full max-w-full overflow-hidden ${className}`}>
                <div className="mx-auto flex w-full max-w-[728px] justify-center overflow-hidden">
                    {wrapWithLink(ad.target_url, creativeContent, "block w-full max-w-[728px]")}
                </div>
            </div>
        );
    }

    const creativeContent = (
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
        </div>
    );

    return (
        <div className={`flex justify-center group ${className}`}>
            {wrapWithLink(ad.target_url, creativeContent, "block w-full max-w-[728px]")}
        </div>
    );
}

function CardAd({
    ad,
    placement,
    className,
}: {
    ad: Ad;
    placement: string;
    className: string;
}) {
    const creative = getCreativeMedia(ad);
    const imageUrl = getImageUrl(creative);
    const isExactVerticalCardPlacement = EXACT_VERTICAL_CARD_PLACEMENTS.has(placement);

    if (!imageUrl) return null;

    const inner = (
        <div
            className={`relative mx-auto overflow-hidden bg-white group ${className} rounded-none`}
            style={
                isExactVerticalCardPlacement
                    ? { width: EXACT_VERTICAL_SIZE.width, height: EXACT_VERTICAL_SIZE.height }
                    : { width: EXACT_CARD_SIZE.width, maxWidth: "100%" }
            }
        >
            <div
                className={`relative w-full ${isExactVerticalCardPlacement ? "h-full" : ""}`}
                style={isExactVerticalCardPlacement ? undefined : { aspectRatio: `${EXACT_CARD_SIZE.width}/${EXACT_CARD_SIZE.height}` }}
            >
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    loading="lazy"
                    unoptimized
                    className={`${isExactVerticalCardPlacement ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-[1.02]`}
                />
            </div>
        </div>
    );

    return wrapWithLink(ad.target_url, inner);
}

function HeroBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = getCreativeMedia(ad);
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const creativeContent = (
        <div className="relative inline-block rounded-none overflow-hidden">
            <Image
                src={imageUrl}
                alt={ad.title || "Advertisement"}
                width={0}
                height={0}
                sizes="100vw"
                loading="lazy"
                unoptimized
                className="max-w-full h-auto w-auto object-contain transition-transform duration-500 group-hover:scale-[1.015]"
            />
        </div>
    );

    return (
        <div className={`flex justify-center w-full group overflow-hidden ${className}`}>
            {wrapWithLink(ad.target_url, creativeContent, "inline-block")}
        </div>
    );
}

function VerticalBannerAd({
    ad,
    className,
    width = EXACT_VERTICAL_SIZE.width,
    height = EXACT_VERTICAL_SIZE.height,
}: {
    ad: Ad;
    className: string;
    width?: number;
    height?: number;
}) {
    const creative = getCreativeMedia(ad);
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const inner = (
        <div
            className={`relative w-full max-w-[300px] mx-auto overflow-hidden bg-white shadow-xs border border-slate-200/80 group ${className} rounded-xl`}
            style={{ aspectRatio: `${width}/${height}` }}
        >
            <Image
                src={imageUrl}
                alt={ad.title || "Advertisement"}
                fill
                sizes="(max-width: 1024px) 300px, 300px"
                loading="lazy"
                unoptimized
                className="object-cover"
            />
        </div>
    );

    return wrapWithLink(ad.target_url, inner, "block w-full flex justify-center");
}

function NativeBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const logoMedia = getLogoMedia(ad);
    const logoUrl = getImageUrl(logoMedia);

    const inner = (
        <div className={`relative border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 group hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-500 ${className} rounded-none`}>
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

function MobileBannerAd({ ad, className }: { ad: Ad; className: string }) {
    const creative = getCreativeMedia(ad);
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    const creativeContent = (
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
        </div>
    );

    return (
        <div className={`flex justify-center group ${className}`}>
            {wrapWithLink(ad.target_url, creativeContent, "block w-full max-w-[320px]")}
        </div>
    );
}
