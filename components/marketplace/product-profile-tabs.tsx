"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { BarChart3, FileStack, Lightbulb, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductProfileTabId =
  | "overview"
  | "specs"
  | "documents"
  | "insights";

interface ProductProfileTabsProps {
  overview: ReactNode;
  specs: ReactNode;
  documents: ReactNode;
  insights: ReactNode;
  counts?: Partial<Record<ProductProfileTabId, number>>;
}

const productTabs = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "specs" as const, label: "Specifications & Parameters", icon: SlidersHorizontal },
  { id: "documents" as const, label: "Technical Documents", icon: FileStack },
  { id: "insights" as const, label: "Related & Insights", icon: Lightbulb },
];

export function ProductProfileTabs({
  overview,
  specs,
  documents,
  insights,
  counts = {},
}: ProductProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProductProfileTabId>("overview");
  const panelId = useId();

  useEffect(() => {
    const openRequestedTab = (event: Event) => {
      const requestedTab = (event as CustomEvent<ProductProfileTabId>).detail;
      if (productTabs.some((tab) => tab.id === requestedTab)) {
        setActiveTab(requestedTab);
      }
    };

    const openTabFromHash = () => {
      const requestedTab = window.location.hash.replace("#", "") as ProductProfileTabId;
      if (productTabs.some((tab) => tab.id === requestedTab)) {
        setActiveTab(requestedTab);
      }
    };

    window.addEventListener("product-profile-tab", openRequestedTab);
    window.addEventListener("hashchange", openTabFromHash);
    openTabFromHash();

    return () => {
      window.removeEventListener("product-profile-tab", openRequestedTab);
      window.removeEventListener("hashchange", openTabFromHash);
    };
  }, []);

  const panels: Record<ProductProfileTabId, ReactNode> = {
    overview,
    specs,
    documents,
    insights,
  };

  return (
    <section id="product-profile-tabs" className="scroll-mt-36 font-sans">
      <div
        className="rounded-xl border border-zinc-200 bg-white/95 px-2 py-2 shadow-sm backdrop-blur-xl sm:px-3"
        role="tablist"
        aria-label="Product profile sections"
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {productTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = counts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${panelId}-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.history.replaceState(null, "", `#${tab.id}`);
                }}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors sm:px-4 cursor-pointer",
                  isActive
                    ? "bg-[#00A651] text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {typeof count === "number" && count > 0 && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                      isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${panelId}-${activeTab}`}
        role="tabpanel"
        aria-label={productTabs.find((tab) => tab.id === activeTab)?.label}
        className="mx-auto max-w-[1400px] px-0 py-8 sm:py-10"
      >
        {panels[activeTab]}
      </div>
    </section>
  );
}
