"use client";

import { type RefObject, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, X } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

interface SaveButtonDiscoveryProps {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
}

type DiscoveryPosition = {
  anchorRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  cardTop: number;
  cardLeft: number;
  cardWidth: number;
};

export function SaveButtonDiscovery({
  anchorRef,
  open,
  onClose,
}: SaveButtonDiscoveryProps) {
  const [position, setPosition] = useState<DiscoveryPosition | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardWidth = viewportWidth < 640 ? Math.min(viewportWidth - 32, 320) : 320;
      const cardHeight = viewportWidth < 640 ? 178 : 166;
      const isMobile = viewportWidth < 640;

      let cardLeft = isMobile ? 16 : rect.right + 18;
      if (!isMobile && cardLeft + cardWidth > viewportWidth - 20) {
        cardLeft = Math.max(16, rect.left - cardWidth - 18);
      }

      let cardTop = isMobile
        ? (rect.top > viewportHeight / 2 ? Math.max(16, rect.top - cardHeight - 16) : rect.bottom + 16)
        : rect.top + rect.height / 2 - cardHeight / 2;

      if (cardTop + cardHeight > viewportHeight - 20) {
        cardTop = viewportHeight - cardHeight - 20;
      }

      if (cardTop < 84) {
        cardTop = 84;
      }

      setPosition({
        anchorRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        cardTop,
        cardLeft,
        cardWidth,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, open]);

  return (
    <AnimatePresence>
      {open && position && (
        <>
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-[74] rounded-full border border-emerald-400/25 bg-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.32),0_16px_44px_rgba(16,185,129,0.12)] backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            style={{
              top: position.anchorRect.top - 6,
              left: position.anchorRect.left - 8,
              width: position.anchorRect.width + 16,
              height: position.anchorRect.height + 12,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[75] overflow-hidden rounded-[24px] border border-white/70 bg-white/80 text-left shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
            style={{
              top: position.cardTop,
              left: position.cardLeft,
              width: position.cardWidth,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,250,252,0.96))]" />

            <motion.div
              className="absolute inset-x-0 top-0 h-1 bg-emerald-500/70 origin-left"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4.5, ease: "linear" }}
            />

            <div className="relative p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Save Stories
                </div>
                <div className="flex items-center gap-2">
                  <OnboardingProgress step={3} />
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200/80 bg-white/85 p-1.5 text-slate-500 transition-colors hover:text-slate-900"
                    aria-label="Dismiss save hint"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="font-serif text-lg font-bold leading-tight text-slate-950">
                Build your personal energy briefcase with one tap on Save.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Keep important stories handy now, then login whenever you want them synced across devices.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
