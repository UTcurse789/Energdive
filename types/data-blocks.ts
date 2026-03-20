// ─── Chart Config (from Strapi "Charts" collection) ───

export interface ChartConfig {
  id: number;
  documentId: string;
  name: string;
  title: string;
  chart_type: "line" | "bar";
  chart_data: Record<string, string | number>[];
  x_key: string;
  y_keys: string[];
  colors: Record<string, string>;
  description?: string | null;
}

// ─── Table Config (from Strapi "Tables" collection) ───

export interface TableColumnDef {
  key: string;
  label: string;
}

export interface TableConfig {
  id: number;
  documentId: string;
  name: string;
  title: string;
  columns: TableColumnDef[];
  table_data: Record<string, string | number>[];
}

// ─── Parsed content block types ───

export type DataBlockType = "chart" | "table";

export interface DataBlockRef {
  type: DataBlockType;
  name: string;
}

/** Plain object of shortcode key → fetched config (serializable across RSC → client) */
export type DataBlocksMap = Record<string, ChartConfig | TableConfig>;
