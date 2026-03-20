"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, Download, Eye, EyeOff } from "lucide-react";
import type { ChartConfig } from "@/types/data-blocks";

// ─── Custom Tooltip ───
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="data-block-tooltip">
      <p className="data-block-tooltip-label">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="data-block-tooltip-row">
          <span
            className="data-block-tooltip-dot"
            style={{ backgroundColor: entry.color }}
          />
          <span className="data-block-tooltip-name">{entry.name}</span>
          <span className="data-block-tooltip-value">
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function ChartWrapper({ config }: { config: ChartConfig }) {
  const [chartType, setChartType] = useState<"line" | "bar">(
    config.chart_type || "line"
  );
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleChartType = useCallback(() => {
    setChartType((prev) => (prev === "line" ? "bar" : "line"));
  }, []);

  // Filter visible series
  const visibleKeys = useMemo(
    () => config.y_keys.filter((k) => !hiddenSeries.has(k)),
    [config.y_keys, hiddenSeries]
  );

  // CSV download
  const downloadCSV = useCallback(() => {
    const headers = [config.x_key, ...config.y_keys];
    const rows = config.chart_data.map((row) =>
      headers.map((h) => row[h] ?? "").join(",")
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

  if (!config.chart_data?.length) {
    return (
      <div className="data-block-card data-block-empty">
        <p>No chart data available</p>
      </div>
    );
  }

  const ChartComponent = chartType === "bar" ? BarChart : LineChart;

  return (
    <div className="data-block-card">
      {/* Header */}
      <div className="data-block-header">
        <div>
          <h3 className="data-block-title">{config.title}</h3>
          {config.description && (
            <p className="data-block-description">{config.description}</p>
          )}
        </div>
        <div className="data-block-actions">
          <button
            onClick={toggleChartType}
            className="data-block-btn"
            title={`Switch to ${chartType === "line" ? "bar" : "line"} chart`}
          >
            {chartType === "line" ? (
              <BarChart3 className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={downloadCSV}
            className="data-block-btn"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend with toggle */}
      <div className="data-block-legend">
        {config.y_keys.map((key) => {
          const isHidden = hiddenSeries.has(key);
          const color = config.colors?.[key] || "#6b7280";
          return (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              className={`data-block-legend-item ${isHidden ? "data-block-legend-hidden" : ""}`}
            >
              <span
                className="data-block-legend-dot"
                style={{ backgroundColor: isHidden ? "#d1d5db" : color }}
              />
              <span className="data-block-legend-label">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              {isHidden ? (
                <EyeOff className="w-3 h-3 ml-1 text-gray-400" />
              ) : (
                <Eye className="w-3 h-3 ml-1 text-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="data-block-chart-container">
        <ResponsiveContainer width="100%" height={380}>
          <ChartComponent
            data={config.chart_data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.x_key}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(val: number) => val.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />

            {visibleKeys.map((key) => {
              const color = config.colors?.[key] || "#6b7280";

              if (chartType === "bar") {
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={key.charAt(0).toUpperCase() + key.slice(1)}
                    fill={color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                );
              }

              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key.charAt(0).toUpperCase() + key.slice(1)}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Source */}
      <div className="data-block-footer">
        <span>Source: Energdive</span>
      </div>
    </div>
  );
}
