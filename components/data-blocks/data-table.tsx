"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TableConfig } from "@/types/data-blocks";

type TableRow = Record<string, string | number | null>;

interface CategoryGroupingConfig {
  categoryKey: string;
}

function normalizeFieldKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatTableValue(value: unknown): string {
  if (value === null || value === undefined) return "NA";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : "NA";
  }
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function getCategoryGroupingConfig(config: TableConfig): CategoryGroupingConfig | null {
  const lookup = new Map<string, string>();

  config.columns.forEach((column) => {
    lookup.set(normalizeFieldKey(column.key), column.key);
    lookup.set(normalizeFieldKey(column.label), column.key);
  });

  const firstRow = config.table_data[0];
  if (firstRow) {
    Object.keys(firstRow).forEach((key) => {
      if (!lookup.has(normalizeFieldKey(key))) {
        lookup.set(normalizeFieldKey(key), key);
      }
    });
  }

  const categoryKey = lookup.get(normalizeFieldKey("category"));
  if (!categoryKey) return null;

  return { categoryKey };
}

function groupVisibleRowsByCategory(rows: Row<TableRow>[], config: CategoryGroupingConfig) {
  const groups: Array<{
    category: string;
    rows: Array<{ row: Row<TableRow>; visibleIndex: number }>;
  }> = [];

  let currentGroup:
    | {
      category: string;
      rows: Array<{ row: Row<TableRow>; visibleIndex: number }>;
    }
    | null = null;

  rows.forEach((row, visibleIndex) => {
    const category = formatTableValue(row.original[config.categoryKey]);

    if (currentGroup && currentGroup.category === category) {
      currentGroup.rows.push({ row, visibleIndex });
      return;
    }

    currentGroup = {
      category,
      rows: [{ row, visibleIndex }],
    };
    groups.push(currentGroup);
  });

  return groups;
}

export default function DataTable({ config }: { config: TableConfig }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const groupingConfig = useMemo(() => getCategoryGroupingConfig(config), [config]);
  const isGroupedTable = Boolean(groupingConfig);

  // Build column defs from CMS
  const columns = useMemo<ColumnDef<TableRow>[]>(
    () =>
      config.columns.map((col, idx) => ({
        id: col.key,
        accessorKey: col.key,
        header: col.label,
        cell: (info) => {
          const val = info.getValue();
          return formatTableValue(val);
        },
        // First column is the "label" column (e.g. Country) — left-align, bold
        meta: { isLabelColumn: idx === 0 },
      })),
    [config.columns]
  );

  const table = useReactTable({
    data: config.table_data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const groupedVisibleRows = isGroupedTable
    ? groupVisibleRowsByCategory(
      table.getRowModel().rows as Row<TableRow>[],
      groupingConfig as CategoryGroupingConfig
    )
    : [];

  // CSV download
  const downloadCSV = useCallback(() => {
    const headers = config.columns.map((c) => c.label);
    const keys = config.columns.map((c) => c.key);
    const rows = config.table_data.map((row) =>
      keys.map((k) => {
        const val = row[k];
        const str = formatTableValue(val);
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  if (!config.table_data?.length) {
    return (
      <div className="data-block-card data-block-empty">
        <p>No table data available</p>
      </div>
    );
  }

  return (
    <div className="data-block-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #e5e7eb",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.3,
          }}
        >
          {config.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Search */}
          <div className="data-table-search">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="data-table-search-input"
            />
          </div>
          <button
            onClick={downloadCSV}
            className="data-block-btn"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#ffffff",
                      background: "linear-gradient(135deg, #0d9488, #0f766e)",
                      borderBottom: "2px solid #0d9488",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span style={{ display: "inline-flex", opacity: 0.7 }}>
                        {{
                          asc: <ChevronUp className="w-3.5 h-3.5" />,
                          desc: <ChevronDown className="w-3.5 h-3.5" />,
                        }[header.column.getIsSorted() as string] ?? (
                            <ChevronsUpDown className="w-3.5 h-3.5" style={{ opacity: 0.4 }} />
                          )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isGroupedTable
              ? groupedVisibleRows.map((group) =>
                group.rows.map(({ row, visibleIndex }, rowIndex) => (
                  <tr
                    key={row.id}
                    style={{
                      backgroundColor: visibleIndex % 2 === 0 ? "#ffffff" : "#f0fdfa",
                      borderBottom: "1px solid #e5e7eb",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#ccfbf1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        visibleIndex % 2 === 0 ? "#ffffff" : "#f0fdfa";
                    }}
                  >
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        style={{
                          padding: "0.75rem 1rem",
                          color: "#111827",
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "normal",
                          verticalAlign: "middle",
                          borderRight: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {group.category}
                      </td>
                    ) : null}
                    {row.getVisibleCells().map((cell, cellIdx) => {
                      if (
                        normalizeFieldKey(cell.column.id) === normalizeFieldKey(
                          (groupingConfig as CategoryGroupingConfig).categoryKey
                        )
                      ) {
                        return null;
                      }

                      return (
                        <td
                          key={cell.id}
                          style={{
                            padding: "0.75rem 1rem",
                            color: cellIdx === 0 ? "#111827" : "#374151",
                            fontWeight: cellIdx === 0 ? 600 : 400,
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )
              : table.getRowModel().rows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: rowIdx % 2 === 0 ? "#ffffff" : "#f0fdfa",
                    borderBottom: "1px solid #e5e7eb",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#ccfbf1";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      rowIdx % 2 === 0 ? "#ffffff" : "#f0fdfa";
                  }}
                >
                  {row.getVisibleCells().map((cell, cellIdx) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: "0.75rem 1rem",
                        color: cellIdx === 0 ? "#111827" : "#374151",
                        fontWeight: cellIdx === 0 ? 600 : 400,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="data-block-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="data-block-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.625rem 1.25rem",
          borderTop: "1px solid #f3f4f6",
          fontSize: "0.6875rem",
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 500,
        }}
      >

        <span>{config.table_data.length} rows</span>
      </div>
    </div>
  );
}
