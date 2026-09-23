import { MARKETPLACE_COMPANIES } from "@/data/marketplace/companies";
import { MARKETPLACE_CATEGORIES } from "@/data/marketplace/categories";
import { MARKETPLACE_PRODUCTS } from "@/data/marketplace/products";

export function MarketplaceSnapshot() {
  const companyCount = MARKETPLACE_COMPANIES.length;
  const sectorCount = MARKETPLACE_CATEGORIES.length;
  const productCount = MARKETPLACE_PRODUCTS.length;

  const stats = [
    { label: "COMPANIES", value: `${companyCount}`, sub: "Verified Profiles" },
    { label: "SECTORS", value: `${sectorCount}`, sub: "Energy Domains" },
    { label: "PRODUCTS", value: `${productCount}+`, sub: "Hardware & Systems" },
    { label: "ENERGY CATEGORIES", value: "6", sub: "Market Verticals" },
    { label: "INDUSTRY DISCOVERY", value: "24/7", sub: "Real-Time Directory" },
  ];

  return (
    <section className="border-b border-zinc-200/80 bg-zinc-50/50 py-6 sm:py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            MARKETPLACE SNAPSHOT &bull; LIVE DIRECTORY INDEX
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80">
          {stats.map((item, idx) => (
            <div
              key={item.label}
              className={`flex flex-col justify-between ${
                idx !== 0 ? "pt-4 sm:pt-0 sm:pl-6 lg:pl-8" : ""
              }`}
            >
              <div>
                <span className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-zinc-900 block leading-none">
                  {item.value}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-700 block mt-2">
                  {item.label}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-normal mt-1">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
