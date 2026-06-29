"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Mail, X } from "lucide-react";
import { usePostHog } from "@posthog/react";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import {
  ONBOARDING_KEYS,
  dismissWithCooldown,
  isArticlePath,
  isCooldownActive,
  isSessionFlagSet,
  recordArticleVisit,
  setSessionFlag,
} from "@/lib/onboarding-storage";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";
import { useAuthModal } from "@/hooks/use-auth-modal";

const NEWSLETTER_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function PlatformOnboarding() {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const { isLoaded, isSignedIn } = useAuth();
  const [isNewsletterEligible, setIsNewsletterEligible] = useState(false);
  const posthog = usePostHog();

  const loginHref = useMemo(() => {
    if (typeof window === "undefined") {
      return `/auth?redirect_url=${encodeURIComponent(pathname)}`;
    }

    return `/auth?redirect_url=${encodeURIComponent(window.location.href)}`;
  }, [pathname]);

  useEffect(() => {
    if (!isArticlePath(pathname) || isSignedIn) {
      const frame = window.requestAnimationFrame(() => {
        setIsNewsletterEligible(false);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }
  }, [isSignedIn, pathname]);

  useEffect(() => {
    if (!isLoaded || isSignedIn || !isArticlePath(pathname)) return;
    if (isCooldownActive(ONBOARDING_KEYS.newsletterDismissedAt, NEWSLETTER_DISMISS_MS)) return;
    if (isSessionFlagSet(ONBOARDING_KEYS.newsletterShownSession)) return;

    const visitCount = recordArticleVisit(pathname);
    const delayMs = visitCount >= 2 ? 3000 : 8000;

    const timer = window.setTimeout(() => {
      setIsNewsletterEligible(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isLoaded, isSignedIn, pathname]);

  const dismissNewsletter = () => {
    dismissWithCooldown(ONBOARDING_KEYS.newsletterDismissedAt);
    setIsNewsletterEligible(false);
  };

  const { isOpen: showNewsletterPrompt, close: closeNewsletterPrompt } =
    useOnboardingStep({
      id: "newsletter-hint",
      enabled:
        isLoaded &&
        !isSignedIn &&
        isArticlePath(pathname) &&
        isNewsletterEligible &&
        !isCooldownActive(
          ONBOARDING_KEYS.newsletterDismissedAt,
          NEWSLETTER_DISMISS_MS,
        ) &&
        !isSessionFlagSet(ONBOARDING_KEYS.newsletterShownSession),
      onClose: () => {
        setSessionFlag(ONBOARDING_KEYS.newsletterShownSession);
        setIsNewsletterEligible(false);
      },
    });

  return (
    <AnimatePresence>
      {showNewsletterPrompt && (
        <motion.aside
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="fixed inset-x-4 bottom-24 z-[82] sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-[134px] sm:w-[360px]"
        >
          <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.76),rgba(248,250,252,0.96))]" />

            <div className="relative p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    <BellRing className="h-3.5 w-3.5" />
                    Inbox Briefing
                  </div>
                  <OnboardingProgress step={5} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dismissNewsletter();
                    closeNewsletterPrompt();
                  }}
                  className="rounded-full border border-slate-200/80 bg-white/85 p-2 text-slate-500 transition-colors hover:text-slate-950"
                  aria-label="Dismiss newsletter prompt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight text-slate-950">
                    Get daily & weekly energy briefings directly in your inbox.
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                    Curated Oil & Gas, Power Generation, Renewables, Transmission, Distribution, Electricity Markets, New Energies, Energy Storage, and Sustainability & Safety updates.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  openAuthModal(window.location.href);
                  if (posthog) {
                    posthog.capture("login_clicked", {
                      timestamp: new Date().toISOString(),
                      path: window.location.pathname,
                    });
                  }
                }}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0AB996] to-[#00A651] px-5 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-[#00A651]/25 transition-all duration-300 hover:from-[#099c82] hover:to-[#008c44] hover:shadow-xl hover:shadow-[#00A651]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              >
                Login & Subscribe
              </button>

              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                No spam. Only high-value industry updates.
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
