import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import {
  getProductBySlug,
  getAllProducts,
  getCompanyBySlug,
  getRelatedProducts,
} from "@/data/marketplace";
import { ProductHeader } from "@/components/marketplace/product-header";
import { ProductSpecs } from "@/components/marketplace/product-specs";
import { ProductCard } from "@/components/marketplace/product-card";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";
import { getCanonicalUrl } from "@/lib/seo";

export function generateStaticParams() {
  const products = getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = `${product.name} - ${product.category} Solutions`;
  const description = `${product.name} manufactured by ${product.companyName}. View overview, key features, applications, and technical specifications on Energdive Marketplace.`;
  const canonicalUrl = getCanonicalUrl(`/marketplace/products/${product.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: product.image ? [{ url: product.image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const company = getCompanyBySlug(product.companySlug);
  const relatedProducts = getRelatedProducts(product, 4);

  return (
    <div className="pb-20">
      {/* Top Breadcrumb Nav Bar */}
      <div className="bg-zinc-50 border-b border-zinc-200 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <MarketplaceBreadcrumbs
            crumbs={[
              { label: "Products", href: "/marketplace/products" },
              { label: product.name },
            ]}
            className="mb-0"
          />

          <Link
            href="/marketplace/products"
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-[#00A651] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>

      {/* 1. Hero Header */}
      <ProductHeader product={product} />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* 2. Specs, Features, Applications & Manufacturer */}
        <ProductSpecs product={product} company={company} />

        {/* 3. Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <div className="flex items-end justify-between border-b border-zinc-200 pb-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1">
                  <Package className="w-3.5 h-3.5" />
                  Complementary Technologies
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                  Related Products & Equipment
                </h2>
              </div>

              <Link
                href="/marketplace/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
              >
                <span>View All Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProd) => (
                <ProductCard key={relProd.id} product={relProd} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
