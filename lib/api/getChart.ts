import type { ChartConfig } from "@/types/data-blocks";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || "https://cms.energdive.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

/**
 * Fetch a single chart by its unique `name` field.
 * Returns null if not found or on error.
 */
export async function getChartByName(name: string): Promise<ChartConfig | null> {
  try {
    const url =
      `${STRAPI_URL}/api/charts?filters[name][$eq]=${encodeURIComponent(name)}&populate=*`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const item = json?.data?.[0];
    if (!item) return null;

    return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      title: item.title,
      chart_type: item.chart_type,
      chart_data: item.chart_data,
      x_key: item.x_key,
      y_keys: item.y_keys,
      colors: item.colors || {},
      description: item.description,
    };
  } catch (err) {
    console.error(`[getChartByName] Failed to fetch chart "${name}":`, err);
    return null;
  }
}
