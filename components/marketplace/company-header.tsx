"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileStack,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketplaceCompany } from "@/data/marketplace/types";
import { EnquiryModal } from "./enquiry-modal";

interface CompanyHeaderProps {
  company: MarketplaceCompany;
  productCount?: number;
  documentCount?: number;
}

export function CompanyHeader({
  company,
  productCount = 0,
  documentCount = 0,
}: CompanyHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monogram = company.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const metrics = [
    {
      label: "Profile status",
      value: "Verified",
      detail: "Directory reviewed",
      icon: ShieldCheck,
    },
    {
      label: "Compliance profile",
      value: company.listed ? "Public disclosure" : "Vendor declared",
      detail: company.listed ? company.exchange || "Public record" : "Company record",
      icon: CheckCircle2,
    },
    {
      label: "Active solutions",
      value: `${productCount}`,
      detail: productCount === 1 ? "Published offering" : "Published offerings",
      icon: Sparkles,
    },
    {
      label: "Technical library",
      value: `${documentCount}`,
      detail: documentCount === 1 ? "Downloadable asset" : "Downloadable assets",
      icon: FileStack,
    },
  ];

  return (
    <>
      <header className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#00A651]" />
          <div className="px-5 pb-7 pt-8 sm:px-7 sm:pb-8 sm:pt-10">
          <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 text-lg font-bold text-zinc-700 shadow-sm sm:h-[76px] sm:w-[76px] sm:text-xl">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`}
                    fill
                    sizes="76px"
                    className="object-contain p-1.5"
                  />
                ) : (
                  <span>{monogram}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00A651]/25 bg-[#00A651]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#00A651]">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified vendor
                  </span>
                  <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                    {company.companyType}
                  </span>
                  {company.listed && (
                    <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                      {company.ticker ? `${company.exchange || "NSE"}: ${company.ticker}` : "Listed"}
                    </span>
                  )}
                </div>

                <h1 className="max-w-4xl font-sans text-2xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-3xl lg:text-[2.1rem]">
                  {company.name}
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                  {company.shortDescription}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#00A651]" />
                    Headquarters: {company.headquarters}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block" />
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                    Founded {company.founded}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {/* <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00A651] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-[#008f45]"
              >
                <Mail className="h-3.5 w-3.5" />
                Contact vendor
              </button> */}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${company.name} website`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          </div>

          <div className="border-t border-zinc-200 bg-zinc-50/80">
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 sm:grid-cols-4 sm:divide-y-0">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00A651]/15 bg-white text-[#00A651]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                      {metric.label}
                    </p>
                    <p className="truncate text-sm font-semibold text-zinc-900">{metric.value}</p>
                    <p className="truncate text-[11px] text-zinc-500">{metric.detail}</p>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </header>

      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={company.id}
        targetName={company.name}
        defaultTargetType="company"
        title={`Contact ${company.name}`}
        subtitle="Send a direct enquiry to this verified vendor through Energdive Marketplace."
      />
    </>
  );
}
