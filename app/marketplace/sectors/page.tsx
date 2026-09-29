import type { Metadata } from "next";
import { getAllCategories } from "@/data/marketplace";
import { getMarketplaceSectorSummaries } from "@/data/marketplace/sector-summaries";
import {
  getMarketplaceCompanies,
  getMarketplaceProducts,
} from "@/lib/marketplace-strapi";
import { SectorCard } from "@/components/marketplace/sector-card";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";

export const metadata: Metadata = {
  title: "Energy Industry Sectors | Energdive Marketplace",
  description:
    "Explore energy sectors with active companies and solutions in the Energdive Marketplace.",
};

export const revalidate = 300;

function normalizedSectorName(value: string): string {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

export default async function SectorsPage() {
  const [companies, products] = await Promise.all([
    getMarketplaceCompanies(),
    getMarketplaceProducts(),
  ]);
  const categoryByName = new Map(
    getAllCategories().map((category) => [normalizedSectorName(category.name), category]),
  );
  const sectors = getMarketplaceSectorSummaries(companies, products).map((sector, index) => {
    const category = categoryByName.get(normalizedSectorName(sector.name));

    return {
      id: category?.id ?? `marketplace-sector-${index}`,
      slug: category?.slug ?? sector.key,
      name: sector.name,
      description: sector.description,
      iconName: category?.iconName ?? "Zap",
      image: sector.image ?? category?.image ?? "",
      subSectors: category?.subSectors ?? [],
      companyCount: sector.companyCount,
      productCount: sector.productCount,
    };
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <MarketplaceBreadcrumbs
        crumbs={[{ label: "Sectors" }]}
      />

      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 mb-8">
        <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00A651]" />
          Value Chain Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
          Energy Sectors
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 font-light mt-2 max-w-3xl leading-relaxed">
          Browse sectors with active companies and solutions across the energy transition.
        </p>
      </div>

      {/* Sectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {sectors.map((sector) => (
          <SectorCard key={sector.id} category={sector} />
        ))}
      </div>
    </div>
  );
}
