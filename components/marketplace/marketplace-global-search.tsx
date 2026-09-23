"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Building2, Package, Layers, ArrowRight, X } from "lucide-react";
import { searchMarketplace, MarketplaceSearchResults } from "@/data/marketplace";

interface MarketplaceGlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export function MarketplaceGlobalSearch({
  placeholder = "Search companies, products, sectors...",
  className = "",
}: MarketplaceGlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive results directly using useMemo instead of useEffect setState
  const results: MarketplaceSearchResults = useMemo(() => {
    if (query.trim().length >= 2) {
      return searchMarketplace(query.trim(), 4);
    }
    return { companies: [], products: [], categories: [] };
  }, [query]);

  const isOpen = isFocused && query.trim().length >= 2;

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalResultsCount =
    results.companies.length + results.products.length + results.categories.length;

  // Flatten suggestions for keyboard navigation
  const flatSuggestions: Array<{ type: string; title: string; href: string }> = [
    ...results.companies.map((c) => ({
      type: "company",
      title: c.name,
      href: `/marketplace/companies/${c.slug}`,
    })),
    ...results.products.map((p) => ({
      type: "product",
      title: p.name,
      href: `/marketplace/products/${p.slug}`,
    })),
    ...results.categories.map((cat) => ({
      type: "category",
      title: cat.name,
      href: `/marketplace/companies?sector=${encodeURIComponent(cat.name)}`,
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsFocused(false);
      return;
    }

    if (!isOpen || flatSuggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatSuggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatSuggestions.length) {
        const selected = flatSuggestions[activeIndex];
        router.push(selected.href);
        setIsFocused(false);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!query.trim()) {
      router.push("/marketplace/companies");
      return;
    }
    setIsFocused(false);
    router.push(`/marketplace/companies?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Command Search Bar Input */}
      <div className="relative flex items-center shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md p-1.5 sm:p-2 border border-zinc-200/90 focus-within:border-[#00A651] focus-within:ring-3 focus-within:ring-[#00A651]/10 transition-all">
        <Search className="w-5 h-5 text-zinc-400 ml-3.5 sm:ml-4 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none bg-transparent font-medium"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions-list"
          aria-label="Search energy marketplace"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsFocused(false);
              inputRef.current?.focus();
            }}
            className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors mr-1 cursor-pointer"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="hidden md:inline-flex items-center text-[10px] font-bold text-zinc-400 border border-zinc-200 bg-zinc-50 px-2 py-0.5 rounded mr-2 uppercase tracking-wider select-none">
            ESC to close
          </span>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 bg-[#00A651] hover:bg-[#008f45] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-md active:scale-98"
        >
          <span>Search</span>
          <ArrowRight className="w-4 h-4 hidden sm:inline" />
        </button>
      </div>

      {/* Suggestion Dropdown Panel */}
      {isOpen && (
        <div
          id="search-suggestions-list"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left max-h-[420px] overflow-y-auto"
        >
          {totalResultsCount === 0 ? (
            <div className="p-5 text-center">
              <p className="text-xs sm:text-sm font-semibold text-zinc-700">
                No matching results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Press Enter to search all company profiles.
              </p>
            </div>
          ) : (
            <>
              {/* Companies Group */}
              {results.companies.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <Building2 className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Companies</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.companies.map((company) => {
                      return (
                        <Link
                          key={company.id}
                          href={`/marketplace/companies/${company.slug}`}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
                              {company.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-medium">
                              Company · {company.sector}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#00A651] flex items-center gap-0.5">
                            Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Products Group */}
              {results.products.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <Package className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Products & Solutions</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.products.map((product) => {
                      return (
                        <Link
                          key={product.id}
                          href={`/marketplace/products/${product.slug}`}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-medium">
                              Product · {product.category} · by {product.companyName}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#00A651] flex items-center gap-0.5">
                            Solution <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sectors Group */}
              {results.categories.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <Layers className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Sectors & Domains</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.categories.map((cat) => {
                      return (
                        <Link
                          key={cat.id}
                          href={`/marketplace/companies?sector=${encodeURIComponent(cat.name)}`}
                          onClick={() => setIsFocused(false)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors">
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-medium">
                              Sector · {cat.companyCount ?? 0} Companies · {cat.productCount ?? 0} Products
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-[#00A651] flex items-center gap-0.5">
                            Filter Sector <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom footer action */}
              <div className="p-3 bg-zinc-50 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">
                  Looking for &ldquo;<strong>{query}</strong>&rdquo;
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#00A651] hover:underline cursor-pointer"
                >
                  <span>See all company results</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
