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
        <body className="antialiased font-sans" suppressHydrationWarning>
          <SiteLayout>
            {children}
          </SiteLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}