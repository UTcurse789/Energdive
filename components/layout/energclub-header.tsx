"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react"; // Removed Zap since it was unused
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function EnergClubHeader() {
    return (
        <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#E5B866]/20 transition-all duration-300">
            {/* Added 'relative' here so the absolute center element positions itself to this container */}
            <div className="container mx-auto px-6 lg:px-12 h-[80px] flex items-center justify-between relative">

                {/* LEFT CORNER: EnergClub Logo */}
                <div className="flex items-center z-10">
                    <Link href="/energclub" className="flex items-center group">
                        <Image
                            src="/energclub.png"
                            alt="EnergClub"
                            width={160}
                            height={60}
                            className="w-auto h-8 sm:h-10 object-contain" // Keeps it scaled cleanly inside the 80px height
                        />
                    </Link>
                </div>

                {/* ABSOLUTE CENTER: Energdive Logo */}
                {/* Added top-1/2 and -translate-y-1/2 to perfectly center it vertically as well */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10">
                    <Link href="/" className="flex items-center group">
                        <Image
                            src="/logo2-removebg-preview.png"
                            alt="Energdive"
                            width={160}
                            height={60}
                            className="w-auto h-8 sm:h-10 object-contain"
                            priority // Forces Next.js to load this immediately (best practice for headers)
                        />
                    </Link>
                </div>

                {/* RIGHT ACTIONS: Navigation & Auth */}
                <div className="flex items-center gap-6 sm:gap-8 z-10">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">
                        <ArrowLeft size={16} />
                        Back to EnergDive
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