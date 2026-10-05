import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { MarketplaceCompany } from "@/data/marketplace/types";

interface CompanySpotlightProps {
  companies?: MarketplaceCompany[];
  featuredCompany?: MarketplaceCompany;
  alsoExplore?: MarketplaceCompany[];
}

export function CompanySpotlight({
  companies,
  featuredCompany,
  alsoExplore = [],
}: CompanySpotlightProps) {
  // Support both direct list of companies or legacy featured + alsoExplore
  const list: MarketplaceCompany[] =
    companies && companies.length > 0
      ? companies
      : [featuredCompany, ...alsoExplore].filter(
          (c): c is MarketplaceCompany => Boolean(c)
        );

  if (list.length === 0) return null;

  return (
    <section className="max-w-[1240px] mx-auto px-6 sm:px-6 lg:px-8 font-sans">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            ORGANIZATION DIRECTORY
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
            COMPANY SPOTLIGHT
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            Leading public, private, and multinational energy enterprises active on the Energdive Marketplace.
          </p>
        </div>

        <Link
          href="/marketplace/companies"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors shrink-0"
        >
          <span>View All Companies Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column Grid: 4 Companies per Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {list.slice(0, 4).map((company) => {
          const monogram = company.name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();

          return (
            <div
              key={company.id}
              className="group bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-[#00A651] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* 1. Logo Showcase Box (Replaces generic image) */}
                <div className="relative h-44 sm:h-48 bg-gradient-to-b from-zinc-50 to-zinc-100/60 border-b border-zinc-100 flex items-center justify-center p-6 group-hover:from-emerald-50/40 group-hover:to-zinc-50 transition-colors">
                  {/* Floating Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#00A651] bg-white/95 backdrop-blur-xs border border-emerald-200/80 px-2.5 py-0.5 rounded shadow-2xs">
                      {company.sector}
                    </span>
                    {company.listed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/95 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#00A651]" />
                        {company.ticker ? `NSE: ${company.ticker}` : "Listed"}
                      </span>
                    )}
                  </div>

                  {/* Centered Company Logo */}
                  {company.logo ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={company.logo}
                        alt={company.name}
                        width={200}
                        height={80}
                        className="object-contain max-h-20 max-w-[85%] group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xl">
                      {monogram}
                    </div>
                  )}

                  {/* Subtle bottom badge for company type */}
                  <div className="absolute bottom-2.5 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/90 border border-zinc-200 px-2 py-0.5 rounded">
                      {company.companyType}
                    </span>
                  </div>
                </div>

                {/* 2. Company Details */}
                <div className="p-5">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-1 mb-1.5">
                    <Link href={`/marketplace/companies/${company.slug}`}>
                      {company.name}
                    </Link>
                  </h3>

                  {/* Location info */}
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="line-clamp-1">{company.location}</span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                    {company.shortDescription || company.description}
                  </p>
                </div>
              </div>

              {/* 3. Card Footer */}
              <div className="p-5 pt-3 border-t border-zinc-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    {company.businessAreas?.length
                      ? `${company.businessAreas.length} Domains`
                      : "Verified Vendor"}
                  </span>
                </div>

                <Link
                  href={`/marketplace/companies/${company.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 group-hover:text-[#00A651] transition-colors"
                >
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
