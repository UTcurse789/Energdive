import { MarketplaceCompany } from "@/data/marketplace/types";
import { ExternalLink } from "lucide-react";

interface CompanyInfoGridProps {
  company: MarketplaceCompany;
}

export function CompanyInfoGrid({ company }: CompanyInfoGridProps) {
  const fields = [
    { label: "Industry", value: company.industry },
    { label: "Sector", value: company.sector },
    { label: "Sub-Sector", value: company.subSector },
    { label: "Company Type", value: company.companyType },
    { label: "Headquarters", value: company.headquarters },
    { label: "Founded Year", value: String(company.founded) },
    { label: "Listed Status", value: company.listed ? "Listed on Public Exchange" : "Unlisted / Private" },
    { label: "NSE Ticker", value: company.ticker || "N/A" },
    { label: "BSE Security Code", value: company.bseCode || "N/A" },
    {
      label: "Official Website",
      value: company.website,
      isLink: true,
    },
  ];

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00A651]" />
          Corporate & Regulatory Profile
        </h3>
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
          Public Record
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {f.label}
            </span>
            {f.isLink ? (
              <a
                href={f.value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00A651] hover:underline break-all"
              >
                <span>{f.value.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : (
              <p className="text-xs sm:text-sm font-semibold text-zinc-800 break-words">
                {f.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
