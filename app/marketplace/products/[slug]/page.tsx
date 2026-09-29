import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileStack,
  Layers,
  Newspaper,
  Package,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import {
  getMarketplaceProducts,
  getMarketplaceProductBySlug,
  getMarketplaceCompanyBySlug,
  getMarketplaceRelatedProducts,
  getMarketplaceProductResources,
  getMarketplaceArticlesFromStrapi,
} from "@/lib/marketplace-strapi";
import { ProductHeader } from "@/components/marketplace/product-header";
import { ProductInfoGrid } from "@/components/marketplace/product-info-grid";
import { ProductProfileTabs } from "@/components/marketplace/product-profile-tabs";
import { ProductCard } from "@/components/marketplace/product-card";
import { ProductResources } from "@/components/marketplace/product-resources";
import { MarketplaceArticleCard } from "@/components/marketplace/marketplace-article-card";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs";
import { EmptyState } from "@/components/marketplace/empty-state";
import { getCanonicalUrl } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getMarketplaceProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getMarketplaceProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found | Energdive Marketplace" };
  }

  const title = `${product.name} - ${product.category} Solutions`;
  const description = `${product.name} manufactured by ${product.companyName}. View overview, key features, applications, and technical specifications on Energdive Marketplace.`;
  const canonicalUrl = getCanonicalUrl(`/marketplace/products/${product.slug}`);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
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

const sectionLabel = (
  icon: ReactNode,
  eyebrow: string,
  title: string,
  action?: ReactNode
) => (
  <div className="mb-6 flex items-end justify-between gap-4 border-b border-zinc-200 pb-4">
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">
        {icon}
        {eyebrow}
      </p>
      <h2 className="mt-1 font-sans text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
        {title}
      </h2>
    </div>
    {action}
  </div>
);

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getMarketplaceProductBySlug(slug);

  if (!product) {
    return (
      <div className="min-h-[60vh] max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 font-sans">
        <MarketplaceBreadcrumbs
          crumbs={[
            { label: "Products", href: "/marketplace/products" },
            { label: "Product Not Found" },
          ]}
        />
        <div className="mt-8">
          <EmptyState
            title="Product Not Available"
            description="This product profile has not yet been catalogued or is currently pending review. Browse our verified energy companies or check back shortly."
            actionText="Browse All Products"
          />
          <div className="flex justify-center gap-4 mt-6">
            <Link
              href="/marketplace/products"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg border border-zinc-300 text-zinc-800 hover:border-[#00A651] hover:text-[#00A651] transition-colors"
            >
              Browse All Products
            </Link>
            <Link
              href="/marketplace/companies"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-[#00A651] transition-colors"
            >
              Explore Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [company, relatedProducts, productResources, articles] = await Promise.all([
    product.companySlug ? getMarketplaceCompanyBySlug(product.companySlug) : null,
    getMarketplaceRelatedProducts(product, 4),
    getMarketplaceProductResources(product.slug),
    getMarketplaceArticlesFromStrapi(3),
  ]);

  const compactAction = (href: string, label: string) => (
    <Link
      href={href}
      className="hidden items-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:text-[#00A651] sm:inline-flex"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );

  // -------------------------------------------------------------------------
  // 1. OVERVIEW TAB PANEL (Mirroring Company Page Architecture)
  // -------------------------------------------------------------------------
  const overview = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(330px,.7fr)] font-sans">
      {/* Left Column (Primary technical details) */}
      <div className="space-y-6">
        {/* About & Operational Summary */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00A651]">
            Engineering & Operational Brief
          </p>
          <h2 className="mt-1 font-sans text-xl font-semibold tracking-tight text-zinc-950">
            About {product.name}
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-600 font-normal">
            {product.description || product.shortDescription}
          </p>
        </section>

        {/* Key Features & Engineering Highlights */}
        {product.features && product.features.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#00A651]" />
              <h2 className="font-sans text-base font-semibold text-zinc-900">
                Key Features & Engineering Highlights
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.features.map((feature, idx) => {
                const parts = feature.split(":");
                const hasColon = parts.length > 1;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#00A651] mt-0.5 shrink-0" />
                    <div className="text-xs leading-snug">
                      {hasColon ? (
                        <>
                          <strong className="font-semibold text-zinc-900 block mb-0.5">
                            {parts[0].trim()}
                          </strong>
                          <span className="text-zinc-600 font-normal">
                            {parts.slice(1).join(":").trim()}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-zinc-700">{feature}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Target Applications & Deployment Scenarios */}
        {product.applications && product.applications.length > 0 && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#00A651]" />
              <h2 className="font-sans text-base font-semibold text-zinc-900">
                Target Applications & Operating Environments
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200">
              {product.applications.map((app, index) => {
                const parts = app.split(":");
                const hasColon = parts.length > 1;
                return (
                  <div key={app} className="flex items-start gap-3 bg-white px-4 py-3">
                    <span className="font-mono text-[10px] text-[#00A651] mt-0.5">
                      0{index + 1}
                    </span>
                    <div className="text-xs leading-snug">
                      {hasColon ? (
                        <>
                          <strong className="font-semibold text-zinc-900 block mb-0.5">
                            {parts[0].trim()}
                          </strong>
                          <span className="text-zinc-600 font-normal">
                            {parts.slice(1).join(":").trim()}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-zinc-700">{app}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Right Column (Snapshot & Manufacturer intelligence) */}
      <div className="space-y-6">
        <ProductInfoGrid product={product} company={company || undefined} />

        {/* Manufacturer Intelligence Card */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 text-[#00A651]">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
              Manufacturer intelligence
            </p>
          </div>
          <dl className="mt-4 divide-y divide-zinc-100">
            <div className="flex items-center justify-between gap-4 py-3 text-xs">
              <dt className="text-zinc-500">Manufacturer</dt>
              <dd className="font-semibold text-zinc-900 text-right">
                {product.companyName}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 text-xs">
              <dt className="text-zinc-500">Primary Sector</dt>
              <dd className="max-w-[55%] text-right font-semibold text-zinc-900">
                {product.sector}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 text-xs">
              <dt className="text-zinc-500">Listing Status</dt>
              <dd className="font-semibold text-[#00A651]">Verified B2B</dd>
            </div>
            {company && (
              <div className="pt-3">
                <Link
                  href={`/marketplace/companies/${company.slug}`}
                  className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[#00A651]" />
                    <span>View Company Profile</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              </div>
            )}
          </dl>
        </section>
      </div>

      {/* Technical Specifications Preview Table (Bottom Span) */}
      {product.specifications && product.specifications.length > 0 && (
        <section className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs">
          {sectionLabel(
            <SlidersHorizontal className="h-3.5 w-3.5" />,
            "Parameters",
            "Key Engineering Specifications",
            compactAction("#specs", "Full technical table")
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                  <th className="py-2.5 px-4 w-1/2">Parameter / Specification</th>
                  <th className="py-2.5 px-4 w-1/2">Rating / Operational Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                {product.specifications.slice(0, 6).map((spec, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-zinc-800">
                      {spec.label}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-zinc-600 text-xs">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // 2. SPECIFICATIONS TAB PANEL
  // -------------------------------------------------------------------------
  const specs = (
    <section className="font-sans">
      {sectionLabel(
        <SlidersHorizontal className="h-3.5 w-3.5" />,
        "Technical Data",
        `Engineering Specifications for ${product.name}`,
        compactAction("#overview", "Back to overview")
      )}
      {product.specifications && product.specifications.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase font-bold tracking-wider text-zinc-600">
                  <th className="py-3 px-5 w-1/2">Parameter / Standard</th>
                  <th className="py-3 px-5 w-1/2">Nominal Rating / Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs sm:text-sm">
                {product.specifications.map((spec, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-zinc-800">
                      {spec.label}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-zinc-700 text-xs sm:text-[13px]">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          No detailed parameters are published for this offering yet. Contact the manufacturer to request technical documentation.
        </div>
      )}
    </section>
  );

  // -------------------------------------------------------------------------
  // 3. DOCUMENTS TAB PANEL
  // -------------------------------------------------------------------------
  const documents = (
    <section className="font-sans">
      {sectionLabel(
        <FileStack className="h-3.5 w-3.5" />,
        "Official Literature",
        `Technical Catalogues & Assets for ${product.name}`
      )}
      {productResources && productResources.length > 0 ? (
        <ProductResources
          resources={productResources}
          productName={product.name}
          productSlug={product.slug}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          No downloadable brochures or spec sheets have been published for this product yet. Use Request RFQ to request literature directly.
        </div>
      )}
    </section>
  );

  // -------------------------------------------------------------------------
  // 4. INSIGHTS & RELATED TAB PANEL
  // -------------------------------------------------------------------------
  const insights = (
    <div className="space-y-12 font-sans">
      {/* Complementary Products */}
      {relatedProducts.length > 0 && (
        <section>
          {sectionLabel(
            <Package className="h-3.5 w-3.5" />,
            "Complementary Technologies",
            "Related Products & Equipment",
            compactAction("/marketplace/products", "Browse all products")
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {relatedProducts.map((relProd) => (
              <ProductCard key={relProd.id} product={relProd} />
            ))}
          </div>
        </section>
      )}

      {/* Related Market Coverage */}
      {articles.length > 0 && (
        <section>
          {sectionLabel(
            <Newspaper className="h-3.5 w-3.5" />,
            "Energdive intelligence",
            "Related Market Coverage & Analysis",
            compactAction("/news", "All news")
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {articles.map((article) => (
              <MarketplaceArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Manufacturer Spotlight */}
      {company && (
        <section>
          {sectionLabel(
            <Building2 className="h-3.5 w-3.5" />,
            "Manufacturer Profile",
            `About ${company.name}`,
            compactAction(`/marketplace/companies/${company.slug}`, "Company profile")
          )}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center font-bold text-lg text-zinc-700 overflow-hidden">
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    sizes="64px"
                    className="object-contain p-1.5"
                  />
                ) : (
                  <span>{company.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  {company.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 max-w-xl">
                  {company.shortDescription || company.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-2">
                  <span className="font-semibold text-[#00A651]">
                    {company.sector}
                  </span>
                  <span>&bull;</span>
                  <span>{company.location}</span>
                  <span>&bull;</span>
                  <span className="font-medium text-zinc-700">
                    {company.companyType}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/marketplace/companies/${company.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 shrink-0"
            >
              <span>View Full Company Hub</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#00A651]" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20 font-sans">
      {/* Top Breadcrumb Nav Bar */}
      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-4 py-3 text-xs sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <MarketplaceBreadcrumbs
            crumbs={[
              { label: "Products", href: "/marketplace/products" },
              { label: product.name },
            ]}
            className="mb-0"
          />
          <Link
            href="/marketplace/products"
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 transition-colors hover:text-[#00A651]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to products
          </Link>
        </div>
      </div>

      {/* Hero Header Card */}
      <ProductHeader
        product={product}
        company={company}
        documentCount={productResources.length}
      />

      {/* Main Tabbed Container */}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 mt-6">
        <ProductProfileTabs
          overview={overview}
          specs={specs}
          documents={documents}
          insights={insights}
          counts={{
            specs: product.specifications?.length || 0,
            documents: productResources.length,
            insights: relatedProducts.length + articles.length,
          }}
        />
      </div>
    </div>
  );
}
