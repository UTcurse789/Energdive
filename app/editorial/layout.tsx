import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Energy Editorials & Policy Commentary India | ENERGDIVE",
    template: "%s - ENERGDIVE",
  },
  description:
    "Read ENERGDIVE editorials featuring sharp commentary, policy perspectives, and strong viewpoints on India's energy transition, markets, regulation, and leadership agenda.",
  keywords: [
    "energy editorials india",
    "energdive editorial",
    "energy policy commentary india",
    "energy market commentary india",
    "india energy leadership opinion",
    "power sector editorial india",
    "oil and gas editorial india",
    "renewable energy editorial india",
  ],
  authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
  publisher: "ENERGDIVE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://energdive.com/editorial",
  },
  openGraph: {
    title: "Energy Editorials & Policy Commentary India | ENERGDIVE",
    description:
      "Explore ENERGDIVE editorials on energy policy, markets, leadership, and India's transition priorities.",
    url: "https://energdive.com/editorial",
    type: "website",
    siteName: "ENERGDIVE",
    images: [
      {
        url: "https://energdive.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Energy Editorials India | ENERGDIVE",
    description:
      "Read ENERGDIVE editorials covering India's energy policy, markets, and leadership conversations.",
    site: "@energdive",
  },
};

export default function EditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
