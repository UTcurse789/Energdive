"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import DotGrid from '@/components/DotGrid'; // Adjust path if necessary

export default function SignInPage() {
    return (
        <div className="relative min-h-screen w-full bg-white overflow-hidden flex items-center justify-center font-sans selection:bg-[#E7BB6D]/30 selection:text-zinc-900">

            {/* --- Interactive DotGrid Background --- */}
            <div className="absolute inset-0 z-0">
                <DotGrid
                    // Fixes the TypeScript "missing style" error
                    style={{ width: '100%', height: '100%' }}
                    dotSize={6}
                    gap={20}
                    baseColor="#f1f1f1"   // Subtle grey dots
                    activeColor="#E7BB6D" // Interactive gold dots
                    proximity={120}
                    shockRadius={200}
                    shockStrength={3}
                    resistance={500}
                    returnDuration={1}
                />

                {/* Radial overlay to make the edges clean and purely white */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,white_90%)]" />
            </div>

            {/* --- Login Container --- */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[480px] px-6 flex justify-center"
            >
                <SignIn
                    appearance={{
                        variables: {
                            colorPrimary: '#E7BB6D',
                            colorText: '#18181b',
                            colorTextSecondary: '#71717a',
                            colorBackground: '#ffffff',
                            colorInputBackground: '#f4f4f5',
                            colorInputText: '#18181b',
                            borderRadius: '1.25rem',
                        },
                        elements: {
                            // High-end glassmorphism and deep shadow for the white background
                            card: "shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-zinc-100 bg-white/90 backdrop-blur-xl",
                            formButtonPrimary: "bg-[#E7BB6D] hover:bg-[#d4a75b] text-black font-bold shadow-xl shadow-[#E7BB6D]/20 transition-all hover:scale-[1.02] active:scale-[0.98] h-11",
                            footerActionLink: "text-[#E7BB6D] hover:text-[#d4a75b] font-bold",
                            headerTitle: "text-zinc-900 font-extrabold tracking-tight",
                            headerSubtitle: "text-zinc-500",
                            socialButtonsBlockButton: "border-zinc-200 hover:bg-zinc-50 transition-all h-11 shadow-sm",
                            socialButtonsBlockButtonText: "font-semibold text-zinc-600",
                            dividerLine: "bg-zinc-100",
                            formFieldInput: "border-zinc-200 focus:ring-2 focus:ring-[#E7BB6D]/20 focus:border-[#E7BB6D] transition-all",
                            footer: "hidden",
                            footerAction: "hidden",
                            internal: "hidden"
                        }
                    }}
                    fallbackRedirectUrl="/dashboard"
                />
            </motion.div>
        </div>
    );
}