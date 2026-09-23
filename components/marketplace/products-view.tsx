"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ProductCard } from "./product-card";
import { ProductFilterSidebar } from "./product-filter-sidebar";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { ResultHeader, SortOption } from "./result-header";
import { FilterChips, FilterChipItem } from "./filter-chips";
import { MarketplaceSearch } from "./marketplace-search";
import { EmptyState } from "./empty-state";
import {
  MarketplaceProduct,
  ProductFilterState,
} from "@/data/marketplace/types";
import { filterProducts } from "@/data/marketplace";
import { ArrowDown } from "lucide-react";

interface ProductsViewProps {
  initialProducts: MarketplaceProduct[];
  categories: string[];
  sectors: string[];
  companies: { slug: string; name: string }[];
}

const ITEMS_PER_PAGE = 8;

export function ProductsView({
  initialProducts,
  categories,
  sectors,
  companies,
}: ProductsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Read filter state from URL query parameters
  const querySearch = searchParams.get("q") || searchParams.get("search") || "";
  const queryCategory = searchParams.get("category") || "all";
  const querySubCategory = searchParams.get("subCategory") || "all";
  const querySector = searchParams.get("sector") || "all";
  const queryCompany = searchParams.get("company") || searchParams.get("companySlug") || "all";
  const querySort = (searchParams.get("sort") as SortOption) || "featured";

  const filters: ProductFilterState = useMemo(
    () => ({
      search: querySearch,
      category: queryCategory,
      subCategory: querySubCategory,
      sector: querySector,
      companySlug: queryCompany,
    }),
    [querySearch, queryCategory, querySubCategory, querySector, queryCompany]
  );

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Helper to update URL params cleanly
  const updateUrlParams = useCallback(
    (newFilters: Partial<ProductFilterState>, newSort?: SortOption) => {
      const params = new URLSearchParams();

      const searchVal = newFilters.search !== undefined ? newFilters.search : filters.search;
      const catVal = newFilters.category !== undefined ? newFilters.category : filters.category;
      const subCatVal = newFilters.subCategory !== undefined ? newFilters.subCategory : filters.subCategory;
      const sectorVal = newFilters.sector !== undefined ? newFilters.sector : filters.sector;
      const compVal = newFilters.companySlug !== undefined ? newFilters.companySlug : filters.companySlug;
      const sortVal = newSort !== undefined ? newSort : querySort;

      if (searchVal) params.set("q", searchVal);
      if (catVal && catVal !== "all") params.set("category", catVal);
      if (subCatVal && subCatVal !== "all") params.set("subCategory", subCatVal);
      if (sectorVal && sectorVal !== "all") params.set("sector", sectorVal);
      if (compVal && compVal !== "all") params.set("company", compVal);
      if (sortVal && sortVal !== "featured") params.set("sort", sortVal);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setVisibleCount(ITEMS_PER_PAGE);
    },
    [filters, querySort, router, pathname]
  );

  const handleFilterChange = (updated: ProductFilterState) => {
    updateUrlParams(updated);
  };

  const handleSortChange = (newSort: SortOption) => {
    updateUrlParams({}, newSort);
  };

  const handleSearchChange = (val: string) => {
    updateUrlParams({ search: val });
  };

  const handleClearAll = () => {
    router.push(pathname, { scroll: false });
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // 2. Filter & Sort Products
  const filtered = useMemo(() => {
    const list = filterProducts(initialProducts, filters);

    // Apply client-side sorting
    if (querySort === "az") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (querySort === "recent") {
      return [...list].reverse();
    }
    return list; // "featured" keeps original order
  }, [initialProducts, filters, querySort]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const selectedCompany = companies.find((c) => c.slug === filters.companySlug);

  // 3. Build Active Filter Chips
  const activeChips: FilterChipItem[] = useMemo(() => {
    const chips: FilterChipItem[] = [];
    if (filters.search) {
      chips.push({
        id: "search",
        label: "Search",
        value: `"${filters.search}"`,
        onRemove: () => updateUrlParams({ search: "" }),
      });
    }
    if (filters.category !== "all") {
      chips.push({
        id: "category",
        label: "Category",
        value: filters.category,
        onRemove: () => updateUrlParams({ category: "all" }),
      });
    }
    if (filters.sector !== "all") {
      chips.push({
        id: "sector",
        label: "Sector",
        value: filters.sector,
        onRemove: () => updateUrlParams({ sector: "all" }),
      });
    }
    if (filters.companySlug !== "all" && selectedCompany) {
      chips.push({
        id: "company",
        label: "Manufacturer",
        value: selectedCompany.name,
        onRemove: () => updateUrlParams({ companySlug: "all" }),
      });
    }
    return chips;
  }, [filters, selectedCompany, updateUrlParams]);

  return (
    <div className="space-y-6">
      {/* Search Bar on Top */}
      <div className="max-w-2xl">
        <MarketplaceSearch
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search products, hardware, technologies..."
        />
      </div>

      {/* Main Two-Column Layout (Sidebar + Results) */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block">
          <ProductFilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            categories={categories}
            sectors={sectors}
            companies={companies}
            totalResults={filtered.length}
          />
        </div>

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          title="Product Filters"
          totalResults={filtered.length}
          onClearAll={handleClearAll}
        >
          <ProductFilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            categories={categories}
            sectors={sectors}
            companies={companies}
            totalResults={filtered.length}
            className="border-0 p-0 shadow-none sticky-none"
          />
        </MobileFilterDrawer>

        {/* Results Area */}
        <div className="flex-1 w-full min-w-0">
          {/* Result Header (Count + Sort + Mobile Button) */}
          <ResultHeader
            title="Products & Solutions"
            totalCount={initialProducts.length}
            filteredCount={filtered.length}
            itemLabel="products"
            sort={querySort}
            onSortChange={handleSortChange}
            onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
            activeFilterCount={activeChips.length}
          />

          {/* Active Filter Chips */}
          <FilterChips chips={activeChips} onClearAll={handleClearAll} />

          {/* Grid or Empty State */}
          {filtered.length === 0 ? (
            <EmptyState
              title={
                filters.search
                  ? `No products found matching "${filters.search}"`
                  : "No energy solutions match your selection"
              }
              description="Try adjusting your search keywords, clearing category filters, or browsing all equipment."
              actionText="Clear All Filters"
              onAction={handleClearAll}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More Pagination */}
              {hasMore && (
                <div className="pt-10 flex flex-col items-center justify-center space-y-2">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-300 hover:border-[#00A651] hover:text-[#00A651] text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <span>Load More Products</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    Showing {visibleProducts.length} of {filtered.length} products
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
