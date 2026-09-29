import { MARKETPLACE_CATEGORIES } from "./categories";
import type {
  MarketplaceCompany,
  MarketplaceProduct,
} from "./types";

export interface MarketplaceSectorSummary {
  key: string;
  name: string;
  description: string;
  image?: string;
  companyCount: number;
  productCount: number;
}

const UNSPECIFIED_SECTORS = new Set([
  "energy",
  "energyandinfrastructure",
]);

function normalizedSectorKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function sectorGroupKey(value: string): string {
  return value.trim().toLowerCase();
}

function isMarketplaceSector(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  return !UNSPECIFIED_SECTORS.has(normalizedSectorKey(value));
}

function marketplaceSectorDescription(
  name: string,
  companyCount: number,
  productCount: number,
  categoryDescription?: string,
): string {
  if (categoryDescription) return categoryDescription;

  const companyText = `${companyCount} ${companyCount === 1 ? "verified company" : "verified companies"}`;
  const productText = `${productCount} ${productCount === 1 ? "product" : "products"}`;

  if (companyCount && productCount) {
    return `Explore ${companyText} and ${productText} in ${name}.`;
  }

  return companyCount
    ? `Explore ${companyText} in ${name}.`
    : `Explore ${productText} in ${name}.`;
}

/**
 * Produces the marketplace sector rail from live directory data. A sector is
 * included only when at least one approved company or published product is
 * assigned to it.
 */
export function getMarketplaceSectorSummaries(
  companies: MarketplaceCompany[],
  products: MarketplaceProduct[],
): MarketplaceSectorSummary[] {
  const groups = new Map<
    string,
    {
      name: string;
      companyCount: number;
      productCount: number;
      companyImage?: string;
      productImage?: string;
    }
  >();

  const addSector = (
    sector: string | undefined,
    type: "company" | "product",
    image?: string,
  ) => {
    if (!isMarketplaceSector(sector)) return;

    const key = sectorGroupKey(sector);
    const existing = groups.get(key) ?? {
      name: sector.trim(),
      companyCount: 0,
      productCount: 0,
    };

    if (type === "company") {
      existing.companyCount += 1;
      existing.companyImage ||= image;
    } else {
      existing.productCount += 1;
      existing.productImage ||= image;
    }

    groups.set(key, existing);
  };

  companies.forEach((company) =>
    addSector(company.sector, "company", company.coverImage),
  );
  products.forEach((product) =>
    addSector(product.sector, "product", product.image),
  );

  const categoryOrder = new Map(
    MARKETPLACE_CATEGORIES.map((category, index) => [
      normalizedSectorKey(category.name),
      index,
    ]),
  );

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const category = MARKETPLACE_CATEGORIES.find(
        (item) => normalizedSectorKey(item.name) === normalizedSectorKey(group.name),
      );

      return {
        key,
        name: group.name,
        description: marketplaceSectorDescription(
          group.name,
          group.companyCount,
          group.productCount,
          category?.description,
        ),
        image: group.companyImage || group.productImage || category?.image,
        companyCount: group.companyCount,
        productCount: group.productCount,
      };
    })
    .sort((a, b) => {
      const aOrder =
        categoryOrder.get(normalizedSectorKey(a.name)) ?? Number.MAX_SAFE_INTEGER;
      const bOrder =
        categoryOrder.get(normalizedSectorKey(b.name)) ?? Number.MAX_SAFE_INTEGER;

      return aOrder === bOrder
        ? a.name.localeCompare(b.name)
        : aOrder - bOrder;
    });
}
