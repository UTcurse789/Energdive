import { getMarketplaceSectorSummaries } from "@/data/marketplace/sector-summaries";
import {
  getMarketplaceArticlesFromStrapi,
  getMarketplaceCompanies,
  getMarketplaceProducts,
} from "@/lib/marketplace-strapi";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { MarketplaceSnapshot } from "@/components/marketplace/marketplace-snapshot";
import { EnergyLandscape } from "@/components/marketplace/energy-landscape";
import { CompanySpotlight } from "@/components/marketplace/company-spotlight";
import { TechnologySolutions } from "@/components/marketplace/technology-solutions";
import { EnergyDiscoveries } from "@/components/marketplace/energy-discoveries";
import { ExploreByNeed } from "@/components/marketplace/explore-by-need";
import { MarketplaceCTA } from "@/components/marketplace/marketplace-cta";

export const metadata = {
  title: "Energy Industry Discovery Platform | Energdive Marketplace",
  description:
    "Discover verified energy companies, utility-grade products, and breakthrough technologies shaping the global energy transition. Energdive Marketplace — institutional B2B discovery for the energy industry.",
};

export default async function MarketplaceHomePage() {
  const [allCompanies, allProducts, articles] = await Promise.all([
    getMarketplaceCompanies(),
    getMarketplaceProducts(),
    getMarketplaceArticlesFromStrapi(4),
  ]);

  const spotlightCompanies = allCompanies.slice(0, 4);
  const featuredProducts = allProducts.slice(0, 4);
  const marketplaceSectors = getMarketplaceSectorSummaries(
    allCompanies,
    allProducts,
  );

  return (
    <div className="pb-24 space-y-20 sm:space-y-24 font-sans">
      {/* 1. EDITORIAL HERO — Command Search + Discovery Strip */}
      <MarketplaceHero />

      {/* 2. MARKETPLACE SNAPSHOT — real counts from Strapi */}
      <MarketplaceSnapshot
        companyCount={allCompanies.length}
        productCount={allProducts.length}
        sectorCount={marketplaceSectors.length}
      />

      {/* 3. EXPLORE THE ENERGY LANDSCAPE — Asymmetric Sector Grid */}
      <EnergyLandscape sectors={marketplaceSectors} />

      {/* 4. COMPANY SPOTLIGHT — 4-Column Company Grid with Logos */}
      {spotlightCompanies.length > 0 && (
        <CompanySpotlight companies={spotlightCompanies} />
      )}

      {/* 5. TECHNOLOGY & SOLUTIONS — 4-Column Product Grid */}
      <TechnologySolutions products={featuredProducts} />

      {/* 6. LATEST ENERGY DISCOVERIES — 4-Column Editorial Articles */}
      <EnergyDiscoveries articles={articles} />

      {/* 7. EXPLORE BY NEED — Intent-Based Navigation */}
      <ExploreByNeed />

      {/* 8. LIST YOUR COMPANY — Institutional CTA */}
      <MarketplaceCTA />
    </div>
  );
}
