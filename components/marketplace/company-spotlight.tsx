import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, MapPin, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";
import { MarketplaceCompany } from "@/data/marketplace/types";

interface CompanySpotlightProps {
  featuredCompany: MarketplaceCompany;
  alsoExplore: MarketplaceCompany[];
}

export function CompanySpotlight({ featuredCompany, alsoExplore }: CompanySpotlightProps) {
  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            ORGANIZATION PROFILE
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950">
            COMPANY SPOTLIGHT
          </h2>
        </div>

        <Link
          href="/marketplace/companies"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
        >
          <span>View All Companies Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid: Large Featured Profile (Left 8 cols) + Also Explore (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large Featured Company Card */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00A651] bg-[#00A651]/8 border border-[#00A651]/20 px-2.5 py-1 rounded">
                  {featuredCompany.sector}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 border border-zinc-200/80 px-2.5 py-1 rounded">
                  {featuredCompany.companyType}
                </span>
                {featuredCompany.listed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    <CheckCircle2 className="w-3 h-3 text-[#00A651]" />
                    {featuredCompany.ticker ? `NSE: ${featuredCompany.ticker}` : "Publicly Listed"}
                  </span>
                )}
              </div>

              <span className="text-xs text-zinc-400 font-medium">
                Est. {featuredCompany.founded}
              </span>
            </div>

            {/* Split: Company Name/Info & Cover Visual */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              <div className="md:col-span-7 flex flex-col justify-center">
                <h3 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950 mb-3 leading-snug">
                  {featuredCompany.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed mb-4">
                  {featuredCompany.description}
                </p>

                {/* Structured Metadata Points */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Headquarters
                    </span>
                    <span className="font-semibold text-zinc-800">
                      {featuredCompany.headquarters || featuredCompany.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Primary Sector
                    </span>
                    <span className="font-semibold text-zinc-800">
                      {featuredCompany.sector}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Listed Status
                    </span>
                    <span className="font-semibold text-zinc-800">
                      {featuredCompany.exchange || "BSE / NSE"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Solutions Listed
                    </span>
                    <span className="font-semibold text-zinc-800">
                      {featuredCompany.productIds?.length || 2} Technologies
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Visual / Facility Image */}
              <div className="md:col-span-5 relative min-h-[220px] rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                {featuredCompany.coverImage ? (
                  <Image
                    src={featuredCompany.coverImage}
                    alt={featuredCompany.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Infrastructure Asset
                  </span>
                  <span className="text-xs font-semibold line-clamp-1">
                    {featuredCompany.businessAreas?.[0] || "Energy Facility Operations"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {featuredCompany.businessAreas?.slice(0, 3).map((area) => (
                <span
                  key={area}
                  className="text-[10px] font-medium text-zinc-600 bg-zinc-50 border border-zinc-200/80 px-2 py-0.5 rounded"
                >
                  {area}
                </span>
              ))}
            </div>

            <Link
              href={`/marketplace/companies/${featuredCompany.slug}`}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs"
            >
              <span>View Full Profile</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00A651]" />
            </Link>
          </div>
        </div>

        {/* Right 4 cols: "ALSO EXPLORE" Peer Companies */}
        <div className="lg:col-span-4 bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                ALSO EXPLORE
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                Verified Leaders
              </span>
            </div>

            <div className="divide-y divide-zinc-200/80">
              {alsoExplore.map((company) => (
                <Link
                  key={company.id}
                  href={`/marketplace/companies/${company.slug}`}
                  className="py-3.5 block group hover:translate-x-0.5 transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors leading-snug">
                        {company.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-normal">
                        <span>{company.sector}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span>{company.location.split(",")[0]}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 mt-4">
            <Link
              href="/marketplace/companies"
              className="w-full py-2.5 text-center block text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-[#00A651] bg-white border border-zinc-300 hover:border-zinc-400 rounded-lg transition-colors"
            >
              Browse Complete Directory &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
