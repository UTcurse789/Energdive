import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building, FileText } from "lucide-react";
import { MarketplaceProduct } from "@/data/marketplace/types";
import { getResourcesByProductSlug } from "@/data/marketplace";

interface ProductCardProps {
  product: MarketplaceProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const resources = getResourcesByProductSlug(product.slug);

  return (
    <div className="group relative bg-white border border-zinc-200/90 rounded-xl overflow-hidden hover:border-[#00A651] hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full">
      {/* Product Image */}
      <Link
        href={`/marketplace/products/${product.slug}`}
        className="relative w-full aspect-16/10 bg-zinc-100 overflow-hidden block"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-4"
        />
        <div className="absolute top-3 left-3">
          <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-black/80 text-white backdrop-blur-xs">
            {product.category}
          </span>
        </div>

        {resources.length > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/85 text-emerald-400 backdrop-blur-xs border border-emerald-500/30">
              <FileText className="w-2.5 h-2.5" />
              <span>{resources.length} {resources.length === 1 ? "Doc" : "Docs"}</span>
            </span>
          </div>
        )}
      </Link>


      {/* Product Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Manufacturer Attribution */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
            <Building className="w-3 h-3 text-zinc-400 shrink-0" />
            <Link
              href={`/marketplace/companies/${product.companySlug}`}
              className="font-medium text-zinc-700 hover:text-[#00A651] hover:underline transition-colors line-clamp-1"
            >
              {product.companyName}
            </Link>
          </div>

          {/* Product Title */}
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors leading-snug line-clamp-1">
            <Link href={`/marketplace/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="text-xs text-zinc-600 mt-2.5 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Footer Link */}
        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {product.subCategory || "Commercial Solution"}
          </span>

          <Link
            href={`/marketplace/products/${product.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 group-hover:text-[#00A651] uppercase tracking-wider transition-colors"
          >
            <span>View Product</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
