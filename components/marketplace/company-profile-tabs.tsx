"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { BarChart3, FileStack, Lightbulb, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export type CompanyProfileTabId =
  | "overview"
  | "solutions"
  | "assets"
  | "insights";

interface CompanyProfileTabsProps {
  overview: ReactNode;
  solutions: ReactNode;
  assets: ReactNode;
  insights: ReactNode;
  counts?: Partial<Record<CompanyProfileTabId, number>>;
}

const profileTabs = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "solutions" as const, label: "Products & Solutions", icon: Package },
  { id: "assets" as const, label: "Technical Assets & Documents", icon: FileStack },
  { id: "insights" as const, label: "Insights & Media", icon: Lightbulb },
];

/**
 * The company header uses the `company-profile-tab` event for its quick
 * actions. Keeping tab ownership here lets the server-rendered page retain
 * metadata and still offer immediate, app-like navigation.
 */
export function CompanyProfileTabs({
  overview,
  solutions,
  assets,
  insights,
  counts = {},
}: CompanyProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<CompanyProfileTabId>("overview");
  const panelId = useId();

  useEffect(() => {
    const openRequestedTab = (event: Event) => {
      const requestedTab = (event as CustomEvent<CompanyProfileTabId>).detail;
      if (profileTabs.some((tab) => tab.id === requestedTab)) {
        setActiveTab(requestedTab);
      }
    };

    const openTabFromHash = () => {
      const requestedTab = window.location.hash.replace("#", "") as CompanyProfileTabId;
      if (profileTabs.some((tab) => tab.id === requestedTab)) {
        setActiveTab(requestedTab);
      }
    };

    window.addEventListener("company-profile-tab", openRequestedTab);
    window.addEventListener("hashchange", openTabFromHash);
    openTabFromHash();

    return () => {
      window.removeEventListener("company-profile-tab", openRequestedTab);
      window.removeEventListener("hashchange", openTabFromHash);
    };
  }, []);

  const panels: Record<CompanyProfileTabId, ReactNode> = {
    overview,
    solutions,
    assets,
    insights,
  };

  return (
    <section id="company-profile-tabs" className="scroll-mt-36">
      <div className="rounded-xl border border-zinc-200 bg-white/95 px-2 py-2 shadow-sm backdrop-blur-xl sm:top-[118px] sm:px-3 md:top-[128px]" role="tablist" aria-label="Company profile sections">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {profileTabs.map((tab) => {
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
                  "relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors sm:px-4",
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
        aria-label={profileTabs.find((tab) => tab.id === activeTab)?.label}
        className="mx-auto max-w-[1400px] px-0 py-8 sm:py-10"
      >
        {panels[activeTab]}
      </div>
    </section>
  );
}
