import type { TableConfig } from "@/types/data-blocks";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || "https://cms.energdive.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

/**
 * Fetch a single table by its unique `name` field.
 * Returns null if not found or on error.
 */
export async function getTableByName(name: string): Promise<TableConfig | null> {
  try {
    const url =
      `${STRAPI_URL}/api/tables?filters[name][$eq]=${encodeURIComponent(name)}&populate=*`;

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

    // Strapi field has a typo: "tabel_data" instead of "table_data"
    const rawColumns: any[] = item.columns || [];
    const columns = rawColumns.map((col: any) => {
      if (typeof col === "string") {
        // Plain string → generate label from key (capitalize first letter)
        return { key: col, label: col.charAt(0).toUpperCase() + col.slice(1) };
      }
      return col; // Already {key, label}
    });

    return {
      id: item.id,
      documentId: item.documentId,
      name: item.name,
      title: item.title,
      columns,
      table_data: item.tabel_data || item.table_data || [],
    };
  } catch (err) {
    console.error(`[getTableByName] Failed to fetch table "${name}":`, err);
    return null;
  }
}
