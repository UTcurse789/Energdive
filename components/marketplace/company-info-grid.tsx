import { Building2, ExternalLink, Landmark, MapPin } from "lucide-react";
import { MarketplaceCompany } from "@/data/marketplace/types";

interface CompanyInfoGridProps {
  company: MarketplaceCompany;
}

export function CompanyInfoGrid({ company }: CompanyInfoGridProps) {
  const fields = [
    { label: "Industry", value: company.industry, icon: Building2 },
    { label: "Sector", value: company.sector, icon: Landmark },
    { label: "Headquarters", value: company.headquarters, icon: MapPin },
    { label: "Founded", value: String(company.founded), icon: Building2 },
    {
      label: "Market status",
      value: company.listed ? `Listed${company.exchange ? ` · ${company.exchange}` : ""}` : "Private company",
      icon: Landmark,
    },
    { label: "Trading symbol", value: company.ticker || "Not disclosed", icon: Landmark },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">Company record</p>
          <h2 className="mt-1 font-sans text-base font-semibold text-zinc-900">Corporate snapshot</h2>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A651] hover:underline"
          >
            Website
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2">
        {fields.map((field, index) => {
          const Icon = field.icon;
          return (
            <div
              key={field.label}
              className={`flex gap-3 px-5 py-4 sm:px-6 ${
                index < fields.length - 2 ? "border-b border-zinc-100" : ""
              } ${index % 2 === 0 ? "sm:border-r sm:border-zinc-100" : ""}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-[0.11em] text-zinc-400">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm font-medium leading-snug text-zinc-800">{field.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
