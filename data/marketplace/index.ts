import { MARKETPLACE_CATEGORIES } from "./categories";
import { MARKETPLACE_COMPANIES } from "./companies";
import { MARKETPLACE_PRODUCTS } from "./products";
import { MARKETPLACE_ARTICLES } from "./articles";
import {
  MarketplaceCategory,
  MarketplaceCompany,
  MarketplaceProduct,
  MarketplaceArticle,
  CompanyFilterState,
  ProductFilterState,
} from "./types";

export * from "./types";
export * from "./categories";
export * from "./companies";
export * from "./products";
export * from "./articles";

// Categories
export function getAllCategories(): MarketplaceCategory[] {
  return MARKETPLACE_CATEGORIES;
}

export function getCategoryBySlug(slug: string): MarketplaceCategory | undefined {
  return MARKETPLACE_CATEGORIES.find((c) => c.slug === slug);
}

// Companies
export function getAllCompanies(): MarketplaceCompany[] {
  return MARKETPLACE_COMPANIES;
}

export function getCompanyBySlug(slug: string): MarketplaceCompany | undefined {
  return MARKETPLACE_COMPANIES.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase()
  );
}

export function getFeaturedCompanies(limit = 8): MarketplaceCompany[] {
  return MARKETPLACE_COMPANIES.slice(0, limit);
}

export function getRelatedCompanies(company: MarketplaceCompany, limit = 4): MarketplaceCompany[] {
  // First attempt: explicitly linked related company IDs
  const explicit = MARKETPLACE_COMPANIES.filter((c) =>
    company.relatedCompanyIds?.includes(c.id) && c.id !== company.id
  );
  if (explicit.length >= limit) return explicit.slice(0, limit);

  // Fallback: same sector or same industry
  const sameSector = MARKETPLACE_COMPANIES.filter(
    (c) => (c.sector === company.sector || c.industry === company.industry) &&
      c.id !== company.id &&
      !explicit.some((e) => e.id === c.id)
  );

  return [...explicit, ...sameSector].slice(0, limit);
}

// Products
export function getAllProducts(): MarketplaceProduct[] {
  return MARKETPLACE_PRODUCTS;
}

export function getProductBySlug(slug: string): MarketplaceProduct | undefined {
  return MARKETPLACE_PRODUCTS.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase()
  );
}

export function getFeaturedProducts(limit = 8): MarketplaceProduct[] {
  return MARKETPLACE_PRODUCTS.slice(0, limit);
}

export function getProductsByCompanySlug(companySlug: string): MarketplaceProduct[] {
  return MARKETPLACE_PRODUCTS.filter(
    (p) => p.companySlug.toLowerCase() === companySlug.toLowerCase()
  );
}

export function getRelatedProducts(product: MarketplaceProduct, limit = 4): MarketplaceProduct[] {
  return MARKETPLACE_PRODUCTS.filter(
    (p) => (p.category === product.category || p.sector === product.sector) && p.id !== product.id
  ).slice(0, limit);
}

// Articles
export function getMarketplaceArticles(limit = 4): MarketplaceArticle[] {
  return MARKETPLACE_ARTICLES.slice(0, limit);
}

// Client-side / In-memory Filtering Helpers
export function filterCompanies(
  companies: MarketplaceCompany[],
  filters: Partial<CompanyFilterState>
): MarketplaceCompany[] {
  return companies.filter((company) => {
    // Search query
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      const matchName = company.name.toLowerCase().includes(q);
      const matchSector = company.sector.toLowerCase().includes(q);
      const matchDesc = company.shortDescription.toLowerCase().includes(q);
      const matchLoc = company.location.toLowerCase().includes(q);
      const matchTicker = company.ticker?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchSector && !matchDesc && !matchLoc && !matchTicker) {
        return false;
      }
    }

    // Sector
    if (filters.sector && filters.sector !== "all") {
      if (company.sector.toLowerCase() !== filters.sector.toLowerCase()) {
        return false;
      }
    }

    // SubSector
    if (filters.subSector && filters.subSector !== "all") {
      if (!company.subSector.toLowerCase().includes(filters.subSector.toLowerCase())) {
        return false;
      }
    }

    // Company Type
    if (filters.companyType && filters.companyType !== "all") {
      if (company.companyType.toLowerCase() !== filters.companyType.toLowerCase()) {
        return false;
      }
    }

    // Location
    if (filters.location && filters.location !== "all") {
      if (!company.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Listed Status
    if (filters.listedStatus && filters.listedStatus !== "all") {
      if (filters.listedStatus === "listed" && !company.listed) return false;
      if (filters.listedStatus === "unlisted" && company.listed) return false;
    }

    return true;
  });
}

export function filterProducts(
  products: MarketplaceProduct[],
  filters: Partial<ProductFilterState>
): MarketplaceProduct[] {
  return products.filter((product) => {
    // Search query
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchCategory = product.category.toLowerCase().includes(q);
      const matchCompany = product.companyName.toLowerCase().includes(q);
      const matchDesc = product.shortDescription.toLowerCase().includes(q);
      if (!matchName && !matchCategory && !matchCompany && !matchDesc) {
        return false;
      }
    }

    // Category
    if (filters.category && filters.category !== "all") {
      if (product.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    // SubCategory
    if (filters.subCategory && filters.subCategory !== "all") {
      if (product.subCategory?.toLowerCase() !== filters.subCategory.toLowerCase()) {
        return false;
      }
    }

    // Sector
    if (filters.sector && filters.sector !== "all") {
      if (product.sector.toLowerCase() !== filters.sector.toLowerCase()) {
        return false;
      }
    }

    // Company
    if (filters.companySlug && filters.companySlug !== "all") {
      if (product.companySlug.toLowerCase() !== filters.companySlug.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
}

// Global search helper (used by typeahead)
export interface MarketplaceSearchResults {
  companies: MarketplaceCompany[];
  products: MarketplaceProduct[];
  categories: MarketplaceCategory[];
}

export function searchMarketplace(query: string, limit = 4): MarketplaceSearchResults {
  if (!query || query.trim().length < 2) {
    return { companies: [], products: [], categories: [] };
  }
  const q = query.toLowerCase().trim();

  const companies = MARKETPLACE_COMPANIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      (c.ticker?.toLowerCase().includes(q) ?? false) ||
      c.shortDescription.toLowerCase().includes(q)
  ).slice(0, limit);

  const products = MARKETPLACE_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q)
  ).slice(0, limit);

  const categories = MARKETPLACE_CATEGORIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  ).slice(0, limit);

  return { companies, products, categories };
}

