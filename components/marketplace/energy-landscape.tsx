"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sun, Zap, Wind, Flame, BatteryCharging, Car, Atom, Cpu, ArrowUpRight } from "lucide-react";
import { MarketplaceCategory } from "@/data/marketplace/types";

interface EnergyLandscapeProps {
  categories: MarketplaceCategory[];
}

export function EnergyLandscape({ categories }: EnergyLandscapeProps) {
  // Horizontal filter categories
  const filterPills = [
    { label: "ALL", filter: "all" },
    { label: "POWER", filter: "power-generation" },
    { label: "SOLAR", filter: "solar-energy" },
    { label: "WIND", filter: "wind-energy" },
    { label: "OIL & GAS", filter: "oil-gas" },
    { label: "STORAGE", filter: "energy-storage" },
    { label: "EV", filter: "ev-mobility" },
    { label: "HYDROGEN", filter: "green-hydrogen" },
    { label: "NUCLEAR", filter: "nuclear-energy" },
    { label: "TECH", filter: "energy-technology" },
  ];

  const [activeFilter, setActiveFilter] = useState("all");

  const solarCat = categories.find((c) => c.slug === "solar-energy") || categories[1];
  const windCat = categories.find((c) => c.slug === "wind-energy") || categories[2];
  const storageCat = categories.find((c) => c.slug === "energy-storage") || categories[5];
  const powerCat = categories.find((c) => c.slug === "power-generation") || categories[0];
  const oilGasCat = categories.find((c) => c.slug === "oil-gas") || categories[3];
  const evCat = categories.find((c) => c.slug === "ev-mobility") || categories[6];

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            VALUE CHAIN EXPLORATION
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950">
            EXPLORE THE ENERGY LANDSCAPE
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            From conventional power generation and oil &amp; gas to utility renewables, grid battery storage, and emerging decarbonization vectors.
          </p>
        </div>

        <Link
          href="/marketplace/sectors"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
        >
          <span>View All 12 Sectors</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal Sector Index Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {filterPills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={() => setActiveFilter(pill.filter)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === pill.filter
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Asymmetric Editorial Sector Composition */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Large Feature Sector: Solar Energy (7 cols on desktop) */}
        <Link
          href={`/marketplace/companies?sector=${encodeURIComponent(solarCat.name)}`}
          className="md:col-span-7 group relative bg-zinc-900 text-white rounded-xl overflow-hidden min-h-[320px] sm:min-h-[380px] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300"
        >
          {/* Background Image with Cinematic Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src={solarCat.image}
              alt={solarCat.name}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover opacity-35 group-hover:opacity-45 group-hover:scale-103 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[10px] font-black uppercase tracking-widest text-[#00A651]">
              <Sun className="w-3.5 h-3.5" />
              KEY DRIVER &bull; UTILITY SOLAR
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#00A651] transition-colors">
              <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-white mb-2 group-hover:text-emerald-300 transition-colors">
              {solarCat.name}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 font-light max-w-lg mb-4 line-clamp-2 leading-relaxed">
              {solarCat.description}
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-300 pt-3 border-t border-white/15">
              <span>{solarCat.companyCount ?? 4} Verified Companies</span>
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span>{solarCat.productCount ?? 2} Solutions Listed</span>
            </div>
          </div>
        </Link>

        {/* Stacked Side Sectors: Wind + Energy Storage (5 cols on desktop) */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Wind Energy */}
          <Link
            href={`/marketplace/companies?sector=${encodeURIComponent(windCat.name)}`}
            className="group flex-1 bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#00A651] transition-colors">
                  <Wind className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651]" />
                  RENEWABLE SECTOR
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-base sm:text-lg font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
                {windCat.name}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                {windCat.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-medium text-zinc-400">
              <span>{windCat.companyCount ?? 2} Companies</span>
              <span>{windCat.productCount ?? 1} Solutions</span>
            </div>
          </Link>

          {/* Energy Storage */}
          <Link
            href={`/marketplace/companies?sector=${encodeURIComponent(storageCat.name)}`}
            className="group flex-1 bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-[#00A651] transition-colors">
                  <BatteryCharging className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651]" />
                  GRID FLEXIBILITY
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-base sm:text-lg font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
                {storageCat.name}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                {storageCat.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-medium text-zinc-400">
              <span>{storageCat.companyCount ?? 3} Companies</span>
              <span>{storageCat.productCount ?? 2} Solutions</span>
            </div>
          </Link>
        </div>

        {/* Lower Row: 3 Editorial Horizontal Cards */}
        {/* Power Generation */}
        <Link
          href={`/marketplace/companies?sector=${encodeURIComponent(powerCat.name)}`}
          className="md:col-span-4 group bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-[#00A651]">
                BASELOAD &bull; CORE
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
              {powerCat.name}
            </h4>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {powerCat.description}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>{powerCat.companyCount ?? 4} Companies</span>
            <span>{powerCat.productCount ?? 3} Products</span>
          </div>
        </Link>

        {/* Oil & Gas */}
        <Link
          href={`/marketplace/companies?sector=${encodeURIComponent(oilGasCat.name)}`}
          className="md:col-span-4 group bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-[#00A651]">
                HYDROCARBONS &bull; LNG
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
              {oilGasCat.name}
            </h4>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {oilGasCat.description}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>{oilGasCat.companyCount ?? 2} Companies</span>
            <span>{oilGasCat.productCount ?? 1} Products</span>
          </div>
        </Link>

        {/* EV & Mobility */}
        <Link
          href={`/marketplace/companies?sector=${encodeURIComponent(evCat.name)}`}
          className="md:col-span-4 group bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-[#00A651]">
                MOBILITY &bull; FLEET
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
              {evCat.name}
            </h4>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
              {evCat.description}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>{evCat.companyCount ?? 2} Companies</span>
            <span>{evCat.productCount ?? 1} Products</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
