import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Energy News India | Oil & Gas, Power, Renewables & Policy Updates - ENERGDIVE" },
  description: "Stay updated with the latest energy news in India covering oil & gas, power, renewables, hydrogen, energy storage, sustainability, climate policy, and market developments shaping the energy sector.",
  keywords: [
    "energy news india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "latest energy news india",
    "oil and gas news india",
    "power sector news india",
    "renewable energy news india",
    "hydrogen news india",
    "energy transition india",
    "energy policy india",
    "energy market updates",
    "electricity market india",
    "carbon markets india",
    "green hydrogen india",
    "energy storage india",
    "smart grid india",
    "sustainability energy india",
    "climate policy india"
  ],
  authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://energdive.com/news",
  },
  openGraph: {
    title: "Energy News India | ENERGDIVE",
    description: "Explore the latest energy news covering oil & gas, power, renewables, hydrogen, sustainability and policy developments shaping India's energy sector.",
    url: "https://energdive.com/news",
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
    title: "Energy News India | ENERGDIVE",
    description: "Stay updated with the latest energy news, policy updates, and industry developments shaping India's energy future.",
    site: "@energdive",
  },
  other: {
    classification: "Energy News Platform, Energy Intelligence Platform, Industry News Portal",
    topic: "Energy News, Oil & Gas, Power, Renewables, Hydrogen, Sustainability, Climate Policy",
    audience: "Energy professionals, policymakers, corporates, investors, utilities, industry leaders",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
