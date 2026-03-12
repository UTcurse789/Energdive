"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import LogoLoop from "@/components/ui/logo-loop";
import { Flame, Zap, Wind, Globe, ArrowUpRight } from "lucide-react";
import { PublicationShowcase } from "@/components/sections/PublicationShowcase";
import ZohoSalesIQ from "@/components/ZohoSalesIQ";

// Partner Logos Data
const partnerLogos = [
    {
        id: "1",
        src: "/Loop/energniti-removebg-preview.png",
        alt: "EnergNiti Dialogue",
        href: "#"
    },
    {
        id: "2",
        src: "/Loop/oil-spill-removebg-preview.png",
        alt: "Oil Spill India",
        href: "#"
    },
    {
        id: "3",
        src: "/Loop/bharat-electricity-removebg-preview.png",
        alt: "Bharat Electricity Forum",
        href: "#"
    },
    {
        id: "4",
        src: "/Loop/transform-hse-removebg-preview.png",
        alt: "Transform HSE",
        href: "#"
    },
    {
        id: "5",
        src: "/Loop/grpc-removebg-preview.png",
        alt: "Global Refining & Petrochemicals Congress",
        href: "#"
    },
    {
        id: "6",
        src: "/Loop/bharat-fire-removebg-preview.png",
        alt: "Bharat Fire & Safety Congress",
        href: "#"
    },
    {
        id: "7",
        src: "/Loop/ipsc-removebg-preview.png",
        alt: "International Process Safety Conference",
        href: "#"
    },
];

// Sectors Data
const sectors = [
    { id: 1, title: "Oil & Gas", icon: <Flame size={18} /> },
    { id: 2, title: "Power & Utilities", icon: <Zap size={18} /> },
    { id: 3, title: "Renewables", icon: <Wind size={18} /> },
    { id: 4, title: "Climate Action", icon: <Globe size={18} /> },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30">
            <Header />

            <main className="relative pt-[140px] pb-32">

                {/* 1. HERO HEADER */}
                <section className="container mx-auto px-6 lg:px-12 mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-5xl"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <span className="h-[2px] w-12 bg-[#00A651]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00A651]">
                                Our Mission
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-zinc-900 leading-[0.85] uppercase italic">
                            About
                            <span className="text-[#00A651] not-italic">.</span>
                        </h1>
                    </motion.div>
                </section>

                {/* 2. FOREWORD SECTION */}
                {/* Fixed: Added clear separation via border-t and padding */}
                <section className="container mx-auto px-6 lg:px-12">
                    <div className="border-t border-zinc-200 pt-24 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl font-black uppercase tracking-tight leading-none mb-6">
                                    Foreword: <br />
                                    <span className="text-zinc-400">A Decisive Decade</span>
                                </h2>
                                <div className="h-1 w-20 bg-[#00A651] mb-6" />
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                    India's Energy Leadership
                                </p>
                            </motion.div>
                        </div>
                        <div className="lg:col-span-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                            >
                                <p className="text-2xl md:text-3xl font-serif text-zinc-700 leading-relaxed mb-10">
                                    India is entering a defining decade—one that will shape not only its energy security but also its global influence in the age of sustainability. Over the past ten years, bold policy reforms, resilient public sector leadership, and a surge in private innovation have transformed India into one of the world’s most dynamic and diversified energy markets.
                                </p>
                                <div className="prose prose-lg text-zinc-500 mb-10">
                                    <p>
                                        Over the past ten years, bold policy reforms, resilient public sector leadership, and a surge in private innovation have transformed India into one of the world’s most dynamic and diversified energy markets.
                                    </p>
                                    <p>
                                        Yet, as the nation accelerates toward its <strong>net-zero</strong> goals and the vision of <strong>Viksit Bharat 2047</strong>, the challenge has evolved—from access to advancement, from growth to green leadership.
                                    </p>
                                </div>
                                <div className="bg-[#00A651]/5 border-l-4 border-[#00A651] p-8 rounded-r-2xl">
                                    <p className="text-lg font-bold italic text-zinc-800 leading-relaxed">
                                        ENERGDIVE emerges at this pivotal juncture as the definitive voice of India’s energy transformation—documenting not just the journey, but the leadership and ideas shaping it.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 3. STRATEGIC PARTNERS LOOP */}
                {/* <section className="w-full  border-y border-zinc-100 py-28 mb-32 overflow-hidden">
                    <div className="container mx-auto px-6 mb-16 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                            Our Strategic Initiatives
                        </p>
                    </div>

                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-zinc-50 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-zinc-50 to-transparent z-10 pointer-events-none" />

                        <LogoLoop
                            logos={partnerLogos}
                            speed={40}
                            direction="left"
                            logoHeight={80}
                            gap={100}
                            hoverSpeed={0}
                            scaleOnHover={true}
                            fadeOut={false}
                            ariaLabel="Strategic Partners"
                        />
                    </div>
                </section> */}

                {/* 4. THE NEED SECTION */}
                <section className="container mt-[120px] mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Wrap in a div to control alignment and maximum width */}
                        <div className="flex justify-center lg:justify-start">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                // Changed max-w to md (or sm) and aspect to 3/4 to reduce height
                                className="relative w-full max-w-md aspect-[3/4] bg-zinc-100 rounded-[2.5rem] overflow-hidden shadow-2xl"
                            >
                                <Image
                                    src="/energdive.jpg"
                                    alt="Strategic Intelligence Platform"
                                    fill
                                    className="object-cover transition-all duration-1000"
                                />
                            </motion.div>
                        </div>

                        <div>
                            <span className="inline-block px-4 py-1.5 border border-zinc-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">
                                The Need
                            </span>
                            <h2 className="text-4xl md:text-xl lg:text-4xl font-black uppercase italic leading-[0.9] mb-8 text-zinc-900">
                                A Strategic  <br />
                                Intelligence Platform for  <span className="text-[#00A651]">India’s Energy Future..</span>
                            </h2>
                            <p className="text-lg md:text-xl text-zinc-600 leading-relaxed mb-6 font-serif">
                                India’s energy transition is not a single narrative—it is a convergence of technologies, markets, and policies that must evolve in harmony. The pace and scale of this transformation demand more than coverage; they demand strategic intelligence.
                            </p>
                            <p className="text-base text-zinc-500 leading-relaxed mb-8">
                                <strong className="text-[#00A651]">ENERGDIVE</strong> is designed to fill this critical void. Conceived as India’s foremost Strategic Intelligence Platform, it will unify diverse stakeholders—ministries, PSUs, industry leaders, investors, and global institutions—on one credible and data-driven platform.
                            </p>
                            <p className="text-base text-zinc-500 leading-relaxed mb-8">
                                Its mission is to transform information into intelligence, insight into influence, and influence into impact. By curating high-quality thought leadership and evidence-based dialogue, ENERGDIVE will empower decision-makers to translate ambition into action
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="h-[2px] w-12 bg-[#00A651]" />
                                <span className="text-xs font-bold uppercase tracking-widest text-[#00A651]">Anchored in India’s national vision for sustainable and inclusive growth.</span>
                            </div>
                        </div>
                    </div>
                </section>
                <div className="mt-[120px]">
                    <PublicationShowcase />
                </div>

            </main>
            <ZohoSalesIQ />
        </div>
    );
}