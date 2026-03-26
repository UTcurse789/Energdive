import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Videos India | Expert Talks, Interviews & Industry Insights | ENERGDIVE",
  description: "Watch energy video insights, expert conversations, and leadership interviews on India’s energy sector covering oil & gas, power, renewables, hydrogen, sustainability, and policy developments shaping the future.",
  keywords: [
    "energy videos india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "energy interviews india",
    "energy expert videos india",
    "energy leadership talks india",
    "energy sector discussions india",
    "oil and gas video insights india",
    "power sector interviews india",
    "renewable energy videos india",
    "hydrogen discussions india",
    "energy transition india insights",
    "pk pujari power generation",
    "bhupinder singh bhalla renewables",
    "suman chandra energy",
    "energy leaders india videos",
    "energy panel discussions india"
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
    canonical: "https://www.energdive.com/videos",
  },
  openGraph: {
    title: "Energy Videos & Expert Talks India | ENERGDIVE",
    description: "Watch expert conversations and leadership insights shaping India’s energy transition across oil & gas, power, renewables, and sustainability.",
    url: "https://www.energdive.com/videos",
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
    title: "Energy Videos & Expert Talks India | ENERGDIVE",
    description: "Explore expert conversations, interviews, and insights shaping India's energy future.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Video Platform, Expert Talks Platform, Industry Insights Portal",
    topic: "Energy Videos, Expert Talks, Interviews, Policy Insights, Oil & Gas, Power, Renewables, Sustainability",
    audience: "Energy professionals, policymakers, industry leaders, corporates, investors, researchers",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
