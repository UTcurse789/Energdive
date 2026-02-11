import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import { MarketTicker } from "@/components/features/ticker";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ReactNode } from "react";

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
};

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="antialiased">
        {/* Header ko top par rakhein */}
        <Header />

        {/* Ticker Container: Header fixed hai toh margin/padding add karein */}
        <div className="relative pt-[64px] w-full bg-background border-b z-40">
          <MarketTicker />
        </div>

        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}