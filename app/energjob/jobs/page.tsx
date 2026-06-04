import type { Metadata } from "next";
import Script from "next/script";
import FindJobsBoard from "@/components/energjob/find-jobs-board";
import { loadPublicEnergJobs } from "@/lib/energjob-public";
import { getCanonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Jobs | EnergJob",
  description:
    "Search sector-wise energy jobs on EnergJob and explore live openings across hiring companies.",
  keywords: [
    "energy jobs",
    "renewable energy careers",
    "battery energy storage jobs",
    "power sector jobs",
    "energjob",
    "energy hiring",
  ],
  alternates: {
    canonical: "https://www.energdive.com/energjob/jobs",
  },
  openGraph: {
    title: "Find Jobs | EnergJob",
    description:
      "Browse live openings across energy sectors and discover your next role on EnergJob.",
    url: "https://www.energdive.com/energjob/jobs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Jobs | EnergJob",
    description:
      "Browse live openings across energy sectors and discover your next role on EnergJob.",
  },
};

export default async function EnergJobFindJobsPage() {
  const jobs = await loadPublicEnergJobs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EnergJob Open Roles",
    description:
      "Live jobs across the energy ecosystem, grouped by sector on EnergJob.",
    url: getCanonicalUrl("/energjob/jobs"),
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getCanonicalUrl(`/energjob/jobs/${job.routeSlug}`),
      name: job.title,
    })),
  };

  return (
    <>
      <Script
        id="energjob-jobs-itemlist-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FindJobsBoard jobs={jobs} />
    </>
  );
}
