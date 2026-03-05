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
//   metadataBase: new URL("https://energdive.com"),
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
import Script from "next/script";
import "./globals.css";
import SiteLayout from "@/components/layout/site-layout";

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

export const metadata: Metadata = {
  title: {
    template: "%s | Energdive",
    default: "Energdive | Premium Energy & Business News",
  },
  description: "Analysis, news, and insights on Energy, Power, Oil & Gas, and Renewables.",
  metadataBase: new URL("https://energdive.com"),
  // Explicitly defining icons
  icons: {
    icon: [
      { url: "/fav.jpg" },
      { url: "/fav.jpg", type: "image/jpg" },
    ],
    apple: [
      { url: "/apple-icon.jpg" },
    ],
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
          {/* Google Tag Manager */}
          <Script id="gtm-script" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5P4C363M');`}
          </Script>
        </head>
        <body className="antialiased font-sans" suppressHydrationWarning>
          {/* Google Tag Manager (noscript) */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-5P4C363M"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
          <SiteLayout>
            {children}
          </SiteLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}