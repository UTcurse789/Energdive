import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Layers, Newspaper } from "lucide-react";
import {
  getCompanyBySlug,
  getAllCompanies,
  getProductsByCompanySlug,
  getRelatedCompanies,
  getMarketplaceArticles,
} from "@/data/marketplace";
import { CompanyHeader } from "@/components/marketplace/company-header";
import { CompanyInfoGrid } from "@/components/marketplace/company-info-grid";
import { ProductCard } from "@/components/marketplace/product-card";
import { CompanyCard } from "@/components/marketplace/company-card";
import { MarketplaceArticleCard } from "@/components/marketplace/marketplace-article-card";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";
import { getCanonicalUrl } from "@/lib/seo";

export function generateStaticParams() {
  const companies = getAllCompanies();
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    return {
      title: "Company Not Found",
    };
  }

  const title = `${company.name} - Profile, Operations & Solutions`;
  const description = `${company.name} operates in ${company.sector}. Explore corporate information, business areas, and specialized energy solutions on Energdive Marketplace.`;
  const canonicalUrl = getCanonicalUrl(`/marketplace/companies/${company.slug}`);

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
      images: company.coverImage ? [{ url: company.coverImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: company.coverImage ? [company.coverImage] : undefined,
    },
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const products = getProductsByCompanySlug(company.slug);
  const relatedCompanies = getRelatedCompanies(company, 4);
  const articles = getMarketplaceArticles(3);

  return (
    <div className="pb-20">
      {/* Top Breadcrumb Nav Bar */}
      <div className="bg-zinc-50 border-b border-zinc-200 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <MarketplaceBreadcrumbs
            crumbs={[
              { label: "Companies", href: "/marketplace/companies" },
              { label: company.name },
            ]}
            className="mb-0"
          />

          <Link
            href="/marketplace/companies"
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-[#00A651] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Companies</span>
          </Link>
        </div>
      </div>

      {/* 1. Hero Header */}
      <CompanyHeader company={company} />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">
        {/* 2. Corporate Information Grid */}
        <CompanyInfoGrid company={company} />

        {/* 3. About Company */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-900 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00A651]" />
            About {company.name}
          </div>
          <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-normal">
            {company.description}
          </p>
        </section>

        {/* 4. Business Areas */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-900 mb-6">
            <Layers className="w-4 h-4 text-[#00A651]" />
            Business Areas & Operational Domains
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {company.businessAreas.map((area, idx) => (
              <div
                key={idx}
                className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between hover:border-[#00A651] hover:bg-[#00A651]/5 transition-all"
              >
                <span className="text-xs font-bold text-zinc-800 leading-snug">
                  {area}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
              </div>
            ))}
          </div>
        </section>

        {/* 5. Company Products / Solutions */}
        <section>
          <div className="flex items-end justify-between border-b border-zinc-200 pb-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-[#00A651]" />
                Catalog
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                Products & Solutions by {company.name}
              </h2>
            </div>

            <Link
              href="/marketplace/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center">
              <p className="text-xs sm:text-sm text-zinc-500">
                No specific catalog products currently listed under {company.name}. Contact company directly for custom equipment and EPC queries.
              </p>
            </div>
          )}
        </section>

        {/* 6. Related Companies */}
        {relatedCompanies.length > 0 && (
          <section>
            <div className="flex items-end justify-between border-b border-zinc-200 pb-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Sector Peers
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                  Related Companies
                </h2>
              </div>

              <Link
                href="/marketplace/companies"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
              >
                <span>Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCompanies.map((relComp) => (
                <CompanyCard key={relComp.id} company={relComp} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Energdive Editorial Content Section */}
        <section>
          <div className="flex items-end justify-between border-b border-zinc-200 pb-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#00A651] uppercase mb-1">
                <Newspaper className="w-3.5 h-3.5" />
                Editorial Intelligence
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                Latest from Energdive
              </h2>
            </div>

            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-[#00A651] transition-colors"
            >
              <span>View All News</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art) => (
              <MarketplaceArticleCard key={art.id} article={art} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
