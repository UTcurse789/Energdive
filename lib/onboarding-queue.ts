"use client";

export type OnboardingStepId =
  | "home-news-hint"
  | "header-login-hint"
  | "save-button-hint"
  | "sidebar-news-hint"
  | "premium-scroll-hint"
  | "newsletter-hint";

const STEP_ORDER: OnboardingStepId[] = [
  "home-news-hint",
  "header-login-hint",
  "save-button-hint",
  "sidebar-news-hint",
  "premium-scroll-hint",
  "newsletter-hint",
];

type QueueListener = () => void;

class OnboardingQueue {
  private activeStep: OnboardingStepId | null = null;
  private readySteps = new Set<OnboardingStepId>();
  private listeners = new Set<QueueListener>();

  subscribe(listener: QueueListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getActiveStep() {
    return this.activeStep;
  }

  register(stepId: OnboardingStepId) {
    this.readySteps.add(stepId);
    this.pickNextStep();
    this.emit();
  }

  unregister(stepId: OnboardingStepId) {
    this.readySteps.delete(stepId);

    if (this.activeStep === stepId) {
      this.activeStep = null;
      this.pickNextStep();
    }

    this.emit();
  }

  complete(stepId: OnboardingStepId) {
    this.readySteps.delete(stepId);

    if (this.activeStep === stepId) {
      this.activeStep = null;
    }

    this.pickNextStep();
    this.emit();
  }

  private pickNextStep() {
    if (this.activeStep) return;

    const nextReadyStep = STEP_ORDER.find((stepId) =>
      this.readySteps.has(stepId),
    );

    this.activeStep = nextReadyStep ?? null;
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

declare global {
  interface Window {
    __energdiveOnboardingQueue?: OnboardingQueue;
  }
}

export function getOnboardingQueue() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window.__energdiveOnboardingQueue) {
    window.__energdiveOnboardingQueue = new OnboardingQueue();
  }

  return window.__energdiveOnboardingQueue;
}
