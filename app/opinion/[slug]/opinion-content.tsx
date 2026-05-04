"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    Bookmark,
    Quote,
    Clock,
    ArrowRight,
    Printer
} from "lucide-react";
import { Button } from "@/components/ui/buttons";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ShareButton } from "@/components/ui/share-button";
import { slugify } from "@/lib/utils";
import { TagBadge } from "@/components/ui/tag-badge";
import { AdBanner } from "@/components/ads/AdBanner";



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
    const sectionPath = opinion.sectionPath || "/opinion";
    const backLabel = opinion.backLabel || "Back to Opinions";
    const footerTitle = opinion.footerTitle || (
        <>
            More Opinion <br /> & Analysis.
        </>
    );
    const footerLinkLabel = opinion.footerLinkLabel || "Explore All";
    const leftAdPlacement = opinion.leftAdPlacement || "Opinion_left";
    const rightAdPlacement = opinion.rightAdPlacement || "Opinion_right";

    return (
        <div className="bg-[#FDFDFD] min-h-screen selection:bg-[#00A651]/10 antialiased">
            <ScrollProgress />

            <article className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-12">
                {/* Navigation */}
                <nav className="flex items-center justify-between mb-16 border-b border-zinc-100 pb-6">
                    <Link
                        href={sectionPath}
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#00A651] transition-all"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {backLabel}
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/print/${opinion.slug}`}
                            target="_blank"
                            className="flex items-center gap-1.5 text-zinc-500 hover:text-red-600 text-sm border border-zinc-200 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 transition-colors"
                            title="Print this article"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                        </Link>
                        <Button variant="ghost" size="sm" className="rounded-full"><Bookmark className="w-4 h-4" /></Button>
                        <ShareButton
                            title={opinion.title}
                            text={opinion.excerpt}
                            className="bg-transparent text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 p-2 rounded-full"
                        />
                    </div>
                </nav>

                {/* Hero Section */}
                <header className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-24 items-start">
                    <div className="lg:col-span-7 space-y-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <span className="inline-block px-3 py-1 border border-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] rounded mb-6">
                                {opinion.category}
                            </span>

                            {/* Main Heading: Matches Opinion Component Style */}
                            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-zinc-900 mb-8">
                                {opinion.title}
                            </h1>

                            <p className="text-xl md:text-2xl text-zinc-500 font-serif italic leading-relaxed border-l-4 border-[#00A651] pl-8">
                                {opinion.excerpt}
                            </p>

                            <div className="flex items-center gap-6 pt-10">
                                <Link href={`/author/${slugify(opinion.author?.name || "")}`} className="flex items-center gap-3 group/author hover:opacity-80 transition-opacity">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden grayscale group-hover/author:grayscale-0 transition-all">
                                        {opinion.author?.avatar && (
                                            <Image src={opinion.author.avatar} alt={opinion.author.name} fill className="object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 group-hover/author:text-[#00A651] transition-colors">{opinion.author?.name}</p>
                                    </div>
                                </Link>
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
                            className="relative aspect-4/5 overflow-hidden rounded-2xl shadow-3xl bg-zinc-100"
                        >
                            {opinion.featuredImage && (
                                <Image src={opinion.featuredImage} alt={opinion.title} fill className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" priority />
                            )}
                        </motion.div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="relative">
                    <div className="relative max-w-[720px] mx-auto w-full">
                        <div className="hidden min-[1440px]:block absolute top-0 right-[calc(100%+2rem)] w-[300px]">
                            <div className="sticky top-24 w-[300px]">
                                <AdBanner
                                    placement={leftAdPlacement}
                                    sectorSlug={opinion.sectorSlug}
                                    variant="vertical"
                                    showSkeleton={false}
                                    className="w-[300px]"
                                />
                            </div>
                        </div>

                        <div className="hidden min-[1440px]:block absolute top-0 left-[calc(100%+2rem)] w-[300px]">
                            <div className="sticky top-24 w-[300px]">
                                <AdBanner
                                    placement={rightAdPlacement}
                                    sectorSlug={opinion.sectorSlug}
                                    variant="vertical"
                                    showSkeleton={false}
                                    className="w-[300px]"
                                />
                            </div>
                        </div>

                        {/* Main Article Column: STRICT 720px */}
                        <div className="prose prose-zinc max-w-none">
                            {opinion.content?.map((block: any, i: number) => {
                                const text = block.children?.map((c: any) => c.text).join("") || "";
                                if (!text.trim()) return null;

                                switch (block.type) {
                                    case "heading":
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
                                                        &ldquo;{text}&rdquo;
                                                    </p>
                                                </div>
                                            </blockquote>
                                        );

                                    case "list":
                                        return (
                                            <ul key={i} className="list-disc pl-6 mb-8 space-y-3 font-serif text-[20px] leading-[1.85] text-zinc-700">
                                                {block.children?.map((item: any, liIdx: number) => (
                                                    <li key={liIdx}>
                                                        {renderInlineChildren(item.children)}
                                                    </li>
                                                ))}
                                            </ul>
                                        );

                                    case "image": {
                                        const imgUrl = block.image?.url
                                            ? (block.image.url.startsWith("http") ? block.image.url : `https://cms.energdive.com${block.image.url}`)
                                            : "";
                                        return (
                                            <figure key={i} className="my-16 not-prose">
                                                <div className="relative aspect-video rounded-3xl overflow-hidden bg-zinc-100">
                                                    {imgUrl && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={imgUrl}
                                                            alt={block.image?.alternativeText || ""}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    )}
                                                </div>
                                                {block.image?.caption && (
                                                    <figcaption className="mt-4 text-center text-sm text-zinc-400 font-serif italic">
                                                        {block.image.caption}
                                                    </figcaption>
                                                )}
                                            </figure>
                                        );
                                    }

                                    default:
                                        return (
                                            <p key={i} className="font-serif text-[20px] leading-[1.85] text-zinc-700 mb-8 selection:bg-[#00A651]/20">
                                                {renderInlineChildren(block.children)}
                                            </p>
                                        );
                                }
                            })}
                        </div>

                        {/* Tags */}
                        {opinion.tags?.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-zinc-100">
                                <h4 className="text-xs uppercase tracking-widest text-zinc-400 mb-4 font-bold">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {opinion.tags.map((tag: any) => (
                                        <TagBadge
                                            key={tag.slug}
                                            name={tag.name}
                                            slug={tag.slug}
                                            className="bg-zinc-50 text-zinc-700 px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full border border-zinc-200 hover:bg-[#00A651] hover:text-white hover:border-[#00A651] transition-all"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Newsletter CTA Block */}
                        {/* <div className="mt-24 p-12 rounded-3xl bg-black text-white overflow-hidden relative">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">The Strategic Edge.</h3>
                                <p className="text-zinc-400 font-serif mb-8 text-lg italic">Get exclusive executive summaries delivered weekly.</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input className="bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 flex-1 focus:outline-none focus:border-[#00A651]" placeholder="Enter your work email" />
                                    <Button className="bg-[#00A651] hover:bg-[#008c44] rounded-full px-10 py-4 font-black uppercase text-[10px] tracking-widest">Join Now</Button>
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </article>

            {/* Footer Recommended */}
            <footer className="mt-40 bg-zinc-50 py-24 border-t border-zinc-100">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex justify-between items-end mb-16">
                        <h4 className="text-5xl font-black uppercase italic tracking-tighter">{footerTitle}</h4>
                        <Link href={sectionPath} className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:text-[#00A651]">
                            {footerLinkLabel} <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {recommended?.map((item: any) => (
                            <Link key={item.id} href={`${sectionPath}/${item.slug}`} className="group space-y-6">
                                <div className="relative aspect-3/4 overflow-hidden rounded-xl grayscale group-hover:grayscale-0 transition-all duration-700">
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
        </div>
    );
}
