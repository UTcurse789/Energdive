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
import { motion, Variants } from "framer-motion";

const features = [
    {
        id: 1,
        title: "Leadership Perspectives",
        desc: "Vision statements and forewords from global leaders.",
        icon: <PenTool size={20} />,
    },
    {
        id: 2,
        title: "Cover Features",
        desc: "Deep-dive narratives on transformation and impact.",
        icon: <Layers size={20} />,
    },
    {
        id: 3,
        title: "Strategic Essays",
        desc: "Columns from policymakers, CMDs, and CEOs.",
        icon: <FileText size={20} />,
    },
    {
        id: 4,
        title: "Innovation & Research",
        desc: "Stories from the frontier of technology and R&D.",
        icon: <Lightbulb size={20} />,
    },
    {
        id: 5,
        title: "State Spotlights",
        desc: "Ground-level data on reform implementation.",
        icon: <Map size={20} />,
    },
    {
        id: 6,
        title: "Visual Intelligence",
        desc: "Infographics that decode complexity into clarity.",
        icon: <BarChart3 size={20} />,
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

export function Publication2({ variant = "full", latestCoverImage, latestIssueSlug }: { variant?: "full" | "compact"; latestCoverImage?: string; latestIssueSlug?: string }) {
    return (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-8">

            {/* 1. COMPACT HERO SECTION */}
            <div className="bg-zinc-900 p-6 sm:p-8 md:p-14 text-white relative overflow-hidden mb-8">

                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 70% 30%, #00A651 0%, transparent 60%)' }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                    {/* Left: Text Content (Occupies 8 columns) */}
                    <div className="lg:col-span-8">
                        <span className="inline-block px-3 py-1 border border-zinc-700 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-[#00A651] mb-6">
                            The Publication
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white leading-tight mb-6 sm:mb-8">
                            ENERGDIVE Insights and <br className="hidden md:inline" />
                            Market <span className="text-[#00A651] italic">Intelligence.</span>
                        </h2>

                        {/* Two Column Text for space efficiency */}
                        <div className="flex gap-8 items-start">
                            <p className="text-base font-serif text-zinc-300 leading-relaxed border-l-2 border-[#00A651] pl-4">
                                ENERGDIVE Magazine delivers in-depth stories, expert viewpoints, and sector intelligence each month, capturing the trends and decisions driving India’s evolving energy landscape. It is your trusted source for credible, well-curated knowledge.
                            </p>
                        </div>
                    </div>

                    {/* Right: Magazine (Occupies 4 columns) */}
                    <Link
                        href={latestIssueSlug ? `/issues/${latestIssueSlug}` : "/issues"}
                        className="lg:col-span-4 flex justify-center lg:justify-end group relative"
                    >
                        <div className="relative">

                            <TiltedCard
                                imageSrc={latestCoverImage || "/current-magazine.jpg"}
                                altText="ENERGDIVE Cover"
                                containerHeight="320px"
                                containerWidth="240px"
                                imageHeight="320px"
                                imageWidth="240px"
                                rotateAmplitude={10}
                                scaleOnHover={1.05}
                                showTooltip={false}
                                displayOverlayContent={true}
                            />

                            {/* ARROW OVERLAY */}
                            <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1
      bg-black/70 backdrop-blur px-3 py-1.5 rounded-full
      opacity-0 group-hover:opacity-100 transition-all duration-300
      translate-y-2 group-hover:translate-y-0">

                                <span className="text-white text-[10px] uppercase tracking-widest font-semibold">
                                    View Issue
                                </span>

                                <ArrowUpRight className="w-4 h-4 text-white" />

                            </div>

                        </div>
                    </Link>
                </div>
            </div>

            {variant === "full" && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.id}
                            variants={itemVariants}
                            className="bg-white p-6 rounded-[1.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all group flex items-start gap-4 text-left"
                        >
                            {/* Icon - Smaller & Side aligned */}
                            <div className="shrink-0 w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-[#00A651] group-hover:bg-[#00A651] group-hover:text-white transition-colors">
                                {feature.icon}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-serif font-bold text-zinc-900 leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-[11px] text-zinc-400 leading-tight">
                                    {feature.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    );
}
