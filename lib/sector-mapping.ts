import { slugify } from "@/lib/utils";

/**
 * Maps known tags, categories, sub-sectors, and keywords to their primary sector slug.
 * Canonical sector slugs:
 * - oil-gas
 * - power-generation
 * - renewables
 * - transmission
 * - distribution
 * - electricity-markets
 * - new-energies
 * - energy-storage
 * - sustainability-and-safety
 */
export const TAG_TO_SECTOR_MAP: Record<string, string> = {
  // Oil & Gas
  "oil & gas": "oil-gas",
  "oil and gas": "oil-gas",
  "oil-gas": "oil-gas",
  "oil": "oil-gas",
  "gas": "oil-gas",
  "lng": "oil-gas",
  "lpg": "oil-gas",
  "cgd": "oil-gas",
  "upstream": "oil-gas",
  "midstream": "oil-gas",
  "downstream": "oil-gas",
  "refining": "oil-gas",
  "oil-and-gas-refining": "oil-gas",
  "oil-and-gas-upstream": "oil-gas",
  "oil-and-gas-downstream": "oil-gas",
  "oil-and-gas-midstream": "oil-gas",
  "oil-and-gas-retail": "oil-gas",
  "oil-and-gas-cgd": "oil-gas",
  "oil-and-gas-lpg": "oil-gas",
  "oil markets": "oil-gas",
  "oil-markets": "oil-gas",
  "petrochemicals": "oil-gas",
  "pipelines": "oil-gas",

  // Power Generation
  "power generation": "power-generation",
  "power-generation": "power-generation",
  "power": "power-generation",
  "thermal": "power-generation",
  "thermal-1": "power-generation",
  "nuclear": "power-generation",
  "nuclear power": "power-generation",
  "nuclear-power": "power-generation",

  // Renewables
  "renewables": "renewables",
  "renewable energy": "renewables",
  "solar": "renewables",
  "renewables-solar": "renewables",
  "wind": "renewables",
  "hydro": "renewables",
  "renewables-hydro": "renewables",
  "biofuels": "renewables",
  "biopower": "renewables",
  "renewable-biopower": "renewables",
  "green energy": "renewables",
  "green-energy": "renewables",
  "pumped hydro": "renewables",
  "pumped-hydro": "renewables",

  // Transmission & Grid
  "transmission": "transmission",
  "transmission & distribution": "transmission",
  "transmission-and-distribution": "transmission",
  "smart grid": "transmission",
  "smart-grid": "transmission",
  "grid": "transmission",
  "interconnected grids": "transmission",
  "smart meters & ami": "transmission",
  "smart-meters-and-ami": "transmission",
  "smart-meters-and-ami-1": "transmission",

  // Distribution & Utilities
  "distribution": "distribution",
  "utilities": "distribution",
  "retail": "distribution",

  // Electricity & Power Markets
  "electricity markets": "electricity-markets",
  "electricity-markets": "electricity-markets",
  "power markets": "electricity-markets",
  "power-markets": "electricity-markets",
  "electricity- carbon markets": "electricity-markets",
  "electricity-carbon-markets": "electricity-markets",
  "energy trading": "electricity-markets",
  "energy-trading": "electricity-markets",
  "power exchange": "electricity-markets",

  // New Energies & Hydrogen
  "new energies": "new-energies",
  "new-energies": "new-energies",
  "green hydrogen": "new-energies",
  "green-hydrogen": "new-energies",
  "new-energies-green-hydrogen": "new-energies",
  "hydrogen economy": "new-energies",
  "hydrogen-economy": "new-energies",
  "green amonia": "new-energies",
  "e-fuels": "new-energies",
  "alternative fuel": "new-energies",
  "alternative-fuel": "new-energies",
  "carbon capture utilization & storage (ccus)": "new-energies",
  "carbon-capture-utilization-and-storage-ccus": "new-energies",
  "old - ccus": "new-energies",

  // Energy Storage
  "energy storage": "energy-storage",
  "energy-storage": "energy-storage",
  "energy storage systems": "energy-storage",
  "energy-storage-systems": "energy-storage",
  "bess": "energy-storage",
  "battery energy storage systems (bess)": "energy-storage",

  // Sustainability & Safety
  "sustainability & safety": "sustainability-and-safety",
  "sustainability-and-safety": "sustainability-and-safety",
  "sustainability": "sustainability-and-safety",
  "safety & environment": "sustainability-and-safety",
  "safety-and-environment": "sustainability-and-safety",
  "safety & occupational health": "sustainability-and-safety",
  "safety-and-occupational-health": "sustainability-and-safety",
  "industrial & process safety": "sustainability-and-safety",
  "industrial-and-process-safety": "sustainability-and-safety",
  "safety-energy-efficiency": "sustainability-and-safety",
  "occupational health": "sustainability-and-safety",
  "occupational-health": "sustainability-and-safety",
  "climate finance": "sustainability-and-safety",
  "climate-finance": "sustainability-and-safety",
  "energy efficiency": "sustainability-and-safety",
  "energy-efficiency": "sustainability-and-safety",
  "energy conservation": "sustainability-and-safety",
  "energy-conservation": "sustainability-and-safety",
  "esg": "sustainability-and-safety",
  "environment": "sustainability-and-safety",
  "net zero": "sustainability-and-safety",
  "old - net zero": "sustainability-and-safety",

  // Policy & General
  "policy": "sustainability-and-safety",
  "finance": "electricity-markets",
  "investment": "electricity-markets",
  "digitalisation": "transmission",
  "infrastructure": "transmission",
  "technology": "new-energies",
  "energy security": "sustainability-and-safety",
  "energy-security": "sustainability-and-safety",
  "energy transition": "renewables",
  "energy-transition": "renewables",
  "energy diplomacy": "sustainability-and-safety",
  "energy-diplomacy": "sustainability-and-safety",
  "supply chain": "distribution",
  "supply-chain": "distribution",
};

/**
 * Returns the correct sector slug for any category, tag, or sector name/slug.
 * Defaults to looking up in TAG_TO_SECTOR_MAP before falling back to slugify().
 */
export function getSectorSlugForTagOrCategory(
  nameOrSlug?: string,
  explicitSectorSlug?: string
): string {
  if (explicitSectorSlug && explicitSectorSlug.trim()) {
    const normExplicit = explicitSectorSlug.trim().toLowerCase();
    if (TAG_TO_SECTOR_MAP[normExplicit]) {
      return TAG_TO_SECTOR_MAP[normExplicit];
    }
    return slugify(explicitSectorSlug);
  }

  if (!nameOrSlug || !nameOrSlug.trim()) {
    return "renewables";
  }

  const normalized = nameOrSlug.trim().toLowerCase();
  if (TAG_TO_SECTOR_MAP[normalized]) {
    return TAG_TO_SECTOR_MAP[normalized];
  }

  const slugified = slugify(nameOrSlug);
  if (TAG_TO_SECTOR_MAP[slugified]) {
    return TAG_TO_SECTOR_MAP[slugified];
  }

  return slugified;
}
