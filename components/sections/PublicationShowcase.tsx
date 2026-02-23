"use client";
import TiltedCard from "@/components/TiltedCard.jsx";
import {
    PenTool,
    Layers,
    FileText,
    Lightbulb,
    Map,
    BarChart3,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";

// Data matching your reference image exactly
const features = [
    {
        id: 1,
        title: "Leadership Perspectives",
        desc: "Vision statements and forewords from global and national leaders.",
        icon: <PenTool size={24} />,
    },
    {
        id: 2,
        title: "Cover Features",
        desc: "Deep-dive narratives on transformation, strategy, and impact.",
        icon: <Layers size={24} />,
    },
    {
        id: 3,
        title: "Strategic Essays",
        desc: "Opinion-led columns from policymakers, CMDs, and CEOs.",
        icon: <FileText size={24} />,
    },
    {
        id: 4,
        title: "Innovation & Research",
        desc: "Stories from the frontier of technology, R&D, and digitalisation.",
        icon: <Lightbulb size={24} />,
    },
    {
        id: 5,
        title: "State Spotlights",
        desc: "Ground-level data on reform implementation and outcomes.",
        icon: <Map size={24} />,
    },
    {
        id: 6,
        title: "Visual Intelligence",
        desc: "Infographics and data storytelling that decode complexity into clarity.",
        icon: <BarChart3 size={24} />,
    },
];

export function PublicationShowcase({ variant = "full" }: { variant?: "full" | "compact" }) {
    return (
        <section className="container mx-auto px-6 lg:px-12 py-24 max-w-[1400px]">

            {/* 1. DARK HERO SECTION WITH TILTED CARD */}
            <div className="bg-zinc-900 rounded-[3rem] p-10 md:p-20 border border-zinc-800 text-white relative overflow-hidden shadow-2xl mb-24">

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 70% 30%, #00A651 0%, transparent 60%)' }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* Left: Text Content */}
                    <div>
                        <span className="inline-block px-4 py-1.5 border border-zinc-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#00A651] mb-8">
                            The Publication
                        </span>
                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-[0.9] mb-10">
                            The Definitive Voice <br />
                            of <span className="text-[#00A651] italic">Transformation.</span>
                        </h2>
                        <div className="space-y-8">
                            <p className="text-xl font-serif text-zinc-300 leading-relaxed">
                                ENERGDIVE stands as India’s most premium energy leadership publication, blending the depth of a knowledge journal with the design sophistication of a global business review.
                            </p>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                                Published by ClariSector Technologies Pvt. Ltd., the magazine carries the intellectual and institutional credibility of India’s foremost voices in energy and sustainability.
                            </p>
                        </div>
                    </div>

                    {/* Right: 3D Tilted Card Magazine Mockup */}
                    <Link href="/magazine" className="flex justify-center lg:justify-end">
                        <TiltedCard
                            imageSrc="/current-magazine.jpg"
                            altText="ENERGDIVE Magazine Cover"
                            captionText="View Latest Issue"
                            containerHeight="400px"
                            containerWidth="300px"
                            imageHeight="400px"
                            imageWidth="300px"
                            rotateAmplitude={12}
                            scaleOnHover={1.05}
                            showMobileWarning={false}
                            showTooltip={true}
                            displayOverlayContent={true}
                        // overlayContent={
                        //     <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        //         <div className="bg-[#00A651] text-white px-6 py-3 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl backdrop-blur-md hover:scale-105 transition-transform cursor-pointer">
                        //             Read Now <ArrowUpRight size={14} />
                        //         </div>
                        //     </div>
                        // }
                        />
                    </Link>
                </div>
            </div>

            {variant === "full" && (
                <>
                    {/* 2. FEATURES GRID (Matches your white card reference image) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.id}
                                className="bg-white p-8 md:p-10 rounded-[2rem] border border-zinc-100 
                                shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] 
                                hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] 
                                transition-all duration-300 hover:-translate-y-1 group flex flex-col items-center text-center h-full"
                            >
                                {/* Icon */}
                                <div className="mb-6 w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-[#00A651] group-hover:bg-[#00A651] group-hover:text-white transition-colors">
                                    {feature.icon}
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-4 leading-tight">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Footer Text */}
                    <div className="mt-20 text-center max-w-4xl mx-auto px-6">
                        <p className="text-lg md:text-xl font-serif italic text-zinc-500 leading-relaxed">
                            "Through a dual print and digital format, <strong className="text-zinc-900 not-italic">ENERGDIVE</strong> represents not just a magazine—but a knowledge movement for India's sustainable energy future."
                        </p>
                    </div>
                </>
            )}
        </section>
    );
}