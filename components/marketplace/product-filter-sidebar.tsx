"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw, Building2, Tag, Layers } from "lucide-react";
import { ProductFilterState } from "@/data/marketplace/types";

interface ProductFilterSidebarProps {
  filters: ProductFilterState;
  onChange: (filters: ProductFilterState) => void;
  categories: string[];
  sectors: string[];
  companies: { slug: string; name: string }[];
  totalResults: number;
  className?: string;
}

export function ProductFilterSidebar({
  filters,
  onChange,
  categories,
  sectors,
  companies,
  totalResults,
  className = "",
}: ProductFilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    sector: true,
    company: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.sector !== "all" ||
    filters.companySlug !== "all" ||
    filters.search !== "";

  const handleReset = () => {
    onChange({
      search: "",
      category: "all",
      subCategory: "all",
      sector: "all",
      companySlug: "all",
    });
  };

  return (
    <aside
      aria-label="Product Filters"
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
        {/* 1. CATEGORY FILTER */}
        <div className="border-b border-zinc-100 pb-4">
          <button
            type="button"
            onClick={() => toggleSection("category")}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Category</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                openSections.category ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.category && (
            <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="sidebar-prod-cat"
                  checked={filters.category === "all"}
                  onChange={() => onChange({ ...filters, category: "all" })}
                  className="accent-[#00A651]"
                />
                <span className={filters.category === "all" ? "font-bold text-[#00A651]" : "font-medium"}>
                  All Categories
                </span>
              </label>

              {categories.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="sidebar-prod-cat"
                    checked={filters.category === c}
                    onChange={() => onChange({ ...filters, category: c })}
                    className="accent-[#00A651]"
                  />
                  <span className={filters.category === c ? "font-bold text-[#00A651]" : "font-medium line-clamp-1"}>
                    {c}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 2. SECTOR FILTER */}
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
            <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="sidebar-prod-sector"
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
                    name="sidebar-prod-sector"
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

        {/* 3. MANUFACTURER FILTER */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("company")}
            className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Manufacturer</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${
                openSections.company ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSections.company && (
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="sidebar-prod-company"
                  checked={filters.companySlug === "all"}
                  onChange={() => onChange({ ...filters, companySlug: "all" })}
                  className="accent-[#00A651]"
                />
                <span className={filters.companySlug === "all" ? "font-bold text-[#00A651]" : "font-medium"}>
                  All Manufacturers
                </span>
              </label>

              {companies.map((comp) => (
                <label
                  key={comp.slug}
                  className="flex items-center gap-2 text-xs text-zinc-700 hover:text-zinc-950 cursor-pointer py-0.5"
                >
                  <input
                    type="radio"
                    name="sidebar-prod-company"
                    checked={filters.companySlug === comp.slug}
                    onChange={() => onChange({ ...filters, companySlug: comp.slug })}
                    className="accent-[#00A651]"
                  />
                  <span className={filters.companySlug === comp.slug ? "font-bold text-[#00A651]" : "font-medium line-clamp-1"}>
                    {comp.name}
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
