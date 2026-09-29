import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Layers,
  Newspaper,
  Package,
  ShieldCheck,
  Video,
} from "lucide-react";
import {
  getMarketplaceCompanies,
  getMarketplaceCompanyBySlug,
  getMarketplaceProductsByCompanySlug,
  getMarketplaceRelatedCompanies,
  getMarketplaceCompanyResources,
  getMarketplaceCompanyVideos,
  getMarketplaceArticlesFromStrapi,
} from "@/lib/marketplace-strapi";
import { CompanyCard } from "@/components/marketplace/company-card";
import { CompanyHeader } from "@/components/marketplace/company-header";
import { CompanyInfoGrid } from "@/components/marketplace/company-info-grid";
import { CompanyProfileTabs } from "@/components/marketplace/company-profile-tabs";
import { CompanyResourceHub } from "@/components/marketplace/company-resource-hub";
import { MarketplaceArticleCard } from "@/components/marketplace/marketplace-article-card";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";
import { ProductCard } from "@/components/marketplace/product-card";
import { getCanonicalUrl } from "@/lib/seo";

export async function generateStaticParams() {
  const companies = await getMarketplaceCompanies();
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getMarketplaceCompanyBySlug(slug);
  if (!company) return { title: "Company Not Found" };

  const title = `${company.name} - Profile, Operations & Solutions`;
  const description = `${company.name} operates in ${company.sector}. Explore corporate information, business areas, and specialized energy solutions on Energdive Marketplace.`;
  const canonicalUrl = getCanonicalUrl(`/marketplace/companies/${company.slug}`);
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, images: company.coverImage ? [{ url: company.coverImage }] : undefined, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: company.coverImage ? [company.coverImage] : undefined },
  };
}

const sectionLabel = (icon: ReactNode, eyebrow: string, title: string, action?: ReactNode) => (
  <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-4">
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">{icon}{eyebrow}</p>
      <h2 className="mt-1 font-sans text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{title}</h2>
    </div>
    {action}
  </div>
);

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getMarketplaceCompanyBySlug(slug);
  if (!company) notFound();

  const [attachedProducts, relatedCompanies, articles, allCompanyResources, videos] = await Promise.all([
    getMarketplaceProductsByCompanySlug(company.slug, company.productIds),
    getMarketplaceRelatedCompanies(company, 4),
    getMarketplaceArticlesFromStrapi(3),
    getMarketplaceCompanyResources(company.slug),
    getMarketplaceCompanyVideos(company.slug, company.name),
  ]);

  const products = attachedProducts.map((product) => ({
    ...product,
    companyId: product.companyId || company.id,
    companySlug: product.companySlug || company.slug,
    companyName: product.companyName || company.name,
    companyLogo: product.companyLogo || company.logo || undefined,
  }));

  const presentations = allCompanyResources.filter((r) => r.type === "Presentation");
  const brochures = allCompanyResources.filter((r) => r.type === "Company Brochure");
  const productResources = allCompanyResources.filter(
    (r) =>
      r.type === "Product Catalogue" ||
      r.type === "Product Brochure" ||
      r.type === "Product Information" ||
      r.type === "Technical Document"
  );
  const documentCount = presentations.length + brochures.length + productResources.length;

  const compactAction = (href: string, label: string) => (
    <Link href={href} className="hidden items-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:text-[#00A651] sm:inline-flex">
      {label}<ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );

  const overview = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(330px,.7fr)]">
      <div className="space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">Investment & operational brief</p>
          <h2 className="mt-1 font-sans text-xl font-semibold tracking-tight text-zinc-950">About {company.name}</h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-600">{company.description}</p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#00A651]" />
            <h2 className="font-sans text-base font-semibold text-zinc-900">Operating domains</h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
            {company.businessAreas.map((area, index) => (
              <div key={area} className="flex items-center gap-3 bg-white px-4 py-3">
                <span className="font-mono text-[10px] text-[#00A651]">0{index + 1}</span>
                <span className="text-xs font-medium text-zinc-700">{area}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <CompanyInfoGrid company={company} />
        <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#00A651]"><ShieldCheck className="h-4 w-4" /><p className="text-[10px] font-bold uppercase tracking-[0.14em]">Vendor intelligence</p></div>
          <dl className="mt-4 divide-y divide-zinc-100">
            <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-zinc-500">Directory verification</dt><dd className="font-semibold text-zinc-900">Current</dd></div>
            <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-zinc-500">Primary sector</dt><dd className="max-w-[55%] text-right font-semibold text-zinc-900">{company.sector}</dd></div>
            <div className="flex items-center justify-between gap-4 py-3 text-xs"><dt className="text-zinc-500">Record source</dt><dd className="font-semibold text-zinc-900">Company profile</dd></div>
          </dl>
        </section>
      </div>

      <section className="xl:col-span-2">
        {sectionLabel(<Package className="h-3.5 w-3.5" />, "Featured offerings", "Selected products & solutions", compactAction("#solutions", "All solutions"))}
        {products.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-sm text-zinc-500">No catalogue products are published for this company yet. Contact the vendor for a tailored brief.</div>
        )}
      </section>
    </div>
  );

  const solutions = (
    <section>
      {sectionLabel(<Package className="h-3.5 w-3.5" />, "Vendor catalogue", `Products & solutions from ${company.name}`, compactAction("/marketplace/products", "Browse marketplace"))}
      {products.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">No catalogued solutions are available. Use Contact Vendor to request specifications.</div>
      )}
    </section>
  );

  const assets = (
    <CompanyResourceHub presentations={presentations} videos={videos} brochures={brochures} productResources={productResources} companyName={company.name} companySlug={company.slug} defaultKind="all" />
  );

  const insights = (
    <div className="space-y-12">
      {videos.length > 0 && <section>
        {sectionLabel(<Video className="h-3.5 w-3.5" />, "Media desk", "Project videos & briefings")}
        <CompanyResourceHub presentations={presentations} videos={videos} brochures={brochures} productResources={productResources} companyName={company.name} companySlug={company.slug} defaultKind="videos" />
      </section>}
      <section>
        {sectionLabel(<Newspaper className="h-3.5 w-3.5" />, "Energdive intelligence", "Related market coverage", compactAction("/news", "All news"))}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{articles.map((article) => <MarketplaceArticleCard key={article.id} article={article} />)}</div>
      </section>
      {relatedCompanies.length > 0 && <section>
        {sectionLabel(<Building2 className="h-3.5 w-3.5" />, "Sector peers", "Related companies", compactAction("/marketplace/companies", "Company directory"))}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">{relatedCompanies.map((related) => <CompanyCard key={related.id} company={related} />)}</div>
      </section>}
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-4 py-3 text-xs sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <MarketplaceBreadcrumbs crumbs={[{ label: "Companies", href: "/marketplace/companies" }, { label: company.name }]} className="mb-0" />
          <Link href="/marketplace/companies" className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 transition-colors hover:text-[#00A651]"><ArrowLeft className="h-3.5 w-3.5" /> Back to companies</Link>
        </div>
      </div>

      <CompanyHeader company={company} productCount={products.length} documentCount={documentCount} />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <CompanyProfileTabs overview={overview} solutions={solutions} assets={assets} insights={insights} counts={{ solutions: products.length, assets: documentCount + videos.length, insights: videos.length + articles.length }} />
      </div>
    </div>
  );
}
