"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Mail, MapPin, CheckCircle2, Building2 } from "lucide-react";
import { MarketplaceCompany } from "@/data/marketplace/types";
import { EnquiryModal } from "./enquiry-modal";

interface CompanyHeaderProps {
  company: MarketplaceCompany;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monogram = company.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="w-full bg-white py-10 sm:py-14 border-b border-zinc-200 relative overflow-hidden">
        {/* Thin green top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#00A651]" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Logo and Details */}
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Logo */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-xl overflow-hidden border border-zinc-200 shrink-0 shadow-sm">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span>{monogram}</span>
                )}
              </div>

              {/* Meta */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#00A651] bg-[#00A651]/8 px-2.5 py-0.5 rounded border border-[#00A651]/20">
                    {company.sector}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                    {company.companyType}
                  </span>
                  {company.listed && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      {company.ticker ? `NSE: ${company.ticker}` : "Listed"}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
                  {company.name}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>{company.location}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Founded {company.founded}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg bg-white text-zinc-700 border border-zinc-300 hover:border-zinc-500 hover:text-zinc-900 transition-all shadow-sm"
                >
                  <span>Visit Website</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg bg-[#00A651] hover:bg-[#008f45] text-white transition-all shadow-sm cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Enquiry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={company.id}
        targetName={company.name}
        defaultTargetType="company"
      />
    </>
  );
}
