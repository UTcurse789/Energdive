"use client";

import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  ONBOARDING_KEYS,
  isSessionFlagSet,
  setSessionFlag,
} from "@/lib/onboarding-storage";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";

interface SidebarDiscoverySpotlightProps {
  children: React.ReactNode;
}

export function SidebarDiscoverySpotlight({
  children,
}: SidebarDiscoverySpotlightProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isOpen: isActive, close } = useOnboardingStep({
    id: "sidebar-news-hint",
    enabled:
      isLoaded &&
      !isSignedIn &&
      !isSessionFlagSet(ONBOARDING_KEYS.latestNewsRailSeenSession),
    delayMs: 400,
    autoHideMs: 3200,
    onClose: () => {
      setSessionFlag(ONBOARDING_KEYS.latestNewsRailSeenSession);
    },
  });

  return (
    <div className="relative">
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-3 rounded-[30px] border border-emerald-300/55 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_60%)] shadow-[0_24px_80px_rgba(5,150,105,0.12)]"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-none absolute left-3 right-3 top-3 z-10 rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:left-5 sm:right-5"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Latest News
                </div>
                <div className="flex items-center gap-2">
                  <OnboardingProgress step={2} />
                  <button
                    type="button"
                    onClick={close}
                    className="pointer-events-auto rounded-full border border-slate-200/80 bg-white/85 p-1.5 text-slate-500 transition-colors hover:text-slate-900"
                    aria-label="Dismiss latest news hint"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="font-serif text-lg font-bold leading-tight text-slate-950">
                Stay updated with the latest energy sector developments in real-time.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Renewables • Oil & Gas • Power • EV • Hydrogen
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}
