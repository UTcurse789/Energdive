// "use client";

// import React from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { Linkedin, Twitter, Share2, ChevronLeft, Bookmark, Quote, ArrowUpRight } from "lucide-react";
// import { Button } from "@/components/ui/buttons";
// import { motion } from "framer-motion";
// import { Opinion } from "@/types";
// import { cn, slugify } from "@/lib/utils";

// /* ---------- Strapi inline text renderer ---------- */
// function renderInlineChildren(children: any[]) {
//     return children?.map((child: any, idx: number) => {
//         let node: React.ReactNode = child.text;
//         if (child.bold) node = <strong key={idx}>{node}</strong>;
//         if (child.italic) node = <em key={idx}>{node}</em>;
//         if (child.underline) node = <u key={idx}>{node}</u>;
//         return node;
//     });
// }

// interface OpinionContentProps {
//     opinion: Opinion;
//     recommended: Opinion[];
// }

// export function OpinionContent({ opinion, recommended }: OpinionContentProps) {
//     return (
//         <main className="bg-[#FDFDFD] min-h-screen selection:bg-[#00A651]/20">
//             {/* Header / Navigation Spacer */}
//             <div className="h-20" />

//             <article className="container mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
//                 {/* 1. BREADCRUMBS & TOP ACTIONS */}
//                 <div className="flex items-center justify-between mb-8 sm:mb-12 border-b border-zinc-100 pb-4 sm:pb-6">
//                     <Link
//                         href="/opinion"
//                         className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-all"
//                     >
//                         <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
//                         Back to Perspectives
//                     </Link>
//                     <div className="flex items-center gap-4">
//                         <Button variant="ghost" size="sm" className="rounded-full hover:bg-zinc-50">
//                             <Bookmark className="w-4 h-4 text-zinc-400" />
//                         </Button>
//                         <Button variant="ghost" size="sm" className="rounded-full hover:bg-zinc-50">
//                             <Share2 className="w-4 h-4 text-zinc-400" />
//                         </Button>
//                     </div>
//                 </div>

//                 {/* 2. HERO SECTION: Split Layout */}
//                 <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 mb-16 sm:mb-24 items-center">
//                     <div className="lg:col-span-7 order-2 lg:order-1">
//                         <motion.div
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             className="space-y-8"
//                         >
//                             <span className="inline-block px-4 py-1 border border-[#00A651] text-[#00A651] text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
//                                 {opinion.category || "Expert Opinion"}
//                             </span>

//                             <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 leading-[1.15]">
//                                 {opinion.title}
//                             </h1>

//                             <p className="text-sm sm:text-base md:text-lg text-zinc-500 font-serif italic leading-relaxed border-l-4 border-zinc-100 pl-4 sm:pl-8">
//                                 {opinion.excerpt}
//                             </p>

//                             <div className="flex items-center gap-6 pt-6">
//                                 <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
//                                     Published {opinion.date}
//                                 </div>
//                                 <div className="h-1 w-1 bg-zinc-200 rounded-full" />
//                             </div>
//                         </motion.div>
//                     </div>

//                     <div className="lg:col-span-5 order-1 lg:order-2">
//                         <motion.div
//                             initial={{ opacity: 0, scale: 0.95 }}
//                             animate={{ opacity: 1, scale: 1 }}
//                             className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl bg-zinc-100"
//                         >
//                             <Image
//                                 src={opinion.featuredImage}
//                                 alt={opinion.title}
//                                 fill
//                                 className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
//                                 priority
//                             />
//                         </motion.div>
//                     </div>
//                 </header>

//                 {/* 3. CONTENT AREA */}
//                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
//                     {/* Floating Social Sidebar */}
//                     <aside className="hidden lg:block lg:col-span-1 sticky top-40 h-fit">
//                         <div className="flex flex-col gap-6 items-center">
//                             <Button variant="ghost" className="rounded-full w-12 h-12 hover:text-[#00A651]">
//                                 <Twitter className="w-5 h-5" />
//                             </Button>
//                             <Button variant="ghost" className="rounded-full w-12 h-12 hover:text-[#00A651]">
//                                 <Linkedin className="w-5 h-5" />
//                             </Button>
//                             <div className="w-px h-12 bg-zinc-100" />
//                         </div>
//                     </aside>

//                     {/* Main Body Text */}
//                     <div className="lg:col-span-8 lg:col-offset-1 prose prose-xl max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:font-serif prose-p:text-zinc-600 prose-p:leading-[1.8] prose-strong:text-zinc-900 prose-blockquote:border-none prose-blockquote:p-0">
//                         {opinion.content?.map((block: any, i: number) => {
//                             const text = block.children
//                                 ?.map((child: any) => child.text)
//                                 .join("") || "";

//                             if (!text.trim()) return null;

//                             switch (block.type) {
//                                 case "heading": {
//                                     const level = block.level || 2;
//                                     const headingClasses = "font-serif font-black text-zinc-900 mt-12 mb-6 leading-tight";

//                                     if (level === 1) return <h1 key={i} className={cn(headingClasses, "text-3xl md:text-5xl")}>{renderInlineChildren(block.children)}</h1>;
//                                     if (level === 2) return <h2 key={i} className={cn(headingClasses, "text-2xl md:text-4xl")}>{renderInlineChildren(block.children)}</h2>;
//                                     if (level === 3) return <h3 key={i} className={cn(headingClasses, "text-xl md:text-3xl")}>{renderInlineChildren(block.children)}</h3>;
//                                     if (level === 4) return <h4 key={i} className={cn(headingClasses, "text-lg md:text-2xl")}>{renderInlineChildren(block.children)}</h4>;
//                                     return <h5 key={i} className={cn(headingClasses, "text-lg md:text-xl")}>{renderInlineChildren(block.children)}</h5>;
//                                 }
//                                 case "list":
//                                     return block.format === "ordered" ? (
//                                         <ol key={i} className="list-decimal pl-6 my-8 space-y-3 font-serif text-lg md:text-xl text-zinc-700 leading-relaxed">
//                                             {block.children?.map((li: any, j: number) => (
//                                                 <li key={j}>
//                                                     {li.children?.map((c: any) => c.text).join("")}
//                                                 </li>
//                                             ))}
//                                         </ol>
//                                     ) : (
//                                         <ul key={i} className="list-disc pl-6 my-8 space-y-3 font-serif text-lg md:text-xl text-zinc-700 leading-relaxed">
//                                             {block.children?.map((li: any, j: number) => (
//                                                 <li key={j}>
//                                                     {li.children?.map((c: any) => c.text).join("")}
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     );
//                                 case "quote":
//                                     return (
//                                         <blockquote key={i} className="my-16 not-prose">
//                                             <div className="bg-zinc-50 p-8 md:p-12 rounded-[2rem] relative overflow-hidden">
//                                                 <Quote className="absolute -top-4 -left-4 w-20 h-20 text-zinc-200/50 z-0" />
//                                                 <p className="text-2xl md:text-3xl font-black italic text-zinc-900 tracking-tight leading-snug relative z-10">
//                                                     "{renderInlineChildren(block.children)}"
//                                                 </p>
//                                             </div>
//                                         </blockquote>
//                                     );
//                                 default:
//                                     return <p key={i} className="font-serif text-lg md:text-xl leading-relaxed text-zinc-700 mb-8">{renderInlineChildren(block.children)}</p>;
//                             }
//                         })}

//                         {/* Author Spotlight Box */}
//                         <div className="mt-16 sm:mt-24 p-6 sm:p-12 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center not-prose">
//                             <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 grayscale">
//                                 <Image src={opinion.author.image || opinion.author.avatar || "/placeholder.jpg"} alt={opinion.author.name} fill className="object-cover" />
//                             </div>
//                             <div>
//                                 <h4 className="text-xs font-black uppercase tracking-widest text-[#00A651] mb-2">About the Author</h4>
//                                 <Link href={`/author/${slugify(opinion.author.name)}`} className="block hover:opacity-80 transition-opacity">
//                                     <h5 className="text-2xl font-black uppercase tracking-tighter mb-2 hover:text-[#00A651] transition-colors">{opinion.author.name}</h5>
//                                 </Link>
//                                 <p className="text-zinc-500 font-serif italic text-sm leading-relaxed">
//                                     {opinion.author.role}. With over 15 years in energy forecasting, they provide critical analysis for institutional stakeholders and policy makers globally.
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 4. RECOMMENDED SECTION */}
//                 <footer className="mt-20 sm:mt-40 pt-12 sm:pt-20 border-t border-zinc-100">
//                     <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 sm:gap-0 mb-10 sm:mb-16">
//                         <div>
//                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00A651] mb-4 block">Continue Reading</span>
//                             <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Related <br />Perspectives.</h3>
//                         </div>
//                         <Link href="/opinion" className="bg-black text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#00A651] transition-all">
//                             View All Opinions
//                         </Link>
//                     </div>

//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 p-4 sm:p-10">
//                         {recommended.map((item) => (
//                             <Link key={item.id} href={`/opinion/${item.slug}`} className="group block">
//                                 <div className="relative aspect-3/4 mb-8 overflow-hidden rounded-2xl bg-zinc-100">
//                                     <Image
//                                         src={item.featuredImage}
//                                         alt={item.title}
//                                         fill
//                                         className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
//                                     />
//                                     <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//                                 </div>
//                                 <div className="space-y-4">
//                                     <span className="text-[10px] font-bold text-[#00A651] uppercase tracking-widest">
//                                         {item.category || "Insight"}
//                                     </span>
//                                     <h4 className="font-serif font-bold text-2xl leading-tight text-zinc-900 group-hover:text-[#00A651] transition-colors line-clamp-2">
//                                         {item.title}
//                                     </h4>
//                                     <div className="pt-4 border-t border-zinc-100">
//                                         <span role="link" tabIndex={0} onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/author/${slugify(item.author.name)}`; }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); window.location.href = `/author/${slugify(item.author.name)}`; } }} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#00A651] transition-colors cursor-pointer">{item.author.name}</span>
//                                     </div>
//                                 </div>
//                             </Link>
//                         ))}
//                     </div>
//                 </footer>
//             </article>
//         </main>
//     );
// }

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
import { cn, slugify } from "@/lib/utils";

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

export function OpinionContent({ opinion, recommended }: any) {
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
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 leading-[0.95] uppercase italic mb-8">
                                {opinion.title}
                            </h1>
                            <p className="text-xl md:text-2xl text-zinc-500 font-serif italic leading-relaxed border-l-4 border-[#00A651] pl-8">
                                {opinion.excerpt}
                            </p>

                            <div className="flex items-center gap-6 pt-10">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden grayscale">
                                        <Image src={opinion.author.avatar} alt={opinion.author.name} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900">{opinion.author.name}</p>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{opinion.author.role}</p>
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
                            <Image src={opinion.featuredImage} alt={opinion.title} fill className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" priority />
                        </motion.div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
                    {/* Sticky Actions */}
                    {/* <aside className="hidden lg:block lg:col-span-1 sticky top-32 h-fit">
                        <div className="flex flex-col gap-8 items-center border-r border-zinc-100 pr-12">
                            <button className="text-zinc-300 hover:text-[#00A651] transition-colors"><Twitter size={20} /></button>
                            <button className="text-zinc-300 hover:text-[#00A651] transition-colors"><Linkedin size={20} /></button>
                            <button className="text-zinc-300 hover:text-[#00A651] transition-colors"><Share2 size={20} /></button>
                        </div>
                    </aside> */}

                    {/* Main Article Column: STRICT 720px */}
                    <div className="lg:col-span-8 lg:col-start-3 max-w-[720px] mx-auto w-full">
                        <div className="prose prose-zinc max-w-none">
                            {opinion.content?.map((block: any, i: number) => {
                                const text = block.children?.map((c: any) => c.text).join("") || "";
                                if (!text.trim()) return null;

                                switch (block.type) {
                                    case "heading":
                                        return <h2 key={i} className="font-black uppercase italic tracking-tighter text-3xl mt-16 mb-8 text-zinc-900">{renderInlineChildren(block.children)}</h2>;

                                    case "quote":
                                        return (
                                            <blockquote key={i} className="my-16 border-none p-0 not-prose">
                                                <div className="bg-zinc-50 p-12 rounded-3xl relative overflow-hidden">
                                                    <Quote className="absolute -top-4 -left-4 w-24 h-24 text-zinc-200/40" />
                                                    <p className="text-3xl font-black italic tracking-tight text-zinc-900 leading-tight relative z-10">
                                                        "{text}"
                                                    </p>
                                                </div>
                                            </blockquote>
                                        );

                                    default:
                                        return <p key={i} className="font-serif text-[18px] leading-[1.8] text-zinc-700 mb-8 selection:bg-[#00A651]/20">{renderInlineChildren(block.children)}</p>;
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
                        {recommended.map((item: any) => (
                            <Link key={item.id} href={`/opinion/${item.slug}`} className="group space-y-6">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <Image src={item.featuredImage} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00A651]">{item.category}</span>
                                    <h5 className="text-2xl font-bold font-serif leading-tight group-hover:text-[#00A651] transition-colors line-clamp-2">{item.title}</h5>
                                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{item.author.name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </footer>
        </main>
    );
}
