import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Energy Opinion & Expert Views India | ENERGDIVE",
    template: "%s - ENERGDIVE",
  },
  description: "Explore expert opinions, commentary, and informed perspectives on India’s energy transition covering policy, markets, oil & gas, power, renewables, and sustainability.",
  keywords: [
    "energy opinion india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "energy expert insights india",
    "energy policy opinions india",
    "oil and gas expert views india",
    "power sector insights india",
    "renewable energy thought leadership",
    "energy transition insights india",
    "energy policy analysis india",
    "abhishek bhatnagar energy",
    "bhupinder singh bhalla renewables",
    "suman chandra energy",
    "energy industry opinions india"
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
    canonical: "https://energdive.com/opinion",
  },
  openGraph: {
    title: "Energy Opinion & Expert Views India | ENERGDIVE",
    description: "Read expert opinions, commentary, and perspectives shaping India’s energy transition and sustainability agenda.",
    url: "https://energdive.com/opinion",
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
    title: "Energy Opinion & Expert Views India | ENERGDIVE",
    description: "Explore expert opinions and commentary shaping India’s energy future.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Opinion Platform, Thought Leadership Portal, Expert Insights Platform",
    topic: "Energy Opinions, Policy Insights, Oil & Gas, Power, Renewables, Sustainability",
    audience: "Policymakers, industry leaders, energy professionals, corporates, investors, researchers",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function OpinionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
