import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Events & Conferences India | Oil & Gas, Power & Renewables | ENERGDIVE",
  description: "Discover upcoming energy events, conferences, and exhibitions in India covering oil & gas, power, renewables, hydrogen, sustainability, and policy forums shaping the energy sector.",
  keywords: [
    "energy events india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "energy conferences india",
    "energy exhibitions india",
    "oil and gas events india",
    "power sector conferences india",
    "renewable energy events india",
    "energy summit india",
    "energy forums india",
    "global refining petrochemicals congress grpc",
    "bharat fire safety congress",
    "bharat electricity forum",
    "middle east energy event",
    "india energy events calendar",
    "energy networking events india",
    "energy industry conferences india"
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
    canonical: "https://www.energdive.com/events",
  },
  openGraph: {
    title: "Energy Events & Conferences India | ENERGDIVE",
    description: "Explore upcoming energy events, conferences, and exhibitions shaping India’s energy ecosystem across oil & gas, power, renewables, and sustainability.",
    url: "https://www.energdive.com/events",
    type: "website",
    siteName: "ENERGDIVE",
    images: [
      {
        url: "https://www.energdive.com/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Energy Events & Conferences India | ENERGDIVE",
    description: "Stay updated on energy conferences, exhibitions, and industry events shaping India’s energy future.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Events Platform, Industry Conferences Portal, Energy Networking Platform",
    topic: "Energy Events, Conferences, Exhibitions, Oil & Gas, Power, Renewables, Sustainability",
    audience: "Energy professionals, policymakers, corporates, investors, exhibitors, event participants",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
