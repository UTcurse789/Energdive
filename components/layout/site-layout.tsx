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

    if (isAuthPage || isDashboard || isOnboarding) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            {isEnergClub ? <EnergClubHeader /> : <Header />}

            {/* Global Header Ad Banner */}
            {!isEnergClub && (
                <div className="pt-[120px] md:pt-[140px]">
                    <AdBanner placement="header_banner" variant="banner" className="py-3 bg-white" />
                </div>
            )}

            <main className={isEnergClub ? "pt-[80px]" : ""}>
                {children}
            </main>

            {!isEnergClub && <Footer />}
        </>
    );
}
