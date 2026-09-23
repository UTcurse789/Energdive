import { Suspense } from "react";
import type { Metadata } from "next";
import { CompaniesView } from "@/components/marketplace/companies-view";
import { GridLoadingSkeleton } from "@/components/marketplace/marketplace-skeletons";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";
import { getAllCompanies } from "@/data/marketplace";

export const metadata: Metadata = {
  title: "Energy Companies Directory",
  description:
    "Discover public, private, and multinational companies operating across generation, transmission, oil & gas, renewables, and clean energy.",
};

export default function CompaniesPage() {
  const allCompanies = getAllCompanies();

  // Extract distinct filter values
  const sectors = Array.from(new Set(allCompanies.map((c) => c.sector))).sort();
  const companyTypes = Array.from(new Set(allCompanies.map((c) => c.companyType))).sort();
  const locations = Array.from(
    new Set(allCompanies.map((c) => c.location.split(",")[0].trim()))
  ).sort();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <MarketplaceBreadcrumbs
        crumbs={[{ label: "Companies" }]}
      />

      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 mb-8">
        <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00A651]" />
          Corporate Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
          Energy Companies
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 font-light mt-2 max-w-3xl leading-relaxed">
          Discover enterprises, state utilities, independent power producers, and equipment manufacturers shaping the energy value chain across India and international markets.
        </p>
      </div>

      {/* Main Companies View */}
      <Suspense fallback={<GridLoadingSkeleton count={8} type="company" />}>
        <CompaniesView
          initialCompanies={allCompanies}
          sectors={sectors}
          companyTypes={companyTypes}
          locations={locations}
        />
      </Suspense>
    </div>
  );
}
