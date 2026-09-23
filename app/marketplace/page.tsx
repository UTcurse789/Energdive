import {
  getAllCategories,
  getFeaturedCompanies,
  getFeaturedProducts,
  getMarketplaceArticles,
} from "@/data/marketplace";
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

export default function MarketplaceHomePage() {
  const categories = getAllCategories();
  const featuredCompanies = getFeaturedCompanies(5);
  const featuredProducts = getFeaturedProducts(5);
  const articles = getMarketplaceArticles(3);

  const spotlight = featuredCompanies[0];
  const alsoExplore = featuredCompanies.slice(1, 5);

  return (
    <div className="pb-24 space-y-20 sm:space-y-24">
      {/* 1. EDITORIAL HERO — Command Search + Discovery Strip */}
      <MarketplaceHero />

      {/* 2. MARKETPLACE SNAPSHOT — Institutional Index Strip */}
      <MarketplaceSnapshot />

      {/* 3. EXPLORE THE ENERGY LANDSCAPE — Asymmetric Sector Grid */}
      <EnergyLandscape categories={categories} />

      {/* 4. COMPANY SPOTLIGHT — Feature Profile + Peer List */}
      {spotlight && (
        <CompanySpotlight
          featuredCompany={spotlight}
          alsoExplore={alsoExplore}
        />
      )}

      {/* 5. TECHNOLOGY & SOLUTIONS — Cinematic Product Showcase */}
      <TechnologySolutions products={featuredProducts} />

      {/* 6. LATEST ENERGY DISCOVERIES — Editorial Articles */}
      <EnergyDiscoveries articles={articles} />

      {/* 7. EXPLORE BY NEED — Intent-Based Navigation */}
      <ExploreByNeed />

      {/* 8. LIST YOUR COMPANY — Institutional CTA */}
      <MarketplaceCTA />
    </div>
  );
}