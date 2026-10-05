import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsView } from "@/components/marketplace/products-view";
import { GridLoadingSkeleton } from "@/components/marketplace/marketplace-skeletons";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";
import { getMarketplaceProducts, getMarketplaceCompanies } from "@/lib/marketplace-strapi";

export const metadata: Metadata = {
  title: "Energy Products & Solutions Catalog",
  description:
    "Explore utility-scale solar inverters, battery storage systems, turbines, hydrogen electrolyzers, and smart grid automation equipment.",
};

export default async function ProductsPage() {
  const [allProducts, allCompanies] = await Promise.all([
    getMarketplaceProducts(),
    getMarketplaceCompanies(),
  ]);

  // Distinct filter options
  const categories = Array.from(new Set(allProducts.map((p) => p.category))).sort();
  const sectors = Array.from(new Set(allProducts.map((p) => p.sector))).sort();
  const companies = allCompanies.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="min-h-screen">
      {/* Top Breadcrumb Nav Bar */}
      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-[1400px] px-6 py-3 sm:px-6 lg:px-8">
          <MarketplaceBreadcrumbs
            crumbs={[{ label: "Products" }]}
            className="mb-0"
          />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 mb-8">
        <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00A651]" />
          Solutions Catalog
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
          Energy Products & Solutions
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 font-light mt-2 max-w-3xl leading-relaxed">
          Discover proven equipment, specialized hardware, grid monitoring systems, and renewable technologies engineered by industry leaders.
        </p>
      </div>

      {/* Main Products View */}
      <Suspense fallback={<GridLoadingSkeleton count={8} type="product" />}>
        <ProductsView
          initialProducts={allProducts}
          categories={categories}
          sectors={sectors}
          companies={companies}
        />
      </Suspense>
      </div>
    </div>
  );
}
