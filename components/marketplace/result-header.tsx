"use client";

import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

export type SortOption = "featured" | "az" | "recent";

interface ResultHeaderProps {
  title: string;
  totalCount: number;
  filteredCount: number;
  itemLabel: string; // e.g., "companies" or "products"
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenMobileFilters?: () => void;
  activeFilterCount?: number;
}

export function ResultHeader({
  title,
  totalCount,
  filteredCount,
  itemLabel,
  sort,
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount = 0,
}: ResultHeaderProps) {
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-200">
      <div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
          {isFiltered ? (
            <span>
              Showing <strong className="text-zinc-800 font-semibold">{filteredCount}</strong> of {totalCount} {itemLabel}
            </span>
          ) : (
            <span>
              <strong className="text-zinc-800 font-semibold">{totalCount}</strong> {itemLabel} found
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {/* Mobile Filter Trigger */}
        {onOpenMobileFilters && (
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider text-zinc-800 hover:border-[#00A651] hover:text-[#00A651] transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00A651]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00A651] text-white text-[10px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Sort Dropdown */}
        <div className="relative inline-flex items-center">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400 hidden sm:inline text-[11px] uppercase tracking-wider font-bold">Sort:</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer pr-1"
              aria-label="Sort options"
            >
              <option value="featured">Featured</option>
              <option value="az">A – Z (Alphabetical)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
