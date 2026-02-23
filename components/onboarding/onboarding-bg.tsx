"use client";

import DotGrid from "@/components/DotGrid";

export default function OnboardingBackground() {
    return (
        <div className="absolute inset-0 z-0">
            <DotGrid
                style={{ width: "100%", height: "100%" }}
                dotSize={6}
                gap={20}
                baseColor="#f1f1f1"
                activeColor="#10b981"
                proximity={120}
                shockRadius={200}
                shockStrength={3}
                resistance={500}
                returnDuration={1}
            />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,white_90%)]" />
        </div>
    );
}
