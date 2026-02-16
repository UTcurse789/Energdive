"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import { ARTICLES } from "@/data/dummy";
import {
    Download, FileText, ChevronLeft, Calendar,
    Clock, Share2, BarChart3, ShieldCheck, BookmarkPlus
} from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";

export default function ArticlePage() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const article = ARTICLES[0];
    // Updated Link for the report
    const downloadUrl = "https://encis.in/report-on-the-next-frontier-advancing-hse-to-achieve-global-sdgs.html";
    const pdfSize = "4.8 MB";

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30 selection:text-zinc-900">
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#00A651] z-60 origin-left" style={{ scaleX }} />
            <Header />

            <main className="pt-[60px] pb-32">
                <article className="container mx-auto px-6 lg:px-12 max-w-6xl">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <Link href="/reports" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-all">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Intelligence
                        </Link>
                        <div className="flex items-center gap-4">
                            <button className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors">
                                <BookmarkPlus className="w-4 h-4 text-zinc-500" />
                            </button>
                            <button className="p-2 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors">
                                <Share2 className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>
                    </div>

                    <header className="max-w-5xl mx-auto text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-block px-4 py-1.5 border border-[#00A651] text-[#00A651] text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6"
                        >
                            HSE & Sustainability Analysis 2026
                        </motion.span>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase italic leading-[1.05] text-zinc-900 mb-10"
                        >
                            The Next Frontier: <br className="hidden md:block" />
                            Advancing HSE to <br className="hidden md:block" />
                            Achieve Global SDGs
                        </motion.h1>

                        <div className="flex items-center justify-center gap-8 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#00A651]" /> Feb 12, 2026</span>
                            <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#00A651]" /> 8 min read</span>
                            <span className="flex items-center gap-2 text-[#00A651]"><ShieldCheck className="w-4 h-4" /> ENCIS Verified</span>
                        </div>
                    </header>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative h-[400px] md:h-[600px] w-full rounded-2rem overflow-hidden shadow-2xl mb-24"
                    >
                        <Image src={article.image} alt="Advancing HSE to Achieve Global SDGs" fill className="object-cover" priority />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <aside className="lg:col-span-3">
                            <div className="sticky top-32 space-y-12">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Council Insights</h4>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <div className="relative w-12 h-12 bg-[#00A651]/10 rounded-full flex items-center justify-center">
                                            <ShieldCheck className="w-6 h-6 text-[#00A651]" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-tight">Bharat HSSE Council</div>
                                            <div className="text-[10px] text-zinc-500 font-medium">Strategic Recommendations</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-zinc-900 text-white">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A651] mb-4">Official Publication</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed mb-6">Recommendations and strategic insights from industry leaders in energy and construction.</p>
                                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                        <Button className="w-full bg-[#00A651] hover:bg-white hover:text-black transition-all text-xs font-black uppercase tracking-widest py-6">
                                            Download Report <Download className="w-4 h-4 ml-2" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </aside>

                        <div className="lg:col-span-9">
                            <div className="max-w-3xl">
                                <div className="relative mb-16 p-10 bg-white border-l-4 border-[#00A651] shadow-xl shadow-zinc-100 rounded-r-3xl">
                                    <div className="flex items-center gap-2 text-[#00A651] mb-4">
                                        <BarChart3 className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Core Mission</span>
                                    </div>
                                    <p className="text-2xl font-serif italic text-zinc-700 leading-relaxed">
                                        Implementation of stringent HSE standards is critical for both human welfare and operational sustainability in high-risk sectors such as energy, manufacturing, and construction.
                                    </p>
                                </div>

                                <div className="prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:font-serif prose-p:text-zinc-600 prose-p:leading-[1.8] prose-strong:text-zinc-900 prose-a:text-[#00A651] prose-a:no-underline hover:prose-a:underline">
                                    <h3>Operational Sustainability</h3>
                                    <p>
                                        Beyond mere compliance, a proactive approach to HSE is a pivotal role in national progress and industrial resilience. The Council works to establish best practices, develop guidelines, and foster a culture of safety.
                                    </p>

                                    <div className="my-12 grid grid-cols-1 sm:grid-cols-2 gap-6 not-prose">
                                        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm text-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Primary Focus</div>
                                            <div className="text-2xl font-black italic text-[#00A651]">High-Risk Sectors</div>
                                        </div>
                                        <div className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm text-center">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Strategy</div>
                                            <div className="text-2xl font-black italic text-[#00A651]">Proactive HSE</div>
                                        </div>
                                    </div>

                                    <h3>Strategic Initiatives</h3>
                                    <p>
                                        The Council facilitates knowledge exchange, conducts training programs, and advocates for policies that enhance HSE performance across critical industrial sectors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}