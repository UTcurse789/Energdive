import Link from "next/link";
import Image from "next/image";
import { CheckCircle, AlertCircle, ArrowRight, Building2, MapPin } from "lucide-react";
import { MarketplaceProduct, MarketplaceCompany } from "@/data/marketplace/types";

interface ProductSpecsProps {
  product: MarketplaceProduct;
  company?: MarketplaceCompany;
}

export function ProductSpecs({ product, company }: ProductSpecsProps) {
  return (
    <div className="space-y-12">
      {/* 1. Product Overview */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#00A651]" />
          Product Overview
        </h2>
        <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-normal">
          {product.description}
        </p>
      </section>

      {/* 2. Key Features & Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Features */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#00A651]" />
              Key Features & Engineering Highlights
            </h2>
            <ul className="space-y-3.5">
              {product.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#00A651] mt-0.5 shrink-0" />
                  <span className="text-xs sm:text-sm text-zinc-700 font-medium leading-normal">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Applications */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#00A651]" />
              Target Applications & Deployment Scenarios
            </h2>
            <ul className="space-y-3.5">
              {product.applications.map((app, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 mt-2 shrink-0" />
                  <span className="text-xs sm:text-sm text-zinc-700 font-medium leading-normal">
                    {app}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* 3. Technical Specifications Table */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4 mb-6">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00A651]" />
              Technical Parameters & Specifications
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Standard engineering ranges and operational parameters.
            </p>
          </div>

          {/* Transparent prototype notice */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Prototype Data for UI Representation</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <th className="py-3 px-4 w-1/2">Parameter / Specification</th>
                <th className="py-3 px-4 w-1/2">Nominal Value / Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
              {product.specifications.map((spec, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-zinc-800">{spec.label}</td>
                  <td className="py-3 px-4 font-mono text-zinc-600 text-xs sm:text-[13px]">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Manufacturer / Company Section */}
      {company && (
        <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00A651]" />
            Manufactured / Offered By
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-5 rounded-lg border border-zinc-200">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-base overflow-hidden border border-zinc-200 shrink-0">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span>{company.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                  {company.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mt-1">
                  <span className="font-medium text-[#00A651]">{company.sector}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {company.location}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="font-semibold text-zinc-700">{company.companyType}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/marketplace/companies/${company.slug}`}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shrink-0"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>View Company Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
