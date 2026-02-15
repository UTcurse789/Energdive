"use client";

import { SignUp } from "@clerk/nextjs";
import { motion } from "framer-motion";
import DotGrid from "@/components/DotGrid";

export default function SignUpPage() {
    return (
        <div className="relative min-h-screen w-full bg-white overflow-hidden flex items-center justify-center font-sans selection:bg-[#E7BB6D]/30 selection:text-zinc-900">

            {/* --- Interactive DotGrid Background --- */}
            <div className="absolute inset-0 z-0">
                <DotGrid
                    style={{ width: '100%', height: '100%' }}
                    dotSize={6}          // Slightly smaller for a more refined look
                    gap={20}             // Increased gap for a cleaner aesthetic
                    baseColor="#f1f1f1"  // Very light grey (almost invisible until interaction)
                    activeColor="#E7BB6D" // Your brand Gold
                    proximity={120}
                    shockRadius={200}
                    shockStrength={3}
                    resistance={500}
                    returnDuration={1}
                />

                {/* Optional: Subtle vignette to focus eye on the center */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,white_90%)]" />
            </div>

            {/* --- Signup Container --- */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[480px] px-6 flex justify-center"
            >
                <SignUp
                    appearance={{
                        variables: {
                            colorPrimary: '#E7BB6D',
                            colorText: '#18181b',
                            colorTextSecondary: '#71717a',
                            colorBackground: '#ffffff',
                            colorInputBackground: '#f4f4f5',
                            colorInputText: '#18181b',
                            borderRadius: '1.25rem', // Slightly rounder for a modern feel
                        },
                        elements: {
                            // High-end shadow and glass effect
                            card: "shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100/80 bg-white/90 backdrop-blur-xl",
                            formButtonPrimary: "bg-[#E7BB6D] hover:bg-[#d4a75b] text-black font-bold py-6 shadow-xl shadow-[#E7BB6D]/20 transition-all hover:scale-[1.02] active:scale-[0.98]",
                            footerActionLink: "text-[#E7BB6D] hover:text-[#d4a75b] font-bold",
                            headerTitle: "text-zinc-900 font-extrabold tracking-tight",
                            headerSubtitle: "text-zinc-500",
                            socialButtonsBlockButton: "border-zinc-200 hover:bg-zinc-50 transition-all duration-200 h-12 shadow-sm",
                            socialButtonsBlockButtonText: "font-semibold text-zinc-600",
                            dividerLine: "bg-zinc-100",
                            formFieldInput: "border-zinc-200 focus:ring-2 focus:ring-[#E7BB6D]/20 focus:border-[#E7BB6D] h-12 transition-all",
                            formFieldLabel: "text-zinc-700 font-medium ml-1",
                        }
                    }}
                    fallbackRedirectUrl="/dashboard"
                />
            </motion.div>

            {/* Branding Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                <div className="w-1 h-1 bg-[#E7BB6D] rounded-full animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.5em] text-zinc-400 font-bold">
                    System Secure
                </span>
            </div>
        </div>
    );
}