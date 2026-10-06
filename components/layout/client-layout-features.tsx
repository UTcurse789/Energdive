"use client";

import dynamic from "next/dynamic";

const ConsentAwareGTM = dynamic(() => import("@/components/ConsentAwareGTM"), { ssr: false });
const AuthPromptModal = dynamic(() => import("@/components/ui/auth-prompt-modal"), { ssr: false });
const OnboardingModal = dynamic(() => import("@/components/onboarding/onboarding-modal"), { ssr: false });
const AuthModal = dynamic(() => import("@/components/auth/auth-modal"), { ssr: false });

export function ClientConsentAwareGTM() {
  return <ConsentAwareGTM gtmId="GTM-5P4C363M" />;
}

export function ClientAuthModals() {
  return (
    <>
      <AuthPromptModal />
      <OnboardingModal />
      <AuthModal />
    </>
  );
}
