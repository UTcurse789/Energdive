import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import DarkVeil from "@/components/DarkVeil";
import FindJobsBoard from "@/components/energjob/find-jobs-board";
import HireTalentButton from "@/components/energjob/hire-talent-button";
import GsapScrollAnimations from "@/components/gsap-scroll-animations";
import { loadPublicEnergJobs } from "@/lib/energjob-public";
import { getCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EnergyJobs | Energy Careers, Hiring and Talent Platform",
  description:
    "EnergyJobs is ENERGDIVE's careers and hiring platform for India's energy, power, oil and gas, renewables, and climate workforce. Search sector-wise energy jobs and explore live openings.",
  keywords: [
    "energy jobs",
    "renewable energy careers",
    "battery energy storage jobs",
    "power sector jobs",
    "energyjobs",
    "energy hiring",
  ],
  alternates: {
    canonical: "https://www.energdive.com/energyjobs",
  },
  openGraph: {
    title: "EnergyJobs | Energy Careers and Hiring",
    description:
      "Discover EnergyJobs - a focused jobs and hiring destination for India's energy ecosystem. Browse live openings across energy sectors.",
    url: "https://www.energdive.com/energyjobs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EnergyJobs | Energy Careers and Hiring",
    description:
      "Browse live openings across energy sectors and discover your next role on EnergyJobs.",
  },
};

export default async function EnergyJobsPage() {
  const jobs = await loadPublicEnergJobs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EnergyJobs Open Roles",
    description:
      "Live jobs across the energy ecosystem, grouped by sector on EnergyJobs.",
    url: getCanonicalUrl("/energyjobs"),
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getCanonicalUrl(`/energyjobs/${job.routeSlug}`),
      name: job.title,
    })),
  };

  return (
    <>
      <GsapScrollAnimations />
      <Script
        id="energyjobs-itemlist-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero Section ── */}
      <main className="relative min-h-screen overflow-hidden bg-white text-[#111111]">
        <div className="pointer-events-none absolute inset-0">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.45}
            scanlineFrequency={0}
            warpAmount={0.08}
            waveColor="#09B697"
          />
        </div>

        <section className="relative mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-[1440px] items-center px-6 py-14 lg:px-12 lg:py-20 gsap-stagger-container">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="mt-5 font-sans text-4xl font-black leading-[0.94] tracking-[-0.06em] text-[#142020] sm:text-5xl lg:text-7xl gsap-stagger-item">
              Where energy innovation and talent connect
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-black/62 sm:text-base gsap-stagger-item">
              A focused ecosystem built for the future of energy, connecting ambitious
              companies, industry leaders, analysts, operators, and next-generation talent
              driving the transition forward.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row gsap-stagger-item">
              <HireTalentButton className="inline-flex min-w-[220px] items-center justify-center rounded-[18px] bg-[#143f52] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#0d3140]" />
              <a
                href="#jobs-board"
                className="inline-flex min-w-[220px] items-center justify-center rounded-[18px] border border-black/12 bg-white px-8 py-4 text-base font-bold text-[#1a1a1a] transition-colors hover:border-[#09B697]/35 hover:text-[#09B697]"
              >
                Find your next job
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Jobs Board Section ── */}
      <div id="jobs-board" className="gsap-fade-up">
        <FindJobsBoard jobs={jobs} />
      </div>
    </>
  );
}
