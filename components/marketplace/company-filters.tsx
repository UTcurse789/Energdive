"use client";

import { useState } from "react";
import { Filter, X, RotateCcw, ChevronDown } from "lucide-react";
import { CompanyFilterState } from "@/data/marketplace/types";

interface CompanyFiltersProps {
  filters: CompanyFilterState;
  onChange: (filters: CompanyFilterState) => void;
  sectors: string[];
  companyTypes: string[];
  locations: string[];
  totalResults: number;
}

export function CompanyFilters({
  filters,
  onChange,
  sectors,
  companyTypes,
  locations,
  totalResults,
}: CompanyFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const hasActiveFilters =
    filters.sector !== "all" ||
    filters.companyType !== "all" ||
    filters.location !== "all" ||
    filters.listedStatus !== "all" ||
    filters.search !== "";

  const handleReset = () => {
    onChange({
      search: "",
      sector: "all",
      subSector: "all",
      companyType: "all",
      location: "all",
      listedStatus: "all",
    });
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-xs mb-8">
      {/* Top row: Results count and mobile toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 sm:border-0 sm:pb-0">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#00A651]" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
            Filter Companies
          </span>
          <span className="text-xs font-semibold text-zinc-400">
            ({totalResults} {totalResults === 1 ? "Result" : "Results"})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          )}

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="sm:hidden inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-zinc-100 rounded-md text-zinc-700"
          >
            <span>Options</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isMobileOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter controls: Desktop inline, Mobile collapsible */}
      <div
        className={`pt-4 sm:pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${
          isMobileOpen ? "block" : "hidden sm:grid"
        }`}
      >
        {/* Sector Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Sector
          </label>
          <select
            value={filters.sector}
            onChange={(e) => onChange({ ...filters, sector: e.target.value })}
            className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] text-zinc-800 font-medium"
          >
            <option value="all">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Company Type Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Company Type
          </label>
          <select
            value={filters.companyType}
            onChange={(e) => onChange({ ...filters, companyType: e.target.value })}
            className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] text-zinc-800 font-medium"
          >
            <option value="all">All Types</option>
            {companyTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Location / HQ
          </label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] text-zinc-800 font-medium"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Listed Status Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Exchange Listed
          </label>
          <select
            value={filters.listedStatus}
            onChange={(e) => onChange({ ...filters, listedStatus: e.target.value })}
            className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#00A651] text-zinc-800 font-medium"
          >
            <option value="all">All Status</option>
            <option value="listed">Publicly Listed (NSE / BSE)</option>
            <option value="unlisted">Private / Unlisted</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Active:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
              Search: &quot;{filters.search}&quot;
              <button
                onClick={() => onChange({ ...filters, search: "" })}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.sector !== "all" && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-[#00A651] px-2 py-0.5 rounded border border-emerald-100">
              Sector: {filters.sector}
              <button
                onClick={() => onChange({ ...filters, sector: "all" })}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.companyType !== "all" && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
              Type: {filters.companyType}
              <button
                onClick={() => onChange({ ...filters, companyType: "all" })}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.location !== "all" && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
              Location: {filters.location}
              <button
                onClick={() => onChange({ ...filters, location: "all" })}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.listedStatus !== "all" && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
              Status: {filters.listedStatus === "listed" ? "Listed" : "Unlisted"}
              <button
                onClick={() => onChange({ ...filters, listedStatus: "all" })}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleReset}
            className="text-[10px] font-bold text-red-600 hover:underline ml-auto"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
