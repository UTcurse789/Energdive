"use client";

import Link from "next/link";
import { ArrowRight, Building2, Package, Layers, Wrench, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { MarketplaceGlobalSearch } from "./marketplace-global-search";

export function MarketplaceHero() {
  const popularSearches = [
    { label: "Power Generation", href: "/marketplace/companies?sector=Power Generation" },
    { label: "Solar Energy", href: "/marketplace/companies?sector=Solar Energy" },
    { label: "Energy Storage", href: "/marketplace/companies?sector=Energy Storage" },
    { label: "Wind Energy", href: "/marketplace/companies?sector=Wind Energy" },
    { label: "EV & Mobility", href: "/marketplace/companies?sector=EV & Mobility" },
    { label: "Green Hydrogen", href: "/marketplace/companies?sector=Green Hydrogen" },
  ];

  return (
    <section className="relative bg-gradient-to-b from-white via-zinc-50/40 to-white pt-12 pb-14 sm:pt-16 sm:pb-18 overflow-hidden border-b border-zinc-200/80">
      {/* Subtle institutional grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      {/* Restrained emerald atmospheric glow */}
      <div className="absolute -top-24 right-1/4 w-[500px] h-[500px] bg-[#00A651]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[10px] sm:text-[11px] font-bold tracking-widest text-zinc-700 uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            ENERGDIVE MARKET INTELLIGENCE &bull; B2B DISCOVERY
          </div>

          {/* Headline with Editorial Serif Treatment */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-serif font-black tracking-tight text-zinc-950 leading-[1.08] mb-4">
            EXPLORE THE <span className="text-[#00A651]">ENERGY MARKETPLACE</span>
          </h1>

          {/* Supporting editorial copy */}
          <p className="text-sm sm:text-base lg:text-lg text-zinc-600 font-normal leading-relaxed max-w-2xl mx-auto mb-8">
            Discover verified companies, breakthrough technologies, utility equipment, and market capabilities across the global energy transition.
          </p>

          {/* Institutional Command Search Bar */}
          <div className="max-w-2xl mx-auto mb-4">
            <MarketplaceGlobalSearch placeholder="Search companies, products, sectors & solutions..." />
          </div>

          {/* Hero Quick Links: Minimalist Text Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-500 mb-8 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1.5">
              POPULAR SEARCHES:
            </span>
            {popularSearches.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-2.5 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 hover:text-[#00A651] hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/80 transition-all duration-150"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Primary Quick Gateway Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/marketplace/companies"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md"
            >
              <span>Explore Companies</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00A651]" />
            </Link>

            <Link
              href="/marketplace/products"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-lg bg-white text-zinc-800 border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-all shadow-2xs"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
          </div>
        </div>

        {/* Section 5: Compact Editorial Discovery Strip */}
        <div className="mt-14 pt-8 border-t border-zinc-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x md:divide-zinc-200/80">
            {/* Discover: Companies */}
            <Link
              href="/marketplace/companies"
              className="group px-2 sm:px-4 py-2 hover:bg-zinc-50/80 rounded-lg transition-colors flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#00A651] transition-colors">
                  Companies
                </span>
                <span className="text-xs font-mono font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">
                  12+
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal leading-snug">
                Verified energy organizations, utilities &amp; OEMs
              </p>
            </Link>

            {/* Discover: Products */}
            <Link
              href="/marketplace/products"
              className="group px-2 sm:px-4 py-2 hover:bg-zinc-50/80 rounded-lg transition-colors flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#00A651] transition-colors">
                  Products
                </span>
                <span className="text-xs font-mono font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">
                  12+
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal leading-snug">
                Technologies, hardware &amp; grid solutions
              </p>
            </Link>

            {/* Discover: Sectors */}
            <Link
              href="/marketplace/sectors"
              className="group px-2 sm:px-4 py-2 hover:bg-zinc-50/80 rounded-lg transition-colors flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#00A651] transition-colors">
                  Sectors
                </span>
                <span className="text-xs font-mono font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">
                  12
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal leading-snug">
                Across the entire energy value chain
              </p>
            </Link>

            {/* Discover: Services */}
            <Link
              href="/marketplace/companies?sector=Energy Services"
              className="group px-2 sm:px-4 py-2 hover:bg-zinc-50/80 rounded-lg transition-colors flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#00A651] transition-colors">
                  Services
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                  &mdash;
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal leading-snug">
                EPC, technical advisory, testing &amp; plant O&amp;M
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
