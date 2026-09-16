"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AdBanner = dynamic(
  () => import("@/components/ads/AdBanner").then((module) => module.AdBanner),
  { ssr: false }
);

interface DeferredAdBannerProps {
  placement: string;
  sectorSlug?: string;
  variant?: "banner" | "card" | "hero" | "vertical" | "native" | "mobile_banner";
  className?: string;
  maxItems?: number;
  width?: number;
  height?: number;
  adIndex?: number;
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Keeps advertising out of the initial render and network queue so it cannot
 * compete with the page's LCP image. Ads still load shortly after the page is
 * usable, or as soon as the browser becomes idle.
 */
export function DeferredAdBanner(props: DeferredAdBannerProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(() => setShouldLoad(true), { timeout: 4_000 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => setShouldLoad(true), 4_000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return shouldLoad ? <AdBanner {...props} /> : null;
}
