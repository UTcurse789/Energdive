import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { MarketplaceCompany } from "@/data/marketplace/types";

interface CompanyCardProps {
  company: MarketplaceCompany;
}

export function CompanyCard({ company }: CompanyCardProps) {
  // Generate monogram letters if logo is generic or fails
  const monogram = company.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="group relative bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full">
      <div>
        {/* Top Header: Logo + Listed Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="relative w-12 h-12 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-sm overflow-hidden border border-zinc-200 shrink-0">
            {company.logo ? (
              <Image
                src={company.logo}
                alt={company.name}
                fill
                sizes="48px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <span>{monogram}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
              {company.companyType}
            </span>
            {company.listed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#00A651] border border-emerald-200">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {company.ticker ? `NSE: ${company.ticker}` : "Listed"}
              </span>
            )}
          </div>
        </div>

        {/* Company Name */}
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-1">
          <Link href={`/marketplace/companies/${company.slug}`}>
            {company.name}
          </Link>
        </h3>

        {/* Sector and Location (Clean metadata) */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-500 mt-2">
          <span className="font-semibold text-zinc-700">{company.sector}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-300" />
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="line-clamp-1">{company.location}</span>
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs text-zinc-600 mt-3 line-clamp-2 leading-relaxed">
          {company.shortDescription}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>{company.productIds?.length || 0} Solutions</span>
        </div>

        <Link
          href={`/marketplace/companies/${company.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 group-hover:text-[#00A651] uppercase tracking-wider transition-colors"
        >
          <span>View Company</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
