"use client";

import { useEffect } from "react";

type PreferredSourceApi = {
  init: () => void;
};

declare global {
  interface Window {
    PREFERRED_SOURCE?: {
      api?: PreferredSourceApi;
      ready?: () => Promise<PreferredSourceApi>;
    };
  }
}

type PreferredSourceButtonProps = {
  /** Uses Google's light theme unless a dark surface requires otherwise. */
  theme?: "light" | "dark";
  /** Overrides Google's browser-language detection (for example, "en"). */
  lang?: string;
  className?: string;
};

/**
 * Google's declarative Preferred Sources control. The global publisher script
 * is loaded once in the root layout and discovers this element at runtime.
 */
export function PreferredSourceButton({
  theme = "light",
  lang,
  className,
}: PreferredSourceButtonProps) {
  useEffect(() => {
    // The standard script initializes server-rendered controls on first load.
    // Re-run its documented API after App Router navigation so newly mounted
    // declarative controls are discovered too. Google skips data-initialized
    // controls, so this cannot duplicate an existing button.
    void window.PREFERRED_SOURCE?.ready?.().then((preferredSource) => {
      preferredSource.init();
    });
  }, []);

  return (
    <div
      className={className}
      google-add-preferred-source-btn=""
      data-theme={theme}
      {...(lang ? { "data-lang": lang } : {})}
    />
  );
}
