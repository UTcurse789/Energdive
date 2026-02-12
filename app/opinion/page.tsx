"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OPINIONS } from "@/data/dummy";
import { motion } from "framer-motion";
import { Quote, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OpinionPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30">
            <Header />

            <main className="relative pt-[80px] pb-32">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-zinc-50 rounded-bl-[200px] -z-10" />

                <div className="container mx-auto px-6 lg:px-12">
                    {/* Editorial Header */}
                    <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="max-w-3xl">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 mb-6"
                            >
                                <span className="h-1px w-8 bg-[#00A651]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00A651]">
                                    Thought Leadership
                                </span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-900 leading-[0.85] uppercase italic"
                            >
                                Expert <br />
                                <span className="text-[#00A651] not-italic">Perspectives.</span>
                            </motion.h1>
                        </div>
                    </header>

                    {/* 12-Column Editorial Grid -> Refactored to Uniform 2-Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-20 gap-x-12">
                        {OPINIONS.map((opinion, idx) => (
                            <motion.div
                                key={opinion.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="group flex flex-col"
                            >
                                {/* Image Container */}
                                <Link href={`/opinion/${opinion.slug}`} className="block overflow-hidden rounded-1.5rem mb-8">
                                    <div className="relative aspect-3/4 overflow-hidden bg-zinc-100">
                                        <Image
                                            src={opinion.author.image}
                                            alt={opinion.title}
                                            fill
                                            className="object-cover grayscale transition-all duration-1000 ease-in-out group-hover:grayscale-0 group-hover:scale-105"
                                        />

                                        {/* Hover Corner Arrow */}
                                        <div className="absolute bottom-6 right-6 bg-white p-3 rounded-full text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl z-10">
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                </Link>

                                {/* Text Content */}
                                <div className="flex flex-col grow">
                                    <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-[#00A651]">{opinion.category || "INSIGHT"}</span>
                                        <span className="h-1px w-4 bg-zinc-200" />
                                        <span className="text-zinc-400">{opinion.date}</span>
                                    </div>

                                    <Link href={`/opinion/${opinion.slug}`}>
                                        <h3 className="font-serif font-bold text-3xl md:text-4xl text-zinc-900 leading-[1.1] transition-all duration-300 group-hover:text-[#00A651] mb-6">
                                            {opinion.title}
                                        </h3>
                                    </Link>

                                    {/* Author Footer */}
                                    <div className="mt-auto pt-6 flex items-center gap-4 border-t border-zinc-100">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200 grayscale group-hover:grayscale-0 transition-all duration-500">
                                            <Image
                                                src={opinion.author.image}
                                                alt={opinion.author.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black uppercase tracking-wider text-zinc-900 leading-none mb-1">
                                                {opinion.author.name}
                                            </div>
                                            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-tighter">
                                                {opinion.author.role || "Contributing Analyst"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Newsletter CTA with Glowing Effect */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-48 bg-zinc-950 rounded-[3rem] p-12 md:p-24 text-center overflow-hidden relative shadow-[0_20px_50px_rgba(0,166,81,0.15)]"
                    >
                        {/* THE GLOW: Radial gradient overlay */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
                            style={{ background: 'radial-gradient(circle at center, #00A651 0%, transparent 70%)' }}
                        />

                        {/* Animated Glassmorphism Blobs */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute -top-24 -left-24 w-64 h-64 bg-[#00A651] blur-[120px] opacity-20 rounded-full"
                        />

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic mb-8">
                                Weekly <span className="text-[#00A651]">Intelligence.</span>
                            </h2>
                            <p className="text-zinc-400 text-lg mb-12 font-serif italic leading-relaxed">
                                Join 50,000+ energy professionals who receive our proprietary breakdown of the most critical industry shifts.
                            </p>
                            <form className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Professional email"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-8 py-4 text-white outline-none focus:border-[#00A651] focus:bg-white/10 transition-all placeholder:text-zinc-600"
                                />
                                <button className="bg-[#00A651] text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-[#008c44] hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,166,81,0.4)]">
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </motion.section>
                </div>
            </main>

            <Footer />
        </div>
    );
}