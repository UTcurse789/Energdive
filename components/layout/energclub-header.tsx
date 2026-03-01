"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react"; // Removed Zap since it was unused
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function EnergClubHeader() {
    return (
        <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#E5B866]/20 transition-all duration-300">
            {/* Added 'relative' here so the absolute center element positions itself to this container */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 h-[70px] sm:h-[85px] lg:h-[100px] flex items-center justify-between relative">

                {/* LEFT SIDE: Brand Logos */}
                <div className="flex items-center gap-3 sm:gap-0 z-10 w-full md:w-auto overflow-hidden">
                    {/* EnergClub Logo - hidden on mobile */}
                    <Link href="/energclub" className="hidden sm:flex items-center group shrink-0">
                        <Image
                            src="/energclub.png"
                            alt="EnergClub"
                            width={160}
                            height={60}
                            className="w-auto h-6 sm:h-8 lg:h-10 object-contain"
                        />
                    </Link>

                    {/* Energdive Logo (absolute center on all screens) */}
                    <Link href="/" className="flex items-center group shrink-0 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Image
                            src="/logo2-removebg-preview.png"
                            alt="Energdive"
                            width={160}
                            height={60}
                            className="w-auto h-6 sm:h-8 lg:h-10 object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* RIGHT ACTIONS: Navigation & Auth */}
                <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 z-10 shrink-0">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">
                        <ArrowLeft size={16} />
                        Back
                    </Link>

                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    userPreviewSecondaryIdentifier: { display: "none" },
                                },
                            }}
                        />
                    </SignedIn>

                    <SignedOut>
                        <Link href="/auth">
                            <button className="flex items-center gap-2 bg-gradient-to-r from-[#E5B866] to-[#FFE0B2] text-black px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(229,184,102,0.5)] transition-all transform hover:-translate-y-0.5">
                                <Lock size={14} />
                                Member Login
                            </button>
                        </Link>
                    </SignedOut>
                </div>

            </div>
        </header>
    );
}