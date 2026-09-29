import type { Metadata } from "next";
import { getAllCategories } from "@/data/marketplace";
import { SectorCard } from "@/components/marketplace/sector-card";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";

export const metadata: Metadata = {
  title: "Energy Industry Sectors | Energdive Marketplace",
  description:
    "Explore 12 energy sectors across the entire value chain from generation and solar to hydrogen, transmission, storage and mobility.",
};

export default function SectorsPage() {
  const categories = getAllCategories();

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
          Navigate specialized solutions, equipment manufacturers, and EPC partners across the 12 core domains driving the energy transition.
        </p>
      </div>

      {/* Sectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {categories.map((category) => (
          <SectorCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
