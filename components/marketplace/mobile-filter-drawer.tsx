"use client";

import { useEffect, useRef } from "react";
import { X, SlidersHorizontal, RotateCcw } from "lucide-react";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  totalResults: number;
  onClearAll: () => void;
  children: React.ReactNode;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  title = "Filters",
  totalResults,
  onClearAll,
  children,
}: MobileFilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Prevent background scrolling when open & trap Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-filter-title"
      className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Drawer Content */}
      <div
        ref={drawerRef}
        className="relative bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-300 border-t border-zinc-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#00A651]" />
            <h2 id="mobile-filter-title" className="text-sm font-black uppercase tracking-wider text-zinc-900">
              {title}
            </h2>
            <span className="text-xs font-semibold text-zinc-400">
              ({totalResults} Results)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-red-600 transition-colors uppercase tracking-wider mr-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClearAll();
            }}
            className="flex-1 py-3 px-4 bg-white border border-zinc-300 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-2 py-3 px-4 bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm text-center"
          >
            Show {totalResults} Results
          </button>
        </div>
      </div>
    </div>
  );
}
