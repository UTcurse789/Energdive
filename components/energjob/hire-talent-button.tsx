"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2 } from "lucide-react";
import Script from "next/script";

interface HireTalentButtonProps {
  className?: string;
}

export default function HireTalentButton({ className }: HireTalentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formUrl =
    "https://forms.zohopublic.in/itenmedia1/form/EnergyJobs/formperma/USNmNK9kEYjkGuGNyTWPd2UZSYnPEZfI55b1bMKqxKM";

  const getIframeUrl = () => {
    if (typeof window === "undefined") return formUrl;

    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const utmParams: Record<string, string> = {};

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
      return '';
    };

    const urlParams = new URLSearchParams(window.location.search);

    utmKeys.forEach((key) => {
      // 1. URL search parameters
      let val = urlParams.get(key);
      // 2. localStorage (fallback)
      if (!val) {
        val = localStorage.getItem(key);
      }
      // 3. Cookies (fallback)
      if (!val) {
        val = getCookie(key);
      }

      if (val) {
        utmParams[key] = val;
      }
    });

    try {
      const url = new URL(formUrl);
      Object.entries(utmParams).forEach(([key, val]) => {
        url.searchParams.set(key, val);
      });
      return url.toString();
    } catch (e) {
      console.error("[HireTalentButton] Error building form URL:", e);
      return formUrl;
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(true);
    setIsLoading(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpenNewTab = () => {
    window.open(getIframeUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button onClick={handleOpen} className={className}>
        Hire a Talent?
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            {/* Backdrop click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 cursor-pointer"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative z-10 flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-[#fcfdfd]">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black tracking-tight text-[#142020]">
                    Hire Energy Talent
                  </h3>
                  <p className="text-xs text-black/50">
                    Fill out the form below to submit your hiring requirements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Open in New Tab Button */}
                  <button
                    onClick={handleOpenNewTab}
                    className="p-2 rounded-xl text-black/60 hover:text-[#09B697] hover:bg-black/5 transition-colors"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-xl text-black/60 hover:text-red-500 hover:bg-black/5 transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Content / Iframe */}
              <div className="relative flex-1 w-full h-full bg-[#fbfcfb] overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
                    <Loader2 className="w-10 h-10 text-[#09B697] animate-spin" />
                    <p className="mt-3 text-sm font-semibold text-black/60">
                      Loading form...
                    </p>
                  </div>
                )}
                <iframe
                  id="zforms_iframe_id"
                  src={getIframeUrl()}
                  className="w-full h-full border-0"
                  onLoad={() => setIsLoading(false)}
                  allow="geolocation"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Script src="/scripts/zoho-utm.js" strategy="afterInteractive" />
    </>
  );
}
