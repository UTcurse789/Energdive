import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Reports & Market Intelligence India | Policy, Data & Sector Analysis | ENERGDIVE",
  description: "Explore in-depth energy reports and market intelligence on India’s energy sector covering oil & gas, power, renewables, hydrogen, energy storage, carbon markets, policy analysis, and industry trends.",
  keywords: [
    "energy reports india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "energy market intelligence india",
    "energy sector analysis india",
    "energy industry reports india",
    "oil and gas reports india",
    "power sector reports india",
    "renewable energy reports india",
    "hydrogen market india",
    "energy storage market india",
    "carbon markets india",
    "electricity market india",
    "energy policy reports india",
    "energy research india",
    "sustainability reports india"
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
    canonical: "https://www.energdive.com/reports",
  },
  openGraph: {
    title: "Energy Reports & Market Intelligence India | ENERGDIVE",
    description: "Access in-depth energy reports covering policy insights, market intelligence, sector analysis, and industry trends shaping India’s energy transition.",
    url: "https://www.energdive.com/reports",
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
    title: "Energy Reports & Market Intelligence India | ENERGDIVE",
    description: "Explore energy reports, policy analysis and market intelligence shaping India's energy landscape.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Reports Platform, Market Intelligence Platform, Research & Analysis Portal",
    topic: "Energy Reports, Market Intelligence, Policy Analysis, Oil & Gas, Power, Renewables, Sustainability",
    audience: "Energy professionals, analysts, policymakers, investors, corporates, consultants",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
