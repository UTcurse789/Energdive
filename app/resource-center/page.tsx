import type { Metadata } from "next";
import { EventResourceCenter } from "@/components/resource-center/event-resource-center";
import { getResourceCenterData } from "@/lib/resource-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Resource Center | ENERGDIVE",
  },
  description:
    "Browse event brochures, post-show reports, whitepapers, presentations, media kits, and industry insights from leading energy events worldwide.",
  alternates: {
    canonical: "https://www.energdive.com/resource-center",
  },
  openGraph: {
    title: "Resource Center | ENERGDIVE",
    description:
      "Browse event brochures, post-show reports, whitepapers, presentations, media kits, and industry insights from leading energy events worldwide.",
    url: "https://www.energdive.com/resource-center",
    siteName: "ENERGDIVE",
    type: "website",
    images: [
      {
        url: "https://www.energdive.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ENERGDIVE Resource Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resource Center | ENERGDIVE",
    description:
      "Browse event brochures, post-show reports, whitepapers, presentations, media kits, and industry insights from leading energy events worldwide.",
  },
};

export default async function ResourceCenterPage() {
  const resourceCenterData = await getResourceCenterData();

  return <EventResourceCenter {...resourceCenterData} />;
}
