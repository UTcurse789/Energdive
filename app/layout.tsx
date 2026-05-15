// import { ClerkProvider } from "@clerk/nextjs";
// import type { Metadata } from "next";
// import { Inter, Merriweather } from "next/font/google";
// import "./globals.css";
// import SiteLayout from "@/components/layout/site-layout";

// const sans = Inter({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
// });

// const serif = Merriweather({
//   weight: ["300", "400", "700", "900"],
//   subsets: ["latin"],
//   variable: "--font-serif",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   title: {
//     template: "%s | Energdive",
//     default: "Energdive | Premium Energy & Business News",
//   },
//   description: "Analysis, news, and insights on Energy, Power, Oil & Gas, and Renewables.",
//   metadataBase: new URL("https://www.energdive.com"),
// };

// export default function RootLayout({
//   children
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <ClerkProvider>
//       <html lang="en" className={`${sans.variable} ${serif.variable}`}>
//         <body className="antialiased font-sans" suppressHydrationWarning>
//           <SiteLayout>
//             {children}
//           </SiteLayout>
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }


import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/site-layout";
import { UtmTracker } from "@/components/UtmTracker";
import { Suspense } from "react";
import ConsentAwareGTM from "@/components/ConsentAwareGTM";
import CookieConsent from "@/components/CookieConsent";
import { PlatformOnboarding } from "@/components/onboarding/platform-onboarding";
import AuthPromptModal from "@/components/ui/auth-prompt-modal";
import { PostHogProvider } from "./providers";
import { PostHogIdentify } from "@/components/PostHogIdentify";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

// export const metadata: Metadata = {
//   title: {
//     template: "%s | Energdive",
//     default: "Energdive | Insights and Market Intelligence",
//   },
//   description: "Analysis, news, and insights on Energy, Power, Oil & Gas, and Renewables.",
//   metadataBase: new URL("https://www.energdive.com"),
//   // Explicitly defining icons
//   icons: {
//     icon: [
//       { url: "/fav.jpg" },
//       { url: "/fav.jpg", type: "image/jpg" },
//     ],
//     apple: [
//       { url: "/apple-icon.jpg" },
//     ],
//   },
// };

export const metadata: Metadata = {
  metadataBase: new URL("https://www.energdive.com"),

  title: {
    template: "%s - ENERGDIVE",
    default: "ENERGDIVE - Insights and Market Intelligence | ENERGDIVE Magazine | India's Energy Intelligence Platform",
  },

  description:
    "ENERGDIVE is India's strategic energy intelligence platform delivering insights on energy transition, oil & gas, power, new energies, sustainability, and climate policy through expert journalism and the ENERGDIVE magazine.",

  keywords: [
    "energdive",
    "energy dive",
    "energdive magazine",
    "energy dive magazine",
    "energydive magazine",
    "energ dive magazine",
    "india energy magazine",
    "energy transition india",
    "energy policy india",
    "oil and gas india",
    "power and utilities india",
    "clean energy india",
    "energy intelligence platform"
  ],

  authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
  creator: "ENERGDIVE - Insights and Market Intelligence",
  publisher: "ClariSector Technologies Pvt. Ltd.",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    type: "website",
    siteName: "ENERGDIVE",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ENERGDIVE - India's Energy Intelligence Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@energdive",
    creator: "@energdive",
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${sans.variable} ${serif.variable}`}>
        <head>
          <link rel="preconnect" href="https://cms.energdive.com" />
          <link rel="preconnect" href="https://cdn.energdive.com" />
          <link rel="preconnect" href="https://clerk.energdive.com" />
        </head>
        <body className="antialiased font-sans" suppressHydrationWarning>
          <PostHogProvider>
            {/* GTM — only loads after cookie consent is accepted */}
            <ConsentAwareGTM gtmId="GTM-5P4C363M" />
            <Suspense fallback={null}>
              <UtmTracker />
            </Suspense>
            <PostHogIdentify />
            <PlatformOnboarding />
            <AuthPromptModal />
            <SiteLayout>
              {children}
            </SiteLayout>
            <CookieConsent />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
