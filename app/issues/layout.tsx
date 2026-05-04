import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "ENERGDIVE Magazine | India’s Energy Transition Magazine & Monthly Editions - ENERGDIVE" },
  description: "Explore ENERGDIVE Magazine featuring monthly editions on India’s energy transition, policy, oil & gas, power, renewables, and sustainability including themes like Modi’s Clean Energy Revolution and India’s Energy Security Reset.",
  keywords: [
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "energdive",
    "energy magazine india",
    "energy transition magazine india",
    "india energy magazine",
    "monthly energy magazine india",
    "energy policy magazine india",
    "oil and gas magazine india",
    "power sector magazine india",
    "renewable energy magazine india",
    "modi’s clean energy revolution",
    "india energy security reset",
    "energy insights magazine india",
    "energy intelligence publication india",
    "energy industry magazine india"
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
    canonical: "https://energdive.com/issues",
  },
  openGraph: {
    title: "ENERGDIVE Magazine | India’s Energy Intelligence Publication",
    description: "Discover ENERGDIVE Magazine editions covering India’s energy transition, policy insights, industry trends, and leadership perspectives.",
    url: "https://energdive.com/issues",
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
    title: "ENERGDIVE Magazine | India’s Energy Intelligence Platform",
    description: "Explore monthly editions of ENERGDIVE Magazine covering energy transition, policy, innovation, and industry insights.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Magazine, Energy Intelligence Publication, Industry Knowledge Platform",
    topic: "Energy Magazine, Energy Transition, Policy Insights, Oil & Gas, Power, Renewables, Sustainability",
    audience: "Energy professionals, policymakers, industry leaders, corporates, investors, researchers",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
