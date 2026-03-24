import { getChartByName } from "@/lib/api/getChart";
import { getTableByName } from "@/lib/api/getTable";
import type { ChartConfig, TableConfig, DataBlocksMap } from "@/types/data-blocks";

/**
 * Regex to match shortcodes: [chart:name] or [table:name]
 * Works inside Strapi paragraph, code, or any block with text children.
 */
const SHORTCODE_RE = /\[(chart|table):([a-zA-Z0-9_-]+)\]/g;

/**
 * Extract the concatenated text from any Strapi block's children.
 */
function getBlockText(block: any): string {
  if (!block || !Array.isArray(block.children)) return "";
  return block.children.map((c: any) => c?.text ?? "").join("");
}

/**
 * Extract all shortcode references from a Strapi blocks array.
 * Scans paragraph, code, and any other block type with text children.
 */
export function extractShortcodes(
  blocks: any[]
): { charts: string[]; tables: string[] } {
  const charts = new Set<string>();
  const tables = new Set<string>();

  for (const block of blocks) {
    const text = getBlockText(block);
    if (!text) continue;

    let match: RegExpExecArray | null;
    SHORTCODE_RE.lastIndex = 0;

    while ((match = SHORTCODE_RE.exec(text)) !== null) {
      const [, type, name] = match;
      if (type === "chart") charts.add(name);
      else if (type === "table") tables.add(name);
    }
  }

  return { charts: [...charts], tables: [...tables] };
}

/**
 * Fetch all referenced chart and table data in parallel.
 * Returns a Map keyed by "chart:name" or "table:name".
 */
export async function fetchDataBlocks(
  blocks: any[]
): Promise<DataBlocksMap> {
  const { charts, tables } = extractShortcodes(blocks);
  const map: DataBlocksMap = {};

  const promises: Promise<void>[] = [];

  for (const name of charts) {
    promises.push(
      getChartByName(name).then((config) => {
        if (config) map[`chart:${name}`] = config;
      })
    );
  }

  for (const name of tables) {
    promises.push(
      getTableByName(name).then((config) => {
        if (config) map[`table:${name}`] = config;
      })
    );
  }

  await Promise.all(promises);
  return map;
}

/**
 * Check if a block's text is ONLY a shortcode (no other text).
 * Handles paragraph, code, and any block type with text children.
 * If so, returns { type, name }. Otherwise returns null.
 */
export function getShortcodeFromBlock(
  block: any
): { type: "chart" | "table"; name: string } | null {
  if (!block || !Array.isArray(block.children)) return null;

  // Strip normal whitespace AND invisible/zero-width characters (very common in CMS rich text like \u200b)
  const cleanText = getBlockText(block).replace(/[\s\u200B-\u200D\uFEFF]/g, "");
  if (!cleanText) return null;

  const match = cleanText.match(/^\[(chart|table):([a-zA-Z0-9_-]+)\]$/);
  if (!match) return null;

  return { type: match[1] as "chart" | "table", name: match[2] };
}
