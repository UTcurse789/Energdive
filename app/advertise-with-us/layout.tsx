import { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Advertise with ENERGDIVE | Energy Media, Marketing & Industry Visibility Platform - ENERGDIVE" },
  description: "Advertise with ENERGDIVE and position your brand at the forefront of India’s energy transition. Reach policymakers, industry leaders, and decision-makers through premium media, content, and strategic partnerships.",
  keywords: [
    "advertise energdive",
    "energdive advertising",
    "energy media advertising india",
    "energy industry advertising india",
    "energy magazine advertising india",
    "energy marketing platform india",
    "energy brand promotion india",
    "energy sector advertising india",
    "b2b energy marketing india",
    "energy sponsorship india",
    "energy event promotion india",
    "energy media partnerships india",
    "energy advertising opportunities india",
    "energy platform advertising india",
    "energy decision makers india"
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
    canonical: "https://www.energdive.com/advertise-with-us",
  },
  openGraph: {
    title: "Advertise with ENERGDIVE | Energy Media Platform",
    description: "Partner with ENERGDIVE to position your brand at the center of India’s energy transition through strategic media, content, and industry engagement.",
    url: "https://www.energdive.com/advertise-with-us",
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
    title: "Advertise with ENERGDIVE | Energy Industry Marketing Platform",
    description: "Reach decision-makers in India’s energy sector through ENERGDIVE’s premium media and advertising solutions.",
    site: "@energdive",
  },
  other: {
    classification: "Advertising Platform, Energy Media Platform, B2B Marketing Platform",
    topic: "Advertising, Media Partnerships, Brand Promotion, Energy Industry Marketing",
    audience: "Energy companies, corporates, marketers, advertisers, agencies, industry leaders",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
