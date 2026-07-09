"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle2 } from "lucide-react";
import type { EventResource } from "./types";

export function PremiumPaywall({
  isOpen,
  onClose,
  resource,
}: {
  isOpen: boolean;
  onClose: () => void;
  resource: EventResource | null;
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !resource) return null;

  const contentAccess = resource.content_access;
  if (!contentAccess) return null;

  const { price, currency, preview_enabled, preview_text } = contentAccess;

  const handleBuyNow = () => {
    // FUTURE: Razorpay checkout integration
    console.log("Buy Now clicked", { 
      resourceId: resource.id, 
      price, 
      currency 
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
        {/* Backdrop Dismissal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-zinc-200/60 overflow-hidden z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content Pad */}
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold font-serif text-zinc-900 leading-tight">
                Premium Content
              </h2>
              <p className="text-sm font-semibold text-zinc-700 mt-3 max-w-[280px]">
                {resource.title}
              </p>
            </div>

            {preview_enabled && preview_text && (
              <div className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Preview
                </p>
                <p className="text-sm text-zinc-600 italic line-clamp-4">
                  "{preview_text}"
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">One-time Purchase</p>
                  <p className="text-xs text-zinc-500">Pay once, keep it forever</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-zinc-900">Lifetime Access</p>
                  <p className="text-xs text-zinc-500">Download anytime from your dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-zinc-100 mb-6">
              <span className="text-sm font-semibold text-zinc-500">Total Price</span>
              <span className="text-2xl font-black text-zinc-900">
                {price === 0 ? "Free" : `${currency} ${price.toLocaleString()}`}
              </span>
            </div>

            <button
              onClick={handleBuyNow}
              className="w-full h-11 rounded-xl bg-[#00A651] hover:bg-[#009347] text-white text-sm font-bold shadow-md shadow-emerald-500/10 hover:shadow-lg active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Buy Now
            </button>
          </div>
          
          <div className="border-t border-zinc-100 bg-zinc-50/50 py-3.5 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-400 font-bold">
                Encrypted &amp; Secure Checkout
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
