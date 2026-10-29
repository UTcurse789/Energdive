"use client";

import { useEffect } from "react";

/**
 * Keep the News hub available through navigation, but send a browser refresh
 * of /news back to the primary homepage.
 */
export function ReloadNewsToHome() {
  useEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

    if (navigation?.type === "reload" && window.location.pathname === "/news") {
      window.location.replace("/");
    }
  }, []);

  return null;
}
