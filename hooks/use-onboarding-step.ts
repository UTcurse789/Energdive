"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOnboardingQueue,
  type OnboardingStepId,
} from "@/lib/onboarding-queue";

interface UseOnboardingStepOptions {
  id: OnboardingStepId;
  enabled: boolean;
  delayMs?: number;
  autoHideMs?: number;
  onClose?: () => void;
}

export function useOnboardingStep({
  id,
  enabled,
  delayMs = 0,
  autoHideMs,
  onClose,
}: UseOnboardingStepOptions) {
  const [activeStep, setActiveStep] = useState<OnboardingStepId | null>(() =>
    getOnboardingQueue()?.getActiveStep() ?? null,
  );

  useEffect(() => {
    const queue = getOnboardingQueue();
    if (!queue) return;

    return queue.subscribe(() => {
      setActiveStep(queue.getActiveStep());
    });
  }, []);

  useEffect(() => {
    const queue = getOnboardingQueue();
    if (!queue) return;

    if (!enabled) {
      queue.unregister(id);
      return;
    }

    const timer = window.setTimeout(() => {
      queue.register(id);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      queue.unregister(id);
    };
  }, [delayMs, enabled, id]);

  const close = useCallback(() => {
    onClose?.();
    getOnboardingQueue()?.complete(id);
  }, [id, onClose]);

  useEffect(() => {
    if (!autoHideMs || activeStep !== id) return;

    const timer = window.setTimeout(() => {
      close();
    }, autoHideMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeStep, autoHideMs, close, id]);

  return {
    isOpen: activeStep === id,
    close,
  };
}
