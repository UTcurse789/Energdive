"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Linkedin, Twitter, Share2, ChevronLeft, Bookmark, Quote, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/buttons";
import { motion } from "framer-motion";
import { Opinion } from "@/types";
import { cn } from "@/lib/utils";

interface OpinionContentProps {
    opinion: Opinion;
    recommended: Opinion[];
}

export function OpinionContent({ opinion, recommended }: OpinionContentProps) {
    // Safe access for main opinion author
    const author = opinion.author;
    const authorImage = author && 'image' in author
        ? (author as any).image
        : (author as any)?.avatar || "/images/avatars/default.png";
    const authorName = author?.name || "Unknown Author";
    const authorRole = author?.role || "Contributor";

    return (
        <main className="bg-[#FDFDFD] min-h-screen selection:bg-[#00A651]/20">
            {/* Header / Navigation Spacer */}
            <div className="h-20" />

            <article className="container mx-auto px-6 lg:px-12 py-12">
                {/* 1. BREADCRUMBS & TOP ACTIONS */}
                <div className="flex items-center justify-between mb-12 border-b border-zinc-100 pb-6">
                    <Link
                        href="/opinion"
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-all"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Perspectives
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="rounded-full hover:bg-zinc-50">
                            <Bookmark className="w-4 h-4 text-zinc-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full hover:bg-zinc-50">
                            <Share2 className="w-4 h-4 text-zinc-400" />
                        </Button>
                    </div>
                </div>

                {/* 2. HERO SECTION: Split Layout */}
                <header className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 items-center">
                    <div className="lg:col-span-7 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <span className="inline-block px-4 py-1 border border-[#00A651] text-[#00A651] text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                                {opinion.category || "Expert Opinion"}
                            </span>

                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[0.9] uppercase italic">
                                {opinion.title}
                            </h1>

                            <p className="text-xl md:text-2xl text-zinc-500 font-serif italic leading-relaxed border-l-4 border-zinc-100 pl-8">
                                {opinion.excerpt}
                            </p>

                            <div className="flex items-center gap-6 pt-6">
                                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                    Published {opinion.date}
                                </div>
                                <div className="h-1 w-1 bg-zinc-200 rounded-full" />
                                <div className="text-[11px] font-bold text-[#00A651] uppercase tracking-widest">
                                    8 Min Read
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-5 order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-4/5 overflow-hidden rounded-2rem shadow-2xl bg-zinc-100"
                        >
                            <Image
                                src={authorImage}
                                alt={authorName}
                                fill
                                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                                priority
                            />
                        </motion.div>
                    </div>
                </header>

                {/* 3. CONTENT AREA */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
                    {/* Floating Social Sidebar */}
                    <aside className="hidden lg:block lg:col-span-1 sticky top-40 h-fit">
                        <div className="flex flex-col gap-6 items-center">
                            <Button variant="ghost" className="rounded-full w-12 h-12 hover:text-[#00A651]">
                                <Twitter className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" className="rounded-full w-12 h-12 hover:text-[#00A651]">
                                <Linkedin className="w-5 h-5" />
                            </Button>
                            <div className="w-px h-12 bg-zinc-100" />
                        </div>
                    </aside>

                    {/* Main Body Text */}
                    <div className="lg:col-span-8 lg:col-offset-1 prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:font-serif prose-p:text-zinc-600 prose-p:leading-[1.8] prose-strong:text-zinc-900 prose-blockquote:border-none prose-blockquote:p-0">
                        {opinion.content ? <p>{opinion.content}</p> : null}

                        <p>
                            The transition to a sustainable energy future is not merely a technological challenge; it is a fundamental restructuring of global power dynamics. As we navigate the complexities of 2026, the integration of smart-grid technology and decentralized storage is moving from a luxury to a baseline operational requirement.
                        </p>

                        <blockquote className="my-16">
                            <div className="bg-zinc-50 p-12 rounded-[2.5rem] relative overflow-hidden">
                                <Quote className="absolute -top-4 -left-4 w-24 h-24 text-zinc-100 z-0" />
                                <p className="text-3xl md:text-4xl font-black italic text-zinc-900 tracking-tighter leading-tight relative z-10">
                                    "Decarbonization is no longer a cost-center; it is the primary engine of asset appreciation in the modern industrial landscape."
                                </p>
                            </div>
                        </blockquote>

                        <h3>Strategic Implications</h3>
                        <p>
                            Institutional investors are increasingly pivoting toward transitional assets. The shift in capital allocation is creating a feedback loop where the cost of capital for hydrocarbon projects continues to rise, while renewable infrastructure enjoys unprecedented liquidity.
                        </p>

                        {/* Author Spotlight Box */}
                        <div className="mt-24 p-12 rounded-2rem border border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row gap-8 items-center not-prose">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 grayscale">
                                <Image src={authorImage} alt={authorName} fill className="object-cover" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-[#00A651] mb-2">About the Author</h4>
                                <h5 className="text-2xl font-black uppercase tracking-tighter mb-2">{authorName}</h5>
                                <p className="text-zinc-500 font-serif italic text-sm leading-relaxed">
                                    {authorRole}. With over 15 years in energy forecasting, they provide critical analysis for institutional stakeholders and policy makers globally.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. RECOMMENDED SECTION */}
                <footer className="mt-40 pt-20 border-t border-zinc-100">
                    <div className="flex items-end justify-between mb-16">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00A651] mb-4 block">Continue Reading</span>
                            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Related <br />Perspectives.</h3>
                        </div>
                        <Link href="/opinion" className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#00A651] transition-all">
                            View All Opinions
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 p-10 md:grid-cols-3 gap-12">
                        {recommended.map((item) => {
                            const itemAuthor = item.author;
                            const itemAuthorImage = itemAuthor && 'image' in itemAuthor
                                ? (itemAuthor as any).image
                                : (itemAuthor as any)?.avatar || "/images/avatars/default.png";

                            return (
                                <Link key={item.id} href={`/opinion/${item.slug}`} className="group block">
                                    <div className="relative aspect-3/4 mb-8 overflow-hidden rounded-2xl bg-zinc-100">
                                        <Image
                                            src={itemAuthorImage}
                                            alt={itemAuthor?.name || "Author"}
                                            fill
                                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-[#00A651] uppercase tracking-widest">
                                            {item.category || "Insight"}
                                        </span>
                                        <h4 className="font-serif font-bold text-2xl leading-tight text-zinc-900 group-hover:text-[#00A651] transition-colors line-clamp-2">
                                            {item.title}
                                        </h4>
                                        <div className="pt-4 border-t border-zinc-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{itemAuthor?.name || "Unknown"}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </footer>
            </article>
        </main>
    );
}
