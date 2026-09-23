"use client";

import { X } from "lucide-react";

export interface FilterChipItem {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChipItem[];
  onClearAll: () => void;
  className?: string;
}

export function FilterChips({
  chips,
  onClearAll,
  className = "",
}: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 mb-6 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
        Active Filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium animate-in fade-in duration-200"
        >
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
            {chip.label}:
          </span>
          <span>{chip.value}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-emerald-600 hover:text-emerald-950 p-0.5 rounded-full hover:bg-emerald-100 transition-colors"
            aria-label={`Remove filter ${chip.label}: ${chip.value}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors ml-2 underline underline-offset-4 cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
