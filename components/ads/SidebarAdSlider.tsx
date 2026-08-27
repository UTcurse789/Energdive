"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { strapiImageUrl } from "@/lib/strapi-image";
import { useAdTracking } from "./useAdTracking";
import { isAdMatchingSector, getSectorsArray } from "@/lib/sector-content";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

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

function adHasRenderableMedia(ad: Ad): boolean {
    return Boolean(getImageUrl(getCreativeMedia(ad)));
}

interface SidebarAdSliderProps {
    placement?: string;
    sectorSlug?: string;
    slot: "top" | "bottom";
    className?: string;
}

export function SidebarAdSlider({
    placement = "new_sidebar",
    sectorSlug,
    slot,
    className = "",
}: SidebarAdSliderProps) {
    const [adsForSlot, setAdsForSlot] = useState<Ad[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        async function fetchAds() {
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
                if (!res.ok) return;
                const json = await res.json();
                let allAds: Ad[] = json.data || [];

                allAds = allAds.filter((ad) => {
                    if (ad.start_date && ad.start_date > now) return false;
                    if (ad.end_date && ad.end_date < now) return false;
                    return true;
                });

                allAds = allAds.filter(adHasRenderableMedia);

                if (sectorSlug) {
                    const matching = allAds.filter((ad) => isAdMatchingSector(ad, sectorSlug));
                    if (matching.length > 0) {
                        allAds = matching;
                    } else {
                        allAds = allAds.filter((a) => getSectorsArray(a).length === 0);
                    }
                }

                if (allAds.length === 0) {
                    setAdsForSlot([]);
                    return;
                }

                allAds.sort((a, b) => (b.priority ?? -1) - (a.priority ?? -1));

                const total = allAds.length;
                let assignedAds: Ad[] = [];

                if (total === 1) {
                    assignedAds = slot === "top" ? [allAds[0]] : [];
                } else if (total === 2) {
                    assignedAds = slot === "top" ? [allAds[0]] : [allAds[1]];
                } else if (total === 3) {
                    assignedAds = slot === "top" ? [allAds[0], allAds[1]] : [allAds[2]];
                } else if (total === 4) {
                    assignedAds = slot === "top" ? [allAds[0], allAds[1]] : [allAds[2], allAds[3]];
                } else {
                    const topCount = Math.ceil(total / 2);
                    assignedAds = slot === "top" ? allAds.slice(0, topCount) : allAds.slice(topCount);
                }

                setAdsForSlot(assignedAds);
            } catch (err) {
                console.error("[SidebarAdSlider] fetch error:", err);
                setAdsForSlot([]);
            }
        }

        fetchAds();
    }, [placement, sectorSlug, slot]);

    // Auto-slide carousel when slot has > 1 ad
    useEffect(() => {
        if (adsForSlot.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % adsForSlot.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [adsForSlot.length]);

    if (adsForSlot.length === 0) return null;

    const currentAd = adsForSlot[currentIndex] || adsForSlot[0];
    const creative = getCreativeMedia(currentAd);
    const imageUrl = getImageUrl(creative);

    if (!imageUrl) return null;

    return (
        <div className={`w-full flex flex-col items-center ${className}`}>
            <SingleCardAd ad={currentAd} imageUrl={imageUrl} />

            {/* Slider Dots Indicator if multiple ads */}
            {adsForSlot.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                    {adsForSlot.map((ad, idx) => (
                        <button
                            key={ad.id || idx}
                            onClick={() => setCurrentIndex(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentIndex
                                    ? "w-5 bg-emerald-600"
                                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SingleCardAd({ ad, imageUrl }: { ad: Ad; imageUrl: string }) {
    const { trackClick } = useAdTracking(ad.documentId);

    const inner = (
        <div className="relative mx-auto overflow-hidden bg-white group w-full max-w-[300px]">
            <div className="relative w-full aspect-[300/250]">
                <Image
                    src={imageUrl}
                    alt={ad.title || "Advertisement"}
                    fill
                    loading="lazy"
                    sizes="300px"
                    className="object-contain bg-white transition-transform duration-500 group-hover:scale-[1.02]"
                />
            </div>
        </div>
    );

    const url = (ad.target_url || "").trim();

    if (!url) {
        return <div onClickCapture={trackClick} className="w-full flex justify-center">{inner}</div>;
    }

    return (
        <div onClickCapture={trackClick} className="w-full flex justify-center">
            <a href={url} target="_blank" rel="noopener sponsored" className="block w-full max-w-[300px]">
                {inner}
            </a>
        </div>
    );
}
