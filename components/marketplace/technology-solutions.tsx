import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Building, ShieldCheck, ArrowUpRight } from "lucide-react";
import { MarketplaceProduct } from "@/data/marketplace/types";

interface TechnologySolutionsProps {
  products: MarketplaceProduct[];
}

export function TechnologySolutions({ products }: TechnologySolutionsProps) {
  if (products.length === 0) return null;

  const featured = products[0];
  const sideProducts = products.slice(1, 3);
  const bottomProducts = products.slice(3, 5);

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            HARDWARE &bull; SOFTWARE &bull; SYSTEMS
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950">
            TECHNOLOGY &amp; SOLUTIONS
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal mt-1 max-w-xl leading-relaxed">
            Products shaping the energy transition &mdash; utility inverters, grid BESS storage, hydrogen electrolyzers, and substation automation.
          </p>
        </div>

        <Link
          href="/marketplace/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
        >
          <span>View All Products & Solutions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Asymmetric Product Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Featured Product: 7 cols */}
        {featured && (
          <Link
            href={`/marketplace/products/${featured.slug}`}
            className="lg:col-span-7 group bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-[#00A651] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Cinematic 16:10 Image Container */}
            <div className="relative w-full aspect-16/10 bg-zinc-100 overflow-hidden">
              <Image
                src={featured.image}
                alt={featured.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded bg-black/80 text-white backdrop-blur-xs">
                  {featured.category}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-zinc-900 group-hover:bg-[#00A651] group-hover:text-white transition-colors shadow-sm">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2 font-medium">
                  <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Manufactured by <strong className="text-zinc-800 font-semibold">{featured.companyName}</strong></span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-zinc-900 group-hover:text-[#00A651] transition-colors leading-tight mb-2">
                  {featured.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed line-clamp-2">
                  {featured.shortDescription}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#00A651]">
                <span>{featured.subCategory || "Utility Solution"}</span>
                <span className="flex items-center gap-1">
                  View Specifications <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Right Stacked Products: 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {sideProducts.map((product) => (
            <Link
              key={product.id}
              href={`/marketplace/products/${product.slug}`}
              className="group flex-1 bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row justify-between"
            >
              <div className="relative w-full sm:w-2/5 aspect-16/10 sm:aspect-auto bg-zinc-100 shrink-0 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-104 transition-transform duration-300"
                />
              </div>
              <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A651] block mb-1">
                    {product.category}
                  </span>
                  <h4 className="text-sm font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 font-normal">
                    {product.shortDescription}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                  <span className="line-clamp-1">{product.companyName}</span>
                  <ArrowRight className="w-3 h-3 group-hover:text-[#00A651] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Pair: 2 Horizontal Cards */}
      {bottomProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {bottomProducts.map((product) => (
            <Link
              key={product.id}
              href={`/marketplace/products/${product.slug}`}
              className="group bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-200 flex items-start gap-4"
            >
              <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="100px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A651] block mb-0.5">
                  {product.category}
                </span>
                <h4 className="text-sm font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 font-normal">
                  {product.shortDescription}
                </p>
                <div className="mt-2 text-[11px] text-zinc-400 font-medium">
                  By {product.companyName}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
