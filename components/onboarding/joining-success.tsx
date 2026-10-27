"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

export default function JoiningSuccess({ onContinue }: { onContinue: () => void }) {
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        heading.current?.focus();
        heading.current?.scrollIntoView({ block: "center" });
    }, []);

    return (
        <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white px-6 py-12 text-center sm:px-10" role="status">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                {Array.from({ length: 36 }, (_, index) => (
                    <span key={index} className="joining-confetti" style={{
                        left: `${8 + (index * 17) % 84}%`,
                        backgroundColor: ["#0AB996", "#e5b949", "#ee6695", "#437cdb"][index % 4],
                        animationDelay: `${(index % 6) * 0.08}s`,
                        rotate: `${index * 37}deg`,
                    }} />
                ))}
            </div>
            <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#0AB996] text-white">
                <Check className="h-9 w-9" aria-hidden="true" />
            </div>
            <h2 ref={heading} tabIndex={-1} className="relative text-2xl font-bold text-zinc-900 outline-none sm:text-3xl">
                Welcome to ENERGClub
            </h2>
            <p className="relative mt-3 text-base text-zinc-600">Thanks for submitting your details.</p>
            <p className="relative mt-1 text-sm text-zinc-500">Your profile has been saved successfully.</p>
            <button type="button" onClick={onContinue} className="relative mt-8 min-h-12 w-full rounded-lg bg-[#0AB996] px-6 py-3 font-semibold text-white hover:bg-[#099c82] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0AB996]">
                Continue to ENERGClub
            </button>
        </div>
    );
}
