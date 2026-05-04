import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ENERGClub | India’s Energy Network, Community & Industry Platform",
  description: "Join ENERGClub, India’s exclusive energy network connecting industry leaders, policymakers, and innovators across oil & gas, power, renewables, and sustainability to drive collaboration and intelligence.",
  keywords: [
    "energclub",
    "energ club",
    "energclub india",
    "energclub community",
    "energclub membership",
    "energclub login",
    "energclub subscription",
    "energclub platform",
    "energclub energy network",
    "energy network india",
    "energy community india",
    "energy leadership network india",
    "energy ecosystem india",
    "energy industry community india",
    "energy professionals network india",
    "energy collaboration platform india",
    "energy innovation network india",
    "energy policy network india",
    "energy transition community india"
  ],
  authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
  publisher: "ENERGClub/ENERGDIVE",
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
    canonical: "https://energdive.com/energclub",
  },
  openGraph: {
    title: "ENERGClub | India’s Energy Network & Community Platform",
    description: "Join ENERGClub — an exclusive energy ecosystem connecting leaders, policymakers, and innovators shaping India’s energy future.",
    url: "https://energdive.com/energclub",
    type: "website",
    siteName: "ENERGClub",
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
    title: "ENERGClub | India’s Energy Community & Network",
    description: "Connect with industry leaders, policymakers, and innovators through ENERGClub — India’s premier energy ecosystem platform.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Community Platform, Industry Network, Energy Ecosystem Platform",
    topic: "Energy Network, Community, Membership, Collaboration, Oil & Gas, Power, Renewables, Sustainability",
    audience: "Energy professionals, policymakers, corporates, innovators, investors, industry leaders",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGClub",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function EnergclubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
