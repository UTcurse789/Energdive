import { Hero } from "@/components/sections/hero";
import { BentoGrid } from "@/components/ui/bento-grid";
import { SectorBlock } from "@/components/ui/sector-block";
import { OpinionSection } from "@/components/sections/opinion";
import { DataInsightsSection } from "@/components/sections/data-insights";
import { EventsSection } from "@/components/sections/events";
import { SubscribeCTA } from "@/components/sections/subscribe-cta";
import { ARTICLES, SECTORS } from "@/data/dummy";
import { SectionHeading } from "@/components/ui/section-heading";

export default function Home() {
  // Mocking data distribution
  // In a real app, this would be fetched from an API

  // Bento Grid Items (6 items: 1 large, 2 medium, 3 small - per my v2 logic or component logic)
  const bentoItems = ARTICLES.slice(0, 6).map(a => ({
    id: a.id,
    title: a.title,
    category: a.category,
    image: a.image,
    slug: a.slug,
    excerpt: a.excerpt
  }));

  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Trending (Bento Grid) */}
      <section className="py-12 border-b border-border">
        <div className="container">
          <SectionHeading title="Trending Now" />
          <BentoGrid items={bentoItems} />
        </div>
      </section>

      {/* Sector Blocks */}
      <div className="border-b border-border">
        <div className="container">
          {SECTORS.map((sector) => (
            <SectorBlock
              key={sector.slug}
              title={sector.title}
              slug={sector.slug}
              articles={ARTICLES.filter(a => a.category === sector.title || true).slice(0, 4)} // Mock filter logic
            />
          ))}
        </div>
      </div>

      {/* Opinion & Analysis */}
      <OpinionSection />

      {/* Data & Insights */}
      <DataInsightsSection />

      {/* Subscribe CTA */}
      <SubscribeCTA />

      {/* Events */}
      <EventsSection />
    </>
  );
}
