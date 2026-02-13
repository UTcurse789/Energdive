"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EnergClubHeader } from "@/components/layout/energclub-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isEnergClub = pathname.startsWith("/energclub");
    const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    if (isAuthPage) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            {isEnergClub ? <EnergClubHeader /> : <Header />}

            <main className={isEnergClub ? "pt-[80px]" : "pt-[120px] md:pt-[140px]"}>
                {children}
            </main>

            {!isEnergClub && <Footer />}
        </>
    );
}
