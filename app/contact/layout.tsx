import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact ENERGDIVE | Editorial, Advertising & Support | India Energy Platform",
  description: "Get in touch with ENERGDIVE for editorial inquiries, advertising opportunities, partnerships, subscriptions, and general support. Connect with India’s leading energy intelligence platform.",
  keywords: [
    "contact energdive",
    "energdive contact",
    "energy dive contact",
    "energdive magazine contact",
    "energy magazine contact india",
    "energy platform contact india",
    "energy editorial contact india",
    "energy advertising contact india",
    "energy media contact india",
    "energy event partnership india",
    "energy sponsorship india",
    "energy subscriptions india",
    "energy industry contact india"
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
    canonical: "https://www.energdive.com/contact",
  },
  openGraph: {
    title: "Contact ENERGDIVE | Energy Intelligence Platform",
    description: "Reach out to ENERGDIVE for editorial queries, advertising opportunities, partnerships, and support across India’s energy ecosystem.",
    url: "https://www.energdive.com/contact",
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
    title: "Contact ENERGDIVE | Energy Platform India",
    description: "Connect with ENERGDIVE for editorial, advertising, partnerships, and subscription inquiries.",
    site: "@energdive",
  },
  other: {
    classification: "Contact Page, Business Inquiry Page, Energy Media Platform",
    topic: "Contact, Editorial, Advertising, Partnerships, Subscriptions, Support",
    audience: "Energy professionals, advertisers, partners, subscribers, corporates, policymakers",
    distribution: "global",
    language: "English",
    copyright: "© 2026 ENERGDIVE",
    city: "New Delhi",
    state: "Delhi",
    location: "New Delhi, India",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
