import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Subscribe to ENERGDIVE Magazine | India’s Energy Intelligence Platform - ENERGDIVE" },
  description: "Subscribe to ENERGDIVE Magazine and get curated insights on India’s energy transition, policy, oil & gas, power, renewables, and sustainability delivered to your desk every month.",
  keywords: [
    "subscribe energdive",
    "energdive magazine subscription",
    "energy magazine subscription india",
    "energy dive magazine subscription",
    "energydive magazine subscription",
    "energ dive magazine subscription",
    "energy magazine india subscription",
    "energy intelligence magazine subscription",
    "energy policy magazine india",
    "oil and gas magazine subscription",
    "power sector magazine subscription",
    "renewable energy magazine subscription",
    "energy insights magazine india",
    "monthly energy magazine india"
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
    canonical: "https://energdive.com/subscribe",
  },
  openGraph: {
    title: "Subscribe to ENERGDIVE Magazine",
    description: "Get monthly insights on India’s energy transition, policy, and industry trends by subscribing to ENERGDIVE Magazine.",
    url: "https://energdive.com/subscribe",
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
    title: "Subscribe to ENERGDIVE Magazine",
    description: "Subscribe and receive curated energy insights, policy updates, and industry intelligence every month.",
    site: "@energdive",
  },
  other: {
    classification: "Subscription Page, Energy Magazine Subscription Platform, Energy Intelligence Platform",
    topic: "Subscription, Energy Magazine, Energy Insights, Policy, Oil & Gas, Power, Renewables",
    audience: "Energy professionals, policymakers, corporates, industry leaders, researchers, subscribers",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
