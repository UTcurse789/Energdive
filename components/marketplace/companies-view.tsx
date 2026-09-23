"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CompanyCard } from "./company-card";
import { CompanyFilterSidebar } from "./company-filter-sidebar";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { ResultHeader, SortOption } from "./result-header";
import { FilterChips, FilterChipItem } from "./filter-chips";
import { MarketplaceSearch } from "./marketplace-search";
import { EmptyState } from "./empty-state";
import {
  MarketplaceCompany,
  CompanyFilterState,
} from "@/data/marketplace/types";
import { filterCompanies } from "@/data/marketplace";
import { ArrowDown } from "lucide-react";

interface CompaniesViewProps {
  initialCompanies: MarketplaceCompany[];
  sectors: string[];
  companyTypes: string[];
  locations: string[];
}

const ITEMS_PER_PAGE = 8;

export function CompaniesView({
  initialCompanies,
  sectors,
  companyTypes,
  locations,
}: CompaniesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Read filter state from URL query parameters
  const querySearch = searchParams.get("q") || searchParams.get("search") || "";
  const querySector = searchParams.get("sector") || "all";
  const querySubSector = searchParams.get("subSector") || "all";
  const queryCompanyType = searchParams.get("companyType") || searchParams.get("type") || "all";
  const queryLocation = searchParams.get("location") || "all";
  const queryListedStatus = searchParams.get("listedStatus") || searchParams.get("status") || "all";
  const querySort = (searchParams.get("sort") as SortOption) || "featured";

  const filters: CompanyFilterState = useMemo(
    () => ({
      search: querySearch,
      sector: querySector,
      subSector: querySubSector,
      companyType: queryCompanyType,
      location: queryLocation,
      listedStatus: queryListedStatus,
    }),
    [querySearch, querySector, querySubSector, queryCompanyType, queryLocation, queryListedStatus]
  );

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Helper to update URL params cleanly
  const updateUrlParams = useCallback(
    (newFilters: Partial<CompanyFilterState>, newSort?: SortOption) => {
      const params = new URLSearchParams();

      const searchVal = newFilters.search !== undefined ? newFilters.search : filters.search;
      const sectorVal = newFilters.sector !== undefined ? newFilters.sector : filters.sector;
      const subSectorVal = newFilters.subSector !== undefined ? newFilters.subSector : filters.subSector;
      const typeVal = newFilters.companyType !== undefined ? newFilters.companyType : filters.companyType;
      const locVal = newFilters.location !== undefined ? newFilters.location : filters.location;
      const statusVal = newFilters.listedStatus !== undefined ? newFilters.listedStatus : filters.listedStatus;
      const sortVal = newSort !== undefined ? newSort : querySort;

      if (searchVal) params.set("q", searchVal);
      if (sectorVal && sectorVal !== "all") params.set("sector", sectorVal);
      if (subSectorVal && subSectorVal !== "all") params.set("subSector", subSectorVal);
      if (typeVal && typeVal !== "all") params.set("companyType", typeVal);
      if (locVal && locVal !== "all") params.set("location", locVal);
      if (statusVal && statusVal !== "all") params.set("listedStatus", statusVal);
      if (sortVal && sortVal !== "featured") params.set("sort", sortVal);

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      setVisibleCount(ITEMS_PER_PAGE);
    },
    [filters, querySort, router, pathname]
  );

  const handleFilterChange = (updated: CompanyFilterState) => {
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

  // 2. Filter & Sort Companies
  const filtered = useMemo(() => {
    const list = filterCompanies(initialCompanies, filters);

    // Apply client-side sorting
    if (querySort === "az") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (querySort === "recent") {
      return [...list].reverse();
    }
    return list; // "featured" keeps original array order
  }, [initialCompanies, filters, querySort]);

  const visibleCompanies = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

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
    if (filters.sector !== "all") {
      chips.push({
        id: "sector",
        label: "Sector",
        value: filters.sector,
        onRemove: () => updateUrlParams({ sector: "all" }),
      });
    }
    if (filters.companyType !== "all") {
      chips.push({
        id: "companyType",
        label: "Type",
        value: filters.companyType,
        onRemove: () => updateUrlParams({ companyType: "all" }),
      });
    }
    if (filters.location !== "all") {
      chips.push({
        id: "location",
        label: "Location",
        value: filters.location,
        onRemove: () => updateUrlParams({ location: "all" }),
      });
    }
    if (filters.listedStatus !== "all") {
      chips.push({
        id: "listedStatus",
        label: "Status",
        value: filters.listedStatus === "listed" ? "Listed" : "Unlisted",
        onRemove: () => updateUrlParams({ listedStatus: "all" }),
      });
    }
    return chips;
  }, [filters, updateUrlParams]);

  return (
    <div className="space-y-6">
      {/* Search Bar on Top */}
      <div className="max-w-2xl">
        <MarketplaceSearch
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search companies by name, ticker, or sector..."
        />
      </div>

      {/* Main Two-Column Layout (Sidebar + Results) */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block">
          <CompanyFilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            sectors={sectors}
            companyTypes={companyTypes}
            locations={locations}
            totalResults={filtered.length}
          />
        </div>

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          title="Company Filters"
          totalResults={filtered.length}
          onClearAll={handleClearAll}
        >
          <CompanyFilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            sectors={sectors}
            companyTypes={companyTypes}
            locations={locations}
            totalResults={filtered.length}
            className="border-0 p-0 shadow-none sticky-none"
          />
        </MobileFilterDrawer>

        {/* Results Area */}
        <div className="flex-1 w-full min-w-0">
          {/* Result Header (Count + Sort + Mobile Button) */}
          <ResultHeader
            title="Energy Companies"
            totalCount={initialCompanies.length}
            filteredCount={filtered.length}
            itemLabel="companies"
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
                  ? `No companies found matching "${filters.search}"`
                  : "No energy companies match your selection"
              }
              description="Try adjusting your keywords, clearing filters, or browsing across all sectors."
              actionText="Clear All Filters"
              onAction={handleClearAll}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>

              {/* Load More Pagination */}
              {hasMore && (
                <div className="pt-10 flex flex-col items-center justify-center space-y-2">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-300 hover:border-[#00A651] hover:text-[#00A651] text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <span>Load More Companies</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    Showing {visibleCompanies.length} of {filtered.length} companies
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
