import Link from "next/link";
import { Building2, ExternalLink, Landmark, Package, Tag, ShieldCheck } from "lucide-react";
import { MarketplaceProduct, MarketplaceCompany } from "@/data/marketplace/types";

interface ProductInfoGridProps {
  product: MarketplaceProduct;
  company?: MarketplaceCompany;
}

export function ProductInfoGrid({ product, company }: ProductInfoGridProps) {
  const fields = [
    { label: "Category", value: product.category, icon: Package },
    {
      label: "Sub-Category",
      value: product.subCategory || "Utility Grade",
      icon: Tag,
    },
    {
      label: "Primary Sector",
      value: product.sector,
      icon: Landmark,
    },
    {
      label: "Manufacturer",
      value: product.companyName || "Verified Vendor",
      icon: Building2,
      href: product.companySlug ? `/marketplace/companies/${product.companySlug}` : undefined,
    },
    {
      label: "Origin / Base",
      value: company?.location ? company.location.split(",")[0] : "India",
      icon: Landmark,
    },
    {
      label: "Verification Status",
      value: "Catalogue Certified",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs font-sans">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">
            Product record
          </p>
          <h2 className="mt-1 font-sans text-base font-semibold text-zinc-900">
            Technical snapshot
          </h2>
        </div>
        {product.companySlug && (
          <Link
            href={`/marketplace/companies/${product.companySlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A651] hover:underline"
          >
            Vendor profile
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
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
                <dd className="mt-1 text-sm font-medium leading-snug text-zinc-800">
                  {field.href ? (
                    <Link
                      href={field.href}
                      className="text-zinc-900 hover:text-[#00A651] hover:underline transition-colors"
                    >
                      {field.value}
                    </Link>
                  ) : (
                    field.value
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
