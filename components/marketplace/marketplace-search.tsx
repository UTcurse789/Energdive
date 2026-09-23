"use client";

import { Search, X } from "lucide-react";

interface MarketplaceSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSearchSubmit?: () => void;
}

export function MarketplaceSearch({
  value,
  onChange,
  placeholder = "Search companies, products, technologies...",
  className = "",
  onSearchSubmit,
}: MarketplaceSearchProps) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 text-zinc-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearchSubmit) {
            onSearchSubmit();
          }
        }}
        placeholder={placeholder}
        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#00A651] focus:ring-2 focus:ring-[#00A651]/10 transition-all shadow-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3.5 sm:right-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
