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
import "./globals.css";
import SiteLayout from "@/components/layout/site-layout";
import { ClientAuthModals, ClientConsentAwareGTM } from "@/components/layout/client-layout-features";
import { UtmTracker } from "@/components/UtmTracker";
import { Suspense } from "react";
import { PostHogProvider } from "./providers";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { AuthModalProvider } from "@/hooks/use-auth-modal";
import { ORGANIZATION_SCHEMA } from "@/lib/organization-schema";

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
  title: "ENERGDIVE",
  description: "ENERGDIVE",
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cms.energdive.com" />
        <link rel="preconnect" href="https://cdn.energdive.com" />
        <link rel="preconnect" href="https://clerk.energdive.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              ...ORGANIZATION_SCHEMA,
            }).replace(/</g, "\\u003c")
          }}
        />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ClerkProvider>
          <PostHogProvider>
            <AuthModalProvider>
              {/* GTM — only loads after cookie consent is accepted */}
              <ClientConsentAwareGTM />
              <Suspense fallback={null}>
                <UtmTracker />
              </Suspense>
              <PostHogIdentify />
              <ClientAuthModals />
              <SiteLayout>
                {children}
              </SiteLayout>
            </AuthModalProvider>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
