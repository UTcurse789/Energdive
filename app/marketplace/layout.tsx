import type { Metadata } from "next";
import { MarketplaceNav } from "@/components/marketplace/marketplace-nav";
import { getCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    template: "%s | Energdive Marketplace",
    default: "Energdive Marketplace | Energy Companies & Solutions Directory",
  },
  description:
    "Explore India and global energy companies, technologies, products, and equipment shaping the power, oil & gas, renewables, and clean energy transition.",
  alternates: {
    canonical: getCanonicalUrl("/marketplace"),
  },
  openGraph: {
    title: "Energdive Marketplace | Energy Companies & Solutions Directory",
    description:
      "Explore India and global energy companies, technologies, products, and equipment shaping the power, oil & gas, renewables, and clean energy transition.",
    url: getCanonicalUrl("/marketplace"),
    siteName: "Energdive",
    type: "website",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans">
      <MarketplaceNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
