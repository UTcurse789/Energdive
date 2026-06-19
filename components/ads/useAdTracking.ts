"use client";

import { useEffect, useRef, useCallback } from "react";

const TRACK_ENDPOINT = "/api/ad-track";
const AD_TRACKING_ENABLED =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_AD_TRACKING_ENABLED === "true";

const pageViewImpressions = new Set<string>();

/**
 * Lightweight hook for ad impression & click tracking.
 *
 * - Fires an impression event once when the component mounts (per documentId).
 * - Returns a `trackClick` function to be called on ad click.
 */
export function useAdTracking(adDocumentId: string | undefined) {
  const impressionFired = useRef(false);

  // Fire impression once on mount
  useEffect(() => {
    if (!adDocumentId || impressionFired.current) return;
    if (!AD_TRACKING_ENABLED || pageViewImpressions.has(adDocumentId)) return;

    impressionFired.current = true;
    pageViewImpressions.add(adDocumentId);

    // Use sendBeacon for non-blocking fire-and-forget
    const payload = JSON.stringify({
      adDocumentId,
      eventType: "impression",
      referrer: typeof window !== "undefined" ? window.location.pathname : "",
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        TRACK_ENDPOINT,
        new Blob([payload], { type: "application/json" })
      );
    } else {
      fetch(TRACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [adDocumentId]);

  // Click tracker — fire-and-forget, non-blocking
  const trackClick = useCallback(() => {
    if (!AD_TRACKING_ENABLED || !adDocumentId) return;

    const payload = JSON.stringify({
      adDocumentId,
      eventType: "click",
      referrer: typeof window !== "undefined" ? window.location.pathname : "",
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        TRACK_ENDPOINT,
        new Blob([payload], { type: "application/json" })
      );
    } else {
      fetch(TRACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [adDocumentId]);

  return { trackClick };
}
