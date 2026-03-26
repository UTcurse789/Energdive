import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy Opinion & Expert Views India | Policy Leaders, Interviews & Insights | ENERGDIVE",
  description: "Explore expert opinions, leadership perspectives, and exclusive interviews on India’s energy transition featuring policymakers, industry leaders, and visionaries shaping oil & gas, power, renewables, and sustainability.",
  keywords: [
    "energy opinion india",
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "energy expert insights india",
    "energy leadership interviews india",
    "energy policy opinions india",
    "oil and gas expert views india",
    "power sector insights india",
    "renewable energy thought leadership",
    "energy transition insights india",
    "energy policy analysis india",
    "abhishek bhatnagar energy",
    "bhupinder singh bhalla renewables",
    "suman chandra energy",
    "energy leaders india interviews",
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
    canonical: "https://www.energdive.com/opinion",
  },
  openGraph: {
    title: "Energy Opinion & Leadership Insights India | ENERGDIVE",
    description: "Read expert opinions and exclusive interviews with policymakers and industry leaders shaping India’s energy transition and sustainability agenda.",
    url: "https://www.energdive.com/opinion",
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
    title: "Energy Opinion & Expert Views India | ENERGDIVE",
    description: "Explore leadership insights, expert opinions, and interviews shaping India’s energy future.",
    site: "@energdive",
  },
  other: {
    classification: "Energy Opinion Platform, Thought Leadership Portal, Expert Insights Platform",
    topic: "Energy Opinions, Leadership Interviews, Policy Insights, Oil & Gas, Power, Renewables, Sustainability",
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
