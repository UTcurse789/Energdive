"use client";

import { type RefObject, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Sparkles, X } from "lucide-react";
import { usePostHog } from "@posthog/react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

interface SaveLoginPromptProps {
  anchorRef: RefObject<HTMLElement | null>;
  loginHref: string;
  open: boolean;
  onClose: () => void;
}

type PromptPosition = {
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

export function SaveLoginPrompt({
  anchorRef,
  loginHref,
  open,
  onClose,
}: SaveLoginPromptProps) {
  const [position, setPosition] = useState<PromptPosition | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardWidth = viewportWidth < 640 ? Math.min(viewportWidth - 32, 340) : 360;
      const cardHeight = viewportWidth < 640 ? 228 : 212;
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
          <motion.button
            type="button"
            aria-label="Close save prompt"
            className="fixed inset-0 z-[78] bg-slate-950/[0.03] backdrop-blur-[1.5px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-[79] rounded-full border border-emerald-400/30 bg-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_20px_60px_rgba(14,116,84,0.12)] backdrop-blur-md"
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
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed z-[80] overflow-hidden rounded-[26px] border border-white/70 bg-white/80 text-left shadow-[0_30px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl"
            style={{
              top: position.cardTop,
              left: position.cardLeft,
              width: position.cardWidth,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(248,250,252,0.94))]" />

            <div className="relative p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    <Lock className="h-3.5 w-3.5" />
                    Save & Sync
                  </div>
                  <OnboardingProgress step={1} total={2} />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-slate-200/80 bg-white/80 p-2 text-slate-500 transition-colors hover:text-slate-900"
                  aria-label="Dismiss save prompt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5 flex items-start gap-3">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-bold leading-tight text-slate-950">
                    Save important stories, build your personal energy briefcase, and access them anytime.
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Login required to sync saved articles across devices.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={loginHref}
                  onClick={() => {
                    if (posthog) {
                      posthog.capture("login_clicked", {
                        timestamp: new Date().toISOString(),
                        path: window.location.pathname,
                      });
                    }
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_16px_40px_rgba(15,23,42,0.22)]"
                >
                  Login to Save
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
