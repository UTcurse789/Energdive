"use client";

import Link from "next/link";
import { Zap, ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";

export function EnergClubHeader() {
    return (
        <header className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#E5B866]/20 transition-all duration-300">
            <div className="container mx-auto px-6 lg:px-12 h-[80px] flex items-center justify-between">

                {/* Logo Area */}
                <Link href="/energclub" className="flex items-center gap-2 group">
                    <Image
                        src="/energclub.png"
                        alt="EnergClub"
                        width={200}
                        height={200}
                        className="m-8"
                    />
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors">
                        <ArrowLeft size={16} />
                        Back to EnergDive
                    </Link>

                    <button className="flex items-center gap-2 bg-linear-to-r from-[#E5B866] to-[#FFE0B2] text-black px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(229,184,102,0.5)] transition-all transform hover:-translate-y-0.5">
                        <Lock size={14} />
                        Member Login
                    </button>
                </div>
            </div>
        </header>
    );
}
