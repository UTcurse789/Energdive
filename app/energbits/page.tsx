import type { Metadata } from "next";
import { EnergbitsFeed } from "@/components/sections/energbits-feed";

export const metadata: Metadata = {
  title: "Energbits — Fast Energy Intelligence | ENERGDIVE",
  description:
    "Quick, visual stories from the energy transition — curated for the time you have. Explore by sector.",
  openGraph: {
    title: "Energbits — Fast Energy Intelligence | ENERGDIVE",
    description:
      "Quick, visual stories from the energy transition — curated for the time you have.",
    url: "https://www.energdive.com/energbits",
    siteName: "ENERGDIVE",
    type: "website",
  },
};

const STRAPI_BASE =
  process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

async function getEnergbitsContent() {
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/contents?pagination[pageSize]=40&populate=*&sort=Date:desc`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function EnergbitsPage({
  searchParams,
}: {
  searchParams: Promise<{ bit?: string | string[] }>;
}) {
  const contents = await getEnergbitsContent();
  const params = await searchParams;
  const selectedSlug = Array.isArray(params.bit) ? params.bit[0] : params.bit;

  return <EnergbitsFeed contents={contents} selectedSlug={selectedSlug} />;
}
