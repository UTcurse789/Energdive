"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, Building2, MapPin, Tag, ShieldCheck } from "lucide-react";
import { CompanyFilterState } from "@/data/marketplace/types";

interface CompanyFilterSidebarProps {
  filters: CompanyFilterState;
  onChange: (filters: CompanyFilterState) => void;
  sectors: string[];
  companyTypes: string[];
  locations: string[];
  totalResults: number;
  className?: string;
}

export function CompanyFilterSidebar({
  filters,
  onChange,
  sectors,
  companyTypes,
  locations,
  totalResults,
  className = "",
}: CompanyFilterSidebarProps) {
  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sector: true,
    companyType: true,
    location: false,
    listedStatus: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    <aside
      aria-label="Filters"
      className={`w-full lg:w-64 shrink-0 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs lg:sticky lg:top-[140px] ${className}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
            Filters
          </span>
          <span className="text-[11px] font-semibold text-zinc-400">
            ({totalResults})
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* 1. SECTOR FILTER */}
        <div className="border-b border-zinc-100 pb-4">
          <button
            type="button"
            onClick={() => toggleSection("sector")}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sector</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                openSections.sector ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.sector && (
            <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="sidebar-sector"
                  checked={filters.sector === "all"}
                  onChange={() => onChange({ ...filters, sector: "all" })}
                  className="accent-[#00A651]"
                />
                <span className={filters.sector === "all" ? "font-bold text-[#00A651]" : "font-medium"}>
                  All Sectors
                </span>
              </label>

              {sectors.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="sidebar-sector"
                    checked={filters.sector === s}
                    onChange={() => onChange({ ...filters, sector: s })}
                    className="accent-[#00A651]"
                  />
                  <span className={filters.sector === s ? "font-bold text-[#00A651]" : "font-medium line-clamp-1"}>
                    {s}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 2. COMPANY TYPE FILTER */}
        <div className="border-b border-zinc-100 pb-4">
          <button
            type="button"
            onClick={() => toggleSection("companyType")}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Company Type</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                openSections.companyType ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.companyType && (
            <div className="mt-3 space-y-1.5">
              <label className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="sidebar-type"
                  checked={filters.companyType === "all"}
                  onChange={() => onChange({ ...filters, companyType: "all" })}
                  className="accent-[#00A651]"
                />
                <span className={filters.companyType === "all" ? "font-bold text-[#00A651]" : "font-medium"}>
                  All Types
                </span>
              </label>

              {companyTypes.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="sidebar-type"
                    checked={filters.companyType === t}
                    onChange={() => onChange({ ...filters, companyType: t })}
                    className="accent-[#00A651]"
                  />
                  <span className={filters.companyType === t ? "font-bold text-[#00A651]" : "font-medium"}>
                    {t}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 3. LISTED STATUS FILTER */}
        <div className="border-b border-zinc-100 pb-4">
          <button
            type="button"
            onClick={() => toggleSection("listedStatus")}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Exchange Listed</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                openSections.listedStatus ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.listedStatus && (
            <div className="mt-3 space-y-1.5">
              {[
                { value: "all", label: "All Companies" },
                { value: "listed", label: "Publicly Listed (NSE / BSE)" },
                { value: "unlisted", label: "Private / Unlisted" },
              ].map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="sidebar-listed"
                    checked={filters.listedStatus === item.value}
                    onChange={() => onChange({ ...filters, listedStatus: item.value })}
                    className="accent-[#00A651]"
                  />
                  <span className={filters.listedStatus === item.value ? "font-bold text-[#00A651]" : "font-medium"}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 4. LOCATION FILTER */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("location")}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>Location / HQ</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                openSections.location ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.location && (
            <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="sidebar-location"
                  checked={filters.location === "all"}
                  onChange={() => onChange({ ...filters, location: "all" })}
                  className="accent-[#00A651]"
                />
                <span className={filters.location === "all" ? "font-bold text-[#00A651]" : "font-medium"}>
                  All Locations
                </span>
              </label>

              {locations.map((loc) => (
                <label
                  key={loc}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="sidebar-location"
                    checked={filters.location === loc}
                    onChange={() => onChange({ ...filters, location: loc })}
                    className="accent-[#00A651]"
                  />
                  <span className={filters.location === loc ? "font-bold text-[#00A651]" : "font-medium line-clamp-1"}>
                    {loc}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
