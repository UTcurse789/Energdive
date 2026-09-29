import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, Package } from "lucide-react";
import { MarketplaceProduct } from "@/data/marketplace/types";

interface TechnologySolutionsProps {
  products: MarketplaceProduct[];
}

export function TechnologySolutions({ products }: TechnologySolutionsProps) {
  if (products.length === 0) return null;

  const displayProducts = products.slice(0, 4);

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            HARDWARE &bull; SOFTWARE &bull; SYSTEMS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
            TECHNOLOGY &amp; SOLUTIONS
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            Products shaping the energy transition &mdash; utility inverters, grid BESS storage, hydrogen electrolyzers, and substation automation.
          </p>
        </div>

        <Link
          href="/marketplace/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors shrink-0"
        >
          <span>View All Products &amp; Solutions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column Grid: 4 Products per Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            href={`/marketplace/products/${product.slug}`}
            className="group bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-[#00A651] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Product Visual */}
              <div className="relative w-full aspect-16/10 bg-zinc-100 overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Package className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-zinc-900/85 text-white backdrop-blur-xs shadow-2xs">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Body */}
              <div className="p-5">
                {/* Manufacturer */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="line-clamp-1">
                    By <strong className="text-zinc-800 font-semibold">{product.companyName || "Verified Vendor"}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-950 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-1 mb-2">
                  {product.name}
                </h3>

                <p className="text-xs text-zinc-600 font-normal leading-relaxed line-clamp-2">
                  {product.shortDescription || product.description}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-900 group-hover:text-[#00A651] transition-colors mt-auto">
              <span className="text-[11px] text-zinc-400 font-semibold lowercase tracking-normal">
                {product.subCategory || product.sector || "Energy Solution"}
              </span>
              <span className="inline-flex items-center gap-1">
                <span>View Solution</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#00A651]" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
