"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { CustomUserMenu } from "@/components/layout/CustomUserMenu";
import { usePostHog } from "posthog-js/react";

export function EnergClubHeader() {
    const posthog = usePostHog();
    return (
        <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#E5B866]/20 transition-all duration-300">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 h-[70px] sm:h-[85px] lg:h-[100px] flex items-center justify-between">

                {/* LEFT: Energdive logo (always visible) */}
                <Link href="/" className="flex items-center group shrink-0">
                    <Image
                        src="/logo2-removebg-preview.png"
                        alt="Energdive"
                        width={160}
                        height={60}
                        className="w-auto h-6 sm:h-8 lg:h-10 object-contain"
                        priority
                    />
                </Link>

                {/* CENTER: EnergClub logo (hidden on mobile) */}
                <Link href="/energclub" className="hidden sm:flex items-center group shrink-0">
                    <Image
                        src="/energclub.png"
                        alt="EnergClub"
                        width={160}
                        height={60}
                        className="w-auto h-6 sm:h-8 lg:h-10 object-contain"
                    />
                </Link>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 shrink-0">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">
                        <ArrowLeft size={16} />
                        Back
                    </Link>

                    <SignedIn>
                        <CustomUserMenu />
                    </SignedIn>

                    <SignedOut>
                        <Link href="/auth" onClick={() => {
                            if (posthog) posthog.capture('login_clicked', { timestamp: new Date().toISOString(), path: window.location.pathname });
                        }}>
                            <button className="flex items-center gap-2 bg-gradient-to-r from-[#E5B866] to-[#FFE0B2] text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:shadow-[0_0_20px_rgba(229,184,102,0.5)] transition-all transform hover:-translate-y-0.5 whitespace-nowrap">
                                <Lock size={14} />
                                <span className="hidden sm:inline">Member Login</span>
                                <span className="sm:hidden">Login</span>
                            </button>
                        </Link>
                    </SignedOut>
                </div>

            </div>
        </header>
    );
}