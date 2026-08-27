import Image from "next/image";
import { getAdvertisements, getAdImageUrl, type Advertisement } from "@/lib/api/getAdvertisements";

interface AdRendererProps {
    placement: string;
    sectorSlug?: string;
    variant?: "hero" | "vertical" | "native" | "banner" | "card";
    className?: string;
    adIndex?: number;
    limit?: number;
}

/**
 * Server Component that renders premium native ad placements.
 * Fetches ads from Strapi based on placement and optional sector.
 */
export async function AdRenderer({
    placement,
    sectorSlug,
    variant = "native",
    className = "",
    adIndex,
    limit,
}: AdRendererProps) {
    let ads = await getAdvertisements({ placement, sectorSlug });

    if (!ads.length) return null;

    if (typeof adIndex === "number") {
        const targetAd = ads[adIndex] || ads[adIndex % ads.length];
        ads = targetAd ? [targetAd] : [];
    } else if (limit && limit > 0) {
        ads = ads.slice(0, limit);
    }

    if (!ads.length) return null;

    return (
        <div className="space-y-6 w-full">
            {ads.map((ad) => {
                switch (variant) {
                    case "hero":
                        return <HeroAd key={ad.id} ad={ad} className={className} />;
                    case "vertical":
                        return <VerticalAd key={ad.id} ad={ad} className={className} />;
                    case "banner":
                        return <BannerAdServer key={ad.id} ad={ad} className={className} />;
                    case "card":
                        return <CardAdServer key={ad.id} ad={ad} className={className} />;
                    case "native":
                    default:
                        return <NativeAd key={ad.id} ad={ad} className={className} />;
                }
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   HERO — Full-width banner
   ═══════════════════════════════════════════════════════ */

function HeroAd({ ad, className = "" }: { ad: Advertisement; className?: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getAdImageUrl(creative);

    if (!imageUrl) return null;

    const Wrapper = ad.target_url ? "a" : "div";
    const wrapperProps = ad.target_url
        ? { href: ad.target_url, target: "_blank" as const, rel: "noopener sponsored" }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={`block relative w-full overflow-hidden group rounded-none ${className}`}
            style={{ minHeight: 200 }}
        >
            <div className="relative w-full aspect-[21/6]">
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                />
            </div>
        </Wrapper>
    );
}

/* ═══════════════════════════════════════════════════════
   VERTICAL — 300×600 style card for Featured grid
   ═══════════════════════════════════════════════════════ */

function VerticalAd({ ad, className = "" }: { ad: Advertisement; className?: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getAdImageUrl(creative);
    const logoMedia = ad.logo?.[0];
    const logoUrl = getAdImageUrl(logoMedia);

    if (!imageUrl) return null;

    const Wrapper = ad.target_url ? "a" : "div";
    const wrapperProps = ad.target_url
        ? { href: ad.target_url, target: "_blank" as const, rel: "noopener sponsored" }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            className="block relative overflow-hidden border border-gray-100/60 bg-white shadow-sm hover:shadow-xl transition-all duration-500 group rounded-none"
            style={{ width: "100%", maxWidth: 320 }}
        >
            {/* Creative image */}
            <div className="relative w-full" style={{ aspectRatio: "300/600" }}>
                <Image
                    src={imageUrl}
                    alt={ad.title || "Industry Partner"}
                    fill
                    sizes="320px"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-center gap-3">
                {logoUrl && (
                    <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-white/90 shadow-sm ring-1 ring-white/30">
                        <Image
                            src={logoUrl}
                            alt={ad.partner_name || ""}
                            fill
                            unoptimized
                            className="object-contain p-0.5"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-300">
                        Industry Partner
                    </p>
                    <p className="text-sm font-semibold text-white truncate">
                        {ad.partner_name || ad.title}
                    </p>
                </div>
            </div>
        </Wrapper>
    );
}

/* ═══════════════════════════════════════════════════════
   NATIVE — End-of-article partner module
   ═══════════════════════════════════════════════════════ */

function NativeAd({ ad, className = "" }: { ad: Advertisement; className?: string }) {
    const logoMedia = ad.logo?.[0];
    const logoUrl = getAdImageUrl(logoMedia);

    const Wrapper = ad.target_url ? "a" : "div";
    const wrapperProps = ad.target_url
        ? { href: ad.target_url, target: "_blank" as const, rel: "noopener sponsored" }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            className="block mt-12 border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 group hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-500 rounded-none"
        >
            <div className="flex items-center gap-5">
                {/* Logo */}
                {logoUrl ? (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
                        <Image
                            src={logoUrl}
                            alt={ad.partner_name || ""}
                            fill
                            loading="lazy"
                            unoptimized
                            className="object-contain p-1.5"
                        />
                    </div>
                ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl">
                        {(ad.partner_name || ad.title || "P").charAt(0)}
                    </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1">
                        Industry Partner
                    </p>
                    <p className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                        {ad.partner_name || ad.title}
                    </p>
                    {ad.title && ad.partner_name && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{ad.title}</p>
                    )}
                </div>

                {/* CTA */}
                <div className="shrink-0 hidden sm:flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-full group-hover:bg-teal-700 transition-colors shadow-sm">
                    Learn More
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Wrapper>
    );
}

/* ═══════════════════════════════════════════════════════
   BANNER SERVER — 728×90 leaderboard (Server Component)
   ═══════════════════════════════════════════════════════ */

function BannerAdServer({ ad, className = "" }: { ad: Advertisement; className?: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getAdImageUrl(creative);

    if (!imageUrl) return null;

    const Wrapper = ad.target_url ? "a" : "div";
    const wrapperProps = ad.target_url
        ? { href: ad.target_url, target: "_blank" as const, rel: "noopener sponsored" }
        : {};

    return (
        <div className={`w-full flex justify-center items-center ${className}`}>
            <Wrapper
                {...wrapperProps}
                className="block group relative overflow-hidden"
                style={{ maxWidth: 728, width: "100%" }}
            >
                <div className="relative w-full" style={{ aspectRatio: "728/90" }}>
                    <Image
                        src={imageUrl}
                        alt={ad.title || "Advertisement"}
                        fill
                        sizes="(max-width: 767px) 100vw, 728px"
                        loading="lazy"
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                </div>
            </Wrapper>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   CARD SERVER — 300×250 sidebar card (Server Component)
   ═══════════════════════════════════════════════════════ */

function CardAdServer({ ad, className = "" }: { ad: Advertisement; className?: string }) {
    const creative = ad.creative?.[0];
    const imageUrl = getAdImageUrl(creative);

    if (!imageUrl) return null;

    const Wrapper = ad.target_url ? "a" : "div";
    const wrapperProps = ad.target_url
        ? { href: ad.target_url, target: "_blank" as const, rel: "noopener sponsored" }
        : {};

    return (
        <div className={`w-full flex justify-center ${className}`}>
            <Wrapper
                {...wrapperProps}
                className="block group relative overflow-hidden w-full max-w-[300px] mx-auto bg-white"
            >
                <div className="relative w-full aspect-[300/250]">
                    <Image
                        src={imageUrl}
                        alt={ad.title || "Advertisement"}
                        fill
                        sizes="(max-width: 1024px) 100vw, 360px"
                        loading="lazy"
                        className="object-contain bg-white transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </div>
            </Wrapper>
        </div>
    );
}
