"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    Linkedin,
    Twitter,
    Share2,
    ChevronLeft,
    Bookmark,
    Quote,
    Clock,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/buttons";
import { ScrollProgress } from "@/components/ui/scroll-progress";

/* ---------- Helper: Title Case Function ---------- */
function toTitleCase(str: string) {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/* ---------- Strapi Rich Text Renderer ---------- */
function renderInlineChildren(children: any[]) {
    return children?.map((child: any, idx: number) => {
        let node: React.ReactNode = child.text;
        if (child.bold) node = <strong key={idx} className="font-black text-zinc-900">{node}</strong>;
        if (child.italic) node = <em key={idx} className="italic">{node}</em>;
        if (child.underline) node = <u key={idx}>{node}</u>;
        return node;
    });
}

export default function OpinionContent({ opinion, recommended }: any) {
    return (
        <main className="bg-[#FDFDFD] min-h-screen selection:bg-[#00A651]/10 antialiased">
            <ScrollProgress />

            <article className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-12">
                {/* Navigation */}
                <nav className="flex items-center justify-between mb-16 border-b border-zinc-100 pb-6">
                    <Link
                        href="/opinion"
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-all"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Opinions
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-full"><Bookmark className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-24 items-start">
                    <div className="lg:col-span-7 space-y-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <span className="inline-block px-3 py-1 border border-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] rounded mb-6">
                                {opinion.category}
                            </span>

                            {/* Main Heading: Title Case + Optimized Size */}
                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] mb-8">
                                {toTitleCase(opinion.title)}
                            </h1>

                            <p className="text-xl md:text-2xl text-zinc-500 font-serif italic leading-relaxed border-l-4 border-[#00A651] pl-8">
                                {opinion.excerpt}
                            </p>

                            <div className="flex items-center gap-6 pt-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden grayscale">
                                        {opinion.author?.avatar && (
                                            <Image src={opinion.author.avatar} alt={opinion.author.name} fill className="object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900">{opinion.author?.name}</p>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{opinion.author?.role}</p>
                                    </div>
                                </div>
                                <div className="h-4 w-px bg-zinc-200" />
                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> {opinion.readTime}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-5 h-full min-h-[400px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-3xl bg-zinc-100"
                        >
                            {opinion.featuredImage && (
                                <Image src={opinion.featuredImage} alt={opinion.title} fill className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" priority />
                            )}
                        </motion.div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
                    {/* Main Article Column: STRICT 720px */}
                    <div className="lg:col-span-8 lg:col-start-3 max-w-[720px] mx-auto w-full">
                        <div className="prose prose-zinc max-w-none">
                            {opinion.content?.map((block: any, i: number) => {
                                const text = block.children?.map((c: any) => c.text).join("") || "";
                                if (!text.trim()) return null;

                                switch (block.type) {
                                    case "heading":
                                        /* Sub Heading: Balanced size and bold */
                                        return (
                                            <h2 key={i} className="font-bold tracking-tight text-2xl mt-12 mb-6 text-zinc-900">
                                                {renderInlineChildren(block.children)}
                                            </h2>
                                        );

                                    case "quote":
                                        return (
                                            <blockquote key={i} className="my-16 border-none p-0 not-prose">
                                                <div className="bg-zinc-50 p-12 rounded-3xl relative overflow-hidden">
                                                    <Quote className="absolute -top-4 -left-4 w-24 h-24 text-zinc-200/40" />
                                                    <p className="text-2xl font-bold italic tracking-tight text-zinc-900 leading-tight relative z-10">
                                                        "{text}"
                                                    </p>
                                                </div>
                                            </blockquote>
                                        );

                                    default:
                                        /* Main Content: Increased size and readability */
                                        return (
                                            <p key={i} className="font-serif text-[20px] leading-[1.85] text-zinc-700 mb-8 selection:bg-[#00A651]/20">
                                                {renderInlineChildren(block.children)}
                                            </p>
                                        );
                                }
                            })}
                        </div>

                        {/* Newsletter CTA Block */}
                        <div className="mt-24 p-12 rounded-3xl bg-black text-white overflow-hidden relative">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">The Strategic Edge.</h3>
                                <p className="text-zinc-400 font-serif mb-8 text-lg italic">Get exclusive executive summaries delivered weekly.</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input className="bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 flex-1 focus:outline-none focus:border-[#00A651]" placeholder="Enter your work email" />
                                    <Button className="bg-[#00A651] hover:bg-[#008c44] rounded-full px-10 py-4 font-black uppercase text-[10px] tracking-widest">Join Now</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Footer Recommended */}
            <footer className="mt-40 bg-zinc-50 py-24 border-t border-zinc-100">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex justify-between items-end mb-16">
                        <h4 className="text-5xl font-black uppercase italic tracking-tighter">Further <br /> Opinions.</h4>
                        <Link href="/opinion" className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:text-[#00A651]">
                            Explore All <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {recommended?.map((item: any) => (
                            <Link key={item.id} href={`/opinion/${item.slug}`} className="group space-y-6">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700">
                                    {item.featuredImage && (
                                        <Image src={item.featuredImage} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00A651]">{item.category}</span>
                                    <h5 className="text-2xl font-bold font-serif leading-tight group-hover:text-[#00A651] transition-colors line-clamp-2">{item.title}</h5>
                                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{item.author?.name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </footer>
        </main>
    );
}
