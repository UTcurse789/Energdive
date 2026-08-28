const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

const SECTOR_NAME_MAP: Record<string, string[]> = {
  "oil-gas": ["Oil & Gas", "Oil and Gas"],
  "power-generation": ["Power Generation"],
  renewables: ["Renewables", "Renewable Energy"],
  transmission: ["Transmission"],
  distribution: ["Distribution"],
  "electricity-markets": ["Electricity Markets", "Power Markets"],
  "new-energies": ["New Energies"],
  "energy-storage": ["Energy Storage"],
  "sustainability-and-safety": ["Sustainability & Safety", "Sustainability and Safety", "Sustainability", "Safety"],
};

export function getSectorNames(slug: string): string[] {
  return SECTOR_NAME_MAP[slug] || [slug.replace(/-/g, " ")];
}

export function buildSectorArticlesUrl(slug: string): string {
  const names = getSectorNames(slug);
  let filterStr = `filters[$and][1][$or][0][sectors][slug][$eq]=${encodeURIComponent(slug)}`;

  names.forEach((name, index) => {
    filterStr += `&filters[$and][1][$or][${index + 1}][sectors][name][$containsi]=${encodeURIComponent(name)}`;
  });

  return (
    `${STRAPI_BASE}/api/contents` +
    `?filters[$and][0][$or][0][type_of_content][name][$eq]=Articles` +
    `&filters[$and][0][$or][1][type_of_content][name][$eq]=Featured Stories` +
    `&${filterStr}` +
    `&populate=*` +
    `&sort[0]=publishedAt:desc`
  );
}

/**
 * Safely extracts array of sector objects from ad.sectors (supports both flat and Strapi v4 { data: [...] } formats)
 */
export function getSectorsArray(ad: any): any[] {
  if (!ad || !ad.sectors) return [];
  const sec = ad.sectors;
  if (Array.isArray(sec)) return sec;
  if (sec.data) {
    if (Array.isArray(sec.data)) return sec.data;
    return [sec.data];
  }
  return [];
}

/**
 * Check if an advertisement matches a given sectorSlug by comparing sector slugs and names.
 */
export function isAdMatchingSector(ad: any, sectorSlug: string): boolean {
  if (!sectorSlug) return true;

  const sectors = getSectorsArray(ad);
  if (sectors.length === 0) {
    return false;
  }

  const targetNames = getSectorNames(sectorSlug).map((n) => n.toLowerCase().trim());
  const cleanTargetSlug = sectorSlug.toLowerCase().replace(/-and-/g, "-").replace(/&/g, "").replace(/[^a-z0-9]/g, "");

  return sectors.some((sec: any) => {
    const attrs = sec?.attributes || sec || {};
    const sSlug = (sec?.slug || attrs.slug || "").toLowerCase().trim();
    const sName = (sec?.name || attrs.name || sec?.title || attrs.title || "").toLowerCase().trim();

    if (!sSlug && !sName) return false;

    // 1. Exact or normalized slug match
    if (sSlug) {
      if (sSlug === sectorSlug.toLowerCase().trim()) return true;
      const cleanSSlug = sSlug.replace(/-and-/g, "-").replace(/&/g, "").replace(/[^a-z0-9]/g, "");
      if (cleanSSlug === cleanTargetSlug) return true;
      if (cleanSSlug.includes(cleanTargetSlug) || cleanTargetSlug.includes(cleanSSlug)) return true;
    }

    // 2. Name match (exact, substring, or normalized)
    if (sName) {
      const cleanSName = sName.replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
      for (const tName of targetNames) {
        const cleanTName = tName.replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
        if (sName === tName) return true;
        if (cleanSName === cleanTName) return true;
        if (cleanSName.includes(cleanTName) || cleanTName.includes(cleanSName)) return true;
      }
    }

    return false;
  });
}

