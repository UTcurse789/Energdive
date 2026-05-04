import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "About ENERGDIVE | India’s Strategic Energy Intelligence Platform - ENERGDIVE" },
  description: "Learn about ENERGDIVE, India’s strategic energy intelligence platform documenting the nation’s energy transition through policy insights, innovation, leadership perspectives, and expert journalism.",
  keywords: [
    "about energdive",
    "energdive",
    "energdive magazine",
    "energydive magazine",
    "energy dive",
    "energy dive magazine",
    "energ dive magazine",
    "india energy intelligence platform",
    "energy transition india insights",
    "energy policy analysis india",
    "energy leadership platform",
    "energy journalism india",
    "energy market intelligence india"
  ],
  authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
  publisher: "ClariSector Technologies Pvt. Ltd.",
  generator: "ENERGDIVE - Insights and Market Intelligence",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://energdive.com/about",
  },
  openGraph: {
    title: "About ENERGDIVE | India’s Strategic Energy Intelligence Platform",
    description: "Discover ENERGDIVE — India’s strategic intelligence platform driving insights on energy transition, policy, innovation and sustainability.",
    url: "https://energdive.com/about",
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
    title: "About ENERGDIVE | India’s Strategic Energy Intelligence Platform",
    description: "Explore ENERGDIVE India’s leading platform for energy transition insights, policy intelligence, and industry leadership.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Intelligence Platform, Energy Magazine, Strategic Knowledge Platform",
    topic: "Energy Transition, Policy, Innovation, Sustainability, Oil & Gas, Power, New Energies",
    audience: "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
