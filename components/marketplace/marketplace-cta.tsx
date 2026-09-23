"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { EnquiryModal } from "./enquiry-modal";

export function MarketplaceCTA() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative border-t border-b border-zinc-200 py-14 sm:py-16">
          {/* Left Green Accent Stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00A651]" />
          {/* Soft green tint */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00A651]/3 via-transparent to-transparent pointer-events-none" />

          <div className="pl-8 sm:pl-12 relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
                PARTNER ECOSYSTEM
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950 leading-tight mb-3">
                BUILD YOUR PRESENCE ON ENERGDIVE
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed">
                Connect your company, products and technologies with energy professionals, procurement teams, utilities, and institutional investors actively specifying equipment across the Asian energy market.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded-lg bg-[#00A651] hover:bg-[#008f45] text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <span>List Your Company</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-7 py-3.5 rounded-lg bg-white text-zinc-700 border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
              >
                Editorial Partnership
              </Link>
            </div>
          </div>
        </div>
      </section>

      <EnquiryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultTargetType="general"
        targetName="Marketplace Onboarding & Listing"
        title="List Your Company on Energdive Marketplace"
        subtitle="Submit your company and solution details for editorial review and directory inclusion."
      />
    </>
  );
}