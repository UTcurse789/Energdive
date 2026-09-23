"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Building, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { MarketplaceProduct } from "@/data/marketplace/types";
import { EnquiryModal } from "./enquiry-modal";

interface ProductHeaderProps {
  product: MarketplaceProduct;
}

export function ProductHeader({ product }: ProductHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white border-b border-zinc-200 py-8 sm:py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Product Image */}
            <div className="lg:col-span-5">
              <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-black/80 text-white backdrop-blur-xs">
                    {product.category}
                  </span>
                  {product.subCategory && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-white/90 text-zinc-800 backdrop-blur-xs shadow-xs">
                      {product.subCategory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Product Details & CTA */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
              <div>
                {/* Manufacturer Pill */}
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Offered by
                  </span>
                  <Link
                    href={`/marketplace/companies/${product.companySlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-800 hover:text-[#00A651] bg-zinc-100 hover:bg-zinc-200/80 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Building className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{product.companyName}</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-zinc-900 leading-tight">
                  {product.name}
                </h1>

                {/* Short Description */}
                <p className="text-sm sm:text-base text-zinc-600 font-light mt-3 leading-relaxed">
                  {product.shortDescription}
                </p>

                {/* Sector tags */}
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-[#00A651] border border-emerald-100">
                    <Tag className="w-3 h-3" />
                    Sector: {product.sector}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-zinc-100 text-zinc-600">
                    <ShieldCheck className="w-3 h-3 text-[#00A651]" />
                    Verified B2B Listing
                  </span>
                </div>
              </div>

              {/* Action Box */}
              <div className="pt-6 border-t border-zinc-200 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3.5 rounded-lg bg-[#00A651] hover:bg-[#008f45] text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enquire Now / Request RFQ</span>
                </button>

                <Link
                  href={`/marketplace/companies/${product.companySlug}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-3.5 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors"
                >
                  <span>Company Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

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
