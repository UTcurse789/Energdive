"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ARTICLES } from "@/data/dummy";
import { ArrowUpRight, Plus, MoveRight, Bookmark, Command, BarChart3, Zap, Globe2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ArchitectEditorialPage() {
    const heroArticle = ARTICLES[0];
    const topInsights = ARTICLES.slice(1, 4);
    const allNews = ARTICLES;
    const opinionSection = ARTICLES.slice(3, 6);

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] selection:bg-black selection:text-white font-sans overflow-x-hidden">
            <Header />

            <main className="pt-[80px]">
                {/* 1. HERO BANNER */}
                <section className="w-full py-12 md:py-20 bg-white border-b border-black">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex-1"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="w-12 h-[2px] bg-[#00A651]"></span>
                                    <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[4px] text-gray-400 leading-none">Intelligence Portal 2026</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl lg:text-[8vw] font-black tracking-tighter leading-[0.85] uppercase italic">
                                    ENERGY <br />
                                    <span className="text-[#00A651] not-italic">DISCOURSE.</span>
                                </h1>
                            </motion.div>
                            <div className="lg:w-1/3 border-l-2 border-black pl-6 py-2">
                                <p className="text-sm md:text-base font-bold uppercase tracking-widest text-gray-500 leading-relaxed italic">
                                    Strategic insights into the global energy transition, policy shifts, and market volatility.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. TICKER BAR */}
                <div className="bg-white border-b border-gray-200 py-4 overflow-hidden sticky top-[80px] z-40 backdrop-blur-md bg-white/90">
                    <div className="container mx-auto px-6 lg:px-12 flex items-center">
                        <div className="flex gap-16 items-center animate-marquee whitespace-nowrap text-[11px] font-bold text-gray-400 uppercase">
                            {ARTICLES.concat(ARTICLES).map((a, i) => (
                                <Link key={i} href={`/news/${a.slug}`} className="hover:text-black flex items-center gap-3 transition-colors">
                                    <Plus size={10} className="text-[#00A651]" /> {a.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-6 lg:px-12 py-16">

                    {/* 3. EDITORIAL GRID (8:4) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-10 lg:gap-6 mb-24">
                        <div className="lg:col-span-8 group">
                            <Link href={`/news/${heroArticle.slug}`} className="block">
                                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 mb-4 border border-gray-100">
                                    <Image src={heroArticle.image} alt={heroArticle.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    <div className="absolute top-0 right-0 bg-[#00A651] text-white p-4 md:p-6 z-10">
                                        <ArrowUpRight size={28} />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10">
                                        <span className="bg-[#00A651] text-white text-[10px] font-black uppercase px-3 py-1 w-fit mb-4">Lead Report</span>
                                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9] group-hover:underline decoration-white/30">{heroArticle.title}</h2>
                                    </div>
                                </div>
                                <p className="text-lg md:text-xl text-gray-500 font-serif italic leading-relaxed line-clamp-3">{heroArticle.excerpt}</p>
                            </Link>
                        </div>

                        <div className="lg:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 pt-10 lg:pt-0 lg:pl-6">
                            <h3 className="text-xs font-black uppercase tracking-[4px] mb-10 border-b-2 border-black pb-4">Latest Analysis</h3>
                            <div className="space-y-10">
                                {topInsights.map((item, idx) => (
                                    <Link href={`/news/${item.slug}`} key={idx} className="flex gap-5 group">
                                        <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                                            <Image src={item.image} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h4 className="font-bold text-base leading-tight group-hover:text-[#00A651] transition-colors line-clamp-2 italic mb-2">{item.title}</h4>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- BENTO LAYOUT SECTION --- */}
                    <section className="mb-32">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[240px]">
                            {/* Card 1: Large Performance Insight */}
                            <div className="md:col-span-2 md:row-span-2 bg-black text-white p-8 relative overflow-hidden flex flex-col justify-between group">
                                <div className="z-10">
                                    <BarChart3 className="text-[#00A651] mb-4" size={32} />
                                    <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-4">Market <br />Volatility Index</h3>
                                    <p className="text-gray-400 text-sm max-w-xs uppercase font-bold tracking-widest">Real-time analysis of European energy pricing fluctuations.</p>
                                </div>
                                <div className="text-6xl font-black text-[#00A651] z-10 italic">+12.4%</div>
                                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                                    <BarChart3 size={300} />
                                </div>
                            </div>

                            {/* Card 2: Medium Grid Intelligence */}
                            <div className="md:col-span-2 bg-gray-100 p-8 flex flex-col justify-between hover:bg-[#00A651] hover:text-white transition-all group">
                                <div className="flex justify-between items-start">
                                    <Zap size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active Dispatch</span>
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black uppercase italic leading-none mb-2">Grid Resilience</h4>
                                    <p className="text-[10px] font-bold uppercase opacity-60 group-hover:opacity-100">Infrastructure Stress Test 2026</p>
                                </div>
                            </div>

                            {/* Card 3: Small Global Coverage */}
                            <div className="bg-white border border-gray-200 p-8 flex flex-col justify-between hover:border-black transition-all">
                                <Globe2 size={24} className="text-[#00A651]" />
                                <div className="text-3xl font-black italic">142</div>
                                <p className="text-[9px] font-black uppercase text-gray-400">Regions Tracked</p>
                            </div>

                            {/* Card 4: Small Compliance */}
                            <div className="bg-white border border-gray-200 p-8 flex flex-col justify-between hover:border-black transition-all">
                                <ShieldCheck size={24} className="text-[#00A651]" />
                                <div className="text-3xl font-black italic">99%</div>
                                <p className="text-[9px] font-black uppercase text-gray-400">Compliance Rate</p>
                            </div>
                        </div>
                    </section>

                    {/* 4. DYNAMIC SECTOR GRID */}
                    <section className="mb-32">
                        <div className="flex flex-col md:flex-row md:items-end justify-between border-t-2 border-black pt-8 mb-16 gap-6">
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">
                                Market <span className="text-[#00A651]">Intelligence</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
                            {allNews.map((item, idx) => (
                                <div key={idx} className="group flex flex-col border-t border-gray-100 pt-8 hover:border-black transition-all duration-500">
                                    <div className="relative aspect-[4/3] mb-8 overflow-hidden bg-gray-50 border border-gray-100">
                                        <Image src={item.image} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-4 border-b border-gray-50 pb-2">
                                            <span>{item.category}</span>
                                            <span>{item.readTime || '5 MIN'}</span>
                                        </div>
                                        <h4 className="font-bold text-lg leading-tight h-14 line-clamp-2 group-hover:text-[#00A651] transition-colors mb-6">{item.title}</h4>
                                        <Link href={`/news/${item.slug}`} className="mt-auto inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all text-black">
                                            Dive Deeper <MoveRight size={14} className="text-[#00A651]" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 5. EXECUTIVE PERSPECTIVE */}
                    <section className="bg-gray-50 -mx-6 lg:-mx-12 px-6 lg:px-12 py-24 border-y border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                            <div className="lg:col-span-4">
                                <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-[0.9] mb-8">Executive<br />Perspective</h2>
                                <p className="text-gray-500 font-serif italic text-lg border-l-4 border-[#00A651] pl-8 leading-relaxed">"The future of energy is no longer about production, but about systemic intelligence."</p>
                            </div>
                            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {opinionSection.map((item, idx) => (
                                    <div key={idx} className="bg-white p-10 border border-gray-100 hover:border-[#00A651] transition-all flex flex-col h-full shadow-sm hover:shadow-xl">
                                        <div className="w-14 h-14 bg-gray-100 rounded-full mb-8 border border-gray-200 shadow-inner"></div>
                                        <h4 className="font-bold text-xl mb-10 flex-grow italic leading-tight">{item.title}</h4>
                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest pt-6 border-t border-gray-50">
                                            <span>Editorial Staff</span>
                                            <Bookmark size={16} className="hover:text-[#00A651] cursor-pointer transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}