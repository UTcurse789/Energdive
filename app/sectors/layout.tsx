import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Energy Sectors India | Oil & Gas, Power, Renewables & Markets - ENERGDIVE" },
  description: "Explore India’s interconnected energy sectors with ENERGDIVE covering oil & gas, power generation, renewables, transmission, distribution, electricity markets, new energies, energy storage, sustainability and safety.",
  keywords: [
    "energy sectors india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "oil and gas sector india",
    "power generation india",
    "renewable energy india",
    "power transmission india",
    "power distribution india",
    "electricity markets india",
    "energy markets india",
    "new energy india",
    "green hydrogen india",
    "energy storage india",
    "battery storage india",
    "sustainability energy india",
    "energy safety india",
    "energy transition india",
    "energy policy india",
    "energy ecosystem india",
    "energy industry india",
    "upstream oil and gas india",
    "refining petrochemicals india",
    "solar energy india",
    "wind energy india",
    "hydropower india",
    "smart grid india",
    "carbon markets india",
    "bess india",
    "pumped hydro india",
    "industrial safety energy india"
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
    canonical: "https://energdive.com/sectors",
  },
  openGraph: {
    title: "Energy Sectors India | ENERGDIVE",
    description: "Discover insights across India’s energy sectors including oil & gas, power, renewables, markets, storage, sustainability and emerging technologies.",
    url: "https://energdive.com/sectors",
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
    title: "Energy Sectors India | ENERGDIVE",
    description: "Explore oil & gas, power, renewables, markets, storage and sustainability insights shaping India’s energy ecosystem.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Intelligence Platform, Energy Sectors Portal, Energy Industry Knowledge Platform",
    topic: "Energy Sectors, Oil & Gas, Power, Renewables, Energy Markets, Storage, Sustainability, New Energies",
    audience: "Energy professionals, policymakers, corporates, investors, utilities, researchers, industry leaders",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function SectorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
