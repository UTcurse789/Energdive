"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileStack,
  Mail,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketplaceProduct, MarketplaceCompany } from "@/data/marketplace/types";
import { EnquiryModal } from "./enquiry-modal";

interface ProductHeaderProps {
  product: MarketplaceProduct;
  company?: MarketplaceCompany | null;
  documentCount?: number;
}

export function ProductHeader({
  product,
  company,
  documentCount = 0,
}: ProductHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const metrics = [
    {
      label: "Offering status",
      value: "Verified",
      detail: "Catalogue certified",
      icon: ShieldCheck,
    },
    {
      label: "Manufacturer",
      value: product.companyName || "Vendor declared",
      detail: company?.location ? company.location.split(",")[0] : "Verified partner",
      icon: Building2,
    },
    {
      label: "Technical params",
      value: `${product.specifications?.length || 0}`,
      detail: "Engineering parameters",
      icon: Sparkles,
    },
    {
      label: "Documentation",
      value: `${documentCount}`,
      detail: documentCount === 1 ? "Technical document" : "Technical documents",
      icon: FileStack,
    },
  ];

  return (
    <>
      <header className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 font-sans">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {/* Top Green Accent Bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-[#00A651]" />

          {/* Main Header Content */}
          <div className="px-5 pb-7 pt-8 sm:px-7 sm:pb-8 sm:pt-10">
            <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                {/* Product Image Box */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm sm:h-[88px] sm:w-[88px]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="88px"
                      className="object-contain p-2"
                      priority
                    />
                  ) : (
                    <Package className="h-8 w-8 text-zinc-400" />
                  )}
                </div>

                <div className="min-w-0">
                  {/* Metadata Badges */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00A651]/25 bg-[#00A651]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#00A651]">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified offering
                    </span>
                    <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
                      {product.category}
                    </span>
                    {product.subCategory && (
                      <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                        {product.subCategory}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="max-w-4xl font-sans text-2xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-3xl lg:text-[2.1rem]">
                    {product.name}
                  </h1>

                  {/* Short Description */}
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-[15px]">
                    {product.shortDescription}
                  </p>

                  {/* Meta Strip */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                    {product.companySlug ? (
                      <Link
                        href={`/marketplace/companies/${product.companySlug}`}
                        className="inline-flex items-center gap-1.5 font-medium text-zinc-700 hover:text-[#00A651] transition-colors"
                      >
                        <Building2 className="h-3.5 w-3.5 text-[#00A651]" />
                        Manufacturer: {product.companyName}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-[#00A651]" />
                        Manufacturer: {product.companyName}
                      </span>
                    )}
                    <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block" />
                    <span>Sector: {product.sector}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {/* <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#00A651] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-[#008f45] cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Request RFQ / Enquire
                </button> */}
                {product.companySlug && (
                  <Link
                    href={`/marketplace/companies/${product.companySlug}`}
                    aria-label={`View ${product.companyName} profile`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-[#00A651] hover:text-[#00A651]"
                  >
                    <span>Vendor Profile</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Bottom 4 Metrics Strip */}
          <div className="border-t border-zinc-200 bg-zinc-50/80">
            <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 sm:grid-cols-4 sm:divide-y-0">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00A651]/15 bg-white text-[#00A651]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                        {metric.label}
                      </p>
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {metric.value}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {metric.detail}
                      </p>
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
        targetId={product.id}
        targetName={product.name}
        defaultTargetType="product"
        title={`Request Enquiry: ${product.name}`}
        subtitle={`Connect with ${product.companyName} for technical literature, pricing, and project integration.`}
      />
    </>
  );
}
