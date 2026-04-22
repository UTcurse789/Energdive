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
  "sustainability-and-safety": ["Sustainability & Safety", "Sustainability", "Safety"],
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
    `&sort=Date:desc`
  );
}
