"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  ONBOARDING_KEYS,
  isSessionFlagSet,
  setSessionFlag,
} from "@/lib/onboarding-storage";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";

interface ArticlePremiumSpotlightProps {
  loginHref: string;
}

export function ArticlePremiumSpotlight({
  loginHref,
}: ArticlePremiumSpotlightProps) {
  const [isEligible, setIsEligible] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    if (isSessionFlagSet(ONBOARDING_KEYS.premiumDiscoveryDismissedSession)) return;

    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (documentHeight <= 0) return;

      const progress = window.scrollY / documentHeight;
      if (progress >= 0.45) {
        setIsEligible(true);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isLoaded, isSignedIn]);

  const { isOpen: isVisible, close: dismiss } = useOnboardingStep({
    id: "premium-scroll-hint",
    enabled:
      isLoaded &&
      !isSignedIn &&
      isEligible &&
      !isSessionFlagSet(ONBOARDING_KEYS.premiumDiscoveryDismissedSession),
    onClose: () => {
      setSessionFlag(ONBOARDING_KEYS.premiumDiscoveryDismissedSession);
    },
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-x-4 bottom-24 z-[65] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]"
        >
          <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/82 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(248,250,252,0.96))]" />

            <div className="relative p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    ENERGCLUB Access
                  </div>
                  <OnboardingProgress step={4} />
                </div>

                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-full border border-slate-200/70 bg-white/85 p-2 text-slate-500 transition-colors hover:text-slate-950"
                  aria-label="Dismiss premium prompt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="font-serif text-[1.45rem] font-bold leading-tight text-slate-950">
                Unlock premium energy intelligence.
              </h3>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {[
                  "Exclusive ENERGCLUB reports",
                  "Weekly market briefings",
                  "Expert insights & analysis",
                  "Early access to industry trends",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={loginHref}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_16px_40px_rgba(15,23,42,0.22)]"
              >
                Login / Join ENERGCLUB
              </Link>

              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                Trusted by energy professionals & decision makers.
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
