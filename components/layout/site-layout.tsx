"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EnergClubHeader } from "@/components/layout/energclub-header";
import { AdBanner } from "@/components/ads/AdBanner";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isEnergClub = pathname.startsWith("/energclub");
    const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/");
    const isDashboard = pathname.startsWith("/dashboard");
    const isOnboarding = pathname.startsWith("/onboarding");
    const isPrint = pathname.startsWith("/print/");

    if (isAuthPage || isDashboard || isOnboarding || isPrint) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            {isEnergClub ? <EnergClubHeader /> : <Header />}

            {/* Header Banner Ad — 728×90 below navigation on all pages */}
            {!isEnergClub && (
                <div className="w-full flex justify-center py-3 bg-white">
                    <AdBanner placement="header_banner" variant="banner" />
                </div>
            )}

            <main className={isEnergClub ? "pt-[70px] sm:pt-[85px] lg:pt-[100px]" : "pt-[120px] md:pt-[140px]"}>
                {children}
            </main>

            {!isEnergClub && <Footer />}
        </>
    );
}
