"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Package,
} from "lucide-react";
import type { MarketplaceSectorSummary } from "@/data/marketplace/sector-summaries";

interface EnergyLandscapeProps {
  sectors: MarketplaceSectorSummary[];
}

function sectorFilterHref(
  path: "/marketplace/companies" | "/marketplace/products",
  sector: string,
) {
  return path + "?sector=" + encodeURIComponent(sector);
}

export function EnergyLandscape({ sectors }: EnergyLandscapeProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  if (sectors.length === 0) return null;

  const scrollCarousel = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction * Math.max(carousel.clientWidth * 0.82, 320),
      behavior: "smooth",
    });
  };

  return (
    <section className="max-w-[1240px] mx-auto px-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            MARKETPLACE DIRECTORY
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-black uppercase tracking-tight text-zinc-950">
            EXPLORE ACTIVE SECTORS
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            Sectors appear here only when they have a listed company or product in the marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {sectors.length > 1 && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label="Previous marketplace sectors"
                aria-controls="marketplace-sector-carousel"
                className="w-8 h-8 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:border-[#00A651] hover:bg-[#00A651] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label="Next marketplace sectors"
                aria-controls="marketplace-sector-carousel"
                className="w-8 h-8 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:border-[#00A651] hover:bg-[#00A651] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 mx-auto" />
              </button>
            </div>
          )}
          <Link
            href="/marketplace/companies"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            Browse Companies
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div
        ref={carouselRef}
        id="marketplace-sector-carousel"
        className="grid grid-flow-col auto-cols-[86%] sm:auto-cols-[calc(50%-0.625rem)] lg:auto-cols-[calc(33.333%-0.875rem)] gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {sectors.map((sector) => {
          const onlyCompanies = sector.productCount === 0;
          const onlyProducts = sector.companyCount === 0;
          const listingCount = sector.companyCount + sector.productCount;

          return (
            <article
              key={sector.key}
              className="group relative isolate min-h-[290px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00A651] hover:shadow-xl snap-start"
            >
              {sector.image && (
                <Image
                  src={sector.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 86vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-30 transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-[#006b37]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

              <div className="relative z-10 grid h-full min-h-[290px] grid-rows-[auto_1fr_auto] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    <Layers3 className="w-3.5 h-3.5" />
                    Marketplace Sector
                  </span>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-200">
                    {listingCount} {listingCount === 1 ? "listing" : "listings"}
                  </span>
                </div>

                <div className="self-end pt-8">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white transition-colors group-hover:text-emerald-300">
                    {sector.name}
                  </h3>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-200 line-clamp-3">
                    {sector.description}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/15 pt-4">
                  {sector.companyCount > 0 && (
                    <Link
                      href={sectorFilterHref("/marketplace/companies", sector.name)}
                      className={[
                        "inline-flex items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:border-emerald-300 hover:bg-white hover:text-zinc-900",
                        onlyCompanies ? "col-span-2" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Companies
                      </span>
                      <span>{sector.companyCount}</span>
                    </Link>
                  )}
                  {sector.productCount > 0 && (
                    <Link
                      href={sectorFilterHref("/marketplace/products", sector.name)}
                      className={[
                        "inline-flex items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:border-emerald-300 hover:bg-white hover:text-zinc-900",
                        onlyProducts ? "col-span-2" : "",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        Products
                      </span>
                      <span>{sector.productCount}</span>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {sectors.length > 1 && (
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 sm:hidden">
          Swipe to explore sectors
        </p>
      )}
    </section>
  );
}
