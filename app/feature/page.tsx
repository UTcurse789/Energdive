"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Plus, MoveRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { DateChip } from "@/components/ui/date-chip";
import { formatContentDate } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export default function FeaturePage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(30);

    useEffect(() => {
        async function fetchData() {
            try {
                const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=Feature&populate=*&pagination[pageSize]=100&sort[0]=publishedAt:desc&sort[1]=Date:desc&sort[2]=createdAt:desc`;
                const res = await fetch(url);
                const json = await res.json();

                if (json.data) {
                    const formattedData = json.data.map((item: any) => {
                        const attrs = item.attributes || item;
                        let excerptText = "Feature story from ENERGDIVE.";
                        if (attrs.Excerpt && Array.isArray(attrs.Excerpt)) {
                            const paragraph = attrs.Excerpt.find((block: any) => block.type === "paragraph");
                            if (paragraph?.children?.[0]?.text) {
                                excerptText = paragraph.children[0].text;
                            }
                        }
                        return {
                            id: item.id,
                            title: attrs.TITLE || attrs.Title || "Untitled",
                            slug: attrs.slug,
                            image: attrs.FeaturedImage?.url
                                ? strapiImageUrl(attrs.FeaturedImage.url)
                                : "/placeholder.jpg",
                            excerpt: excerptText,
                            sector: attrs.sectors?.[0]?.name || attrs.sectors?.data?.[0]?.attributes?.name || "Energy",
                            date: formatContentDate(attrs.publishedAt || attrs.Date || attrs.createdAt),
                        };
                    });
                    setArticles(formattedData);
                }
            } catch (error) {
                console.error("Error fetching features:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return (
        <main className="min-h-screen bg-white py-16">
            <div className="container mx-auto px-4 max-w-[1400px]">
                <div className="flex justify-between items-end mb-12 border-b pb-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-5 w-32" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(9)].map((_, i) => (<div key={i} className="space-y-4"><Skeleton className="aspect-video w-full rounded-2xl" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /></div></div>))}
                </div>
            </div>
        </main>
    );
    if (articles.length === 0) return (<div className="min-h-screen bg-white"><Header /><div className="flex items-center justify-center pt-32 text-gray-500">No features found.</div></div>);

    const heroArticle = articles[0];
    const topInsights = articles.slice(1, 5);
    const allItems = articles.slice(5);
    const visibleItems = allItems.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] selection:bg-black selection:text-white font-sans overflow-x-hidden">
            <Header />
            <main className="pt-[10px]">
                <section className="w-full py-12 md:py-20 bg-white border-b border-black">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-12">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
                                <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-[8vw] font-black tracking-tighter leading-[0.85] uppercase italic">
                                    <span className="text-[#00A651]">Fea</span>tures
                                </h1>
                            </motion.div>
                            <div className="lg:w-1/3 border-l-2 border-black pl-6 py-2">
                                <p className="text-sm md:text-base font-bold tracking-widest text-gray-500 leading-relaxed italic">
                                    Long-form feature stories that explore the stories, trends, and innovations transforming the global energy landscape.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="border-b border-gray-200 py-4 overflow-hidden sticky top-[80px] z-40 backdrop-blur-md bg-white/90 hidden sm:block">
                    <div className="container mx-auto px-6 lg:px-12 flex items-center">
                        <div className="flex gap-16 items-center animate-marquee whitespace-nowrap text-[11px] font-bold text-gray-400 uppercase">
                            {articles.slice(0, 10).map((a, i) => (
                                <Link key={i} href={`/feature/${a.slug}`} className="hover:text-black flex items-center gap-3 transition-colors">
                                    <Plus size={10} className="text-[#00A651]" /> {a.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10 mb-24">
                        <div className="lg:col-span-8 group">
                            <Link href={`/feature/${heroArticle.slug}`} className="block">
                                <div className="relative aspect-video overflow-hidden bg-gray-100 mb-6 border border-gray-100 shadow-xl">
                                    <Image src={heroArticle.image} alt={heroArticle.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    <div className="absolute top-0 right-0 bg-[#00A651] text-white p-4 md:p-6 z-10"><ArrowUpRight size={28} /></div>
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6 md:p-10">
                                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9]">{heroArticle.title}</h2>
                                    </div>
                                </div>
                                <p className="text-lg md:text-xl text-gray-500 font-serif italic leading-relaxed line-clamp-3">{heroArticle.excerpt}</p>
                            </Link>
                        </div>
                        <div className="lg:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 pt-10 lg:pt-0 lg:pl-10">
                            <h3 className="text-sm md:text-base font-black uppercase tracking-[4px] mb-10 border-b-2 border-black pb-4">Recent Features</h3>
                            <div className="space-y-8">
                                {topInsights.map((item, idx) => (
                                    <Link href={`/feature/${item.slug}`} key={idx} className="flex gap-5 group items-start">
                                        <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                                            <Image src={item.image} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-[#00A651] uppercase tracking-widest mb-1">{item.sector}</span>
                                            <DateChip value={item.date} className="mb-1 text-[10px]" />
                                            <h4 className="font-bold text-base leading-tight group-hover:text-[#00A651] transition-colors line-clamp-3">{item.title}</h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {visibleItems.length > 0 && (
                        <section className="mb-32">
                            <div className="flex items-center gap-4 mb-12">
                                <h2 className="text-4xl font-black uppercase italic">Feature <span className="text-[#00A651] not-italic">Archive</span></h2>
                                <div className="flex-1 h-[1px] bg-gray-200"></div>
                                <span className="text-xs font-black text-gray-400 uppercase">{articles.length} Total</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                                {visibleItems.map((item, idx) => (
                                    <div key={idx} className="group flex flex-col border-t border-gray-100 pt-6 hover:border-black transition-all duration-500">
                                        <div className="relative aspect-4/3 mb-6 overflow-hidden bg-gray-100 border border-gray-100">
                                            <Image src={item.image} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-3"><span>{item.sector}</span><DateChip value={item.date} className="text-[9px]" /></div>
                                            <h4 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-[#00A651] transition-colors mb-4">{item.title}</h4>
                                            <Link href={`/feature/${item.slug}`} className="mt-auto inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all text-black">
                                                Read More <MoveRight size={14} className="text-[#00A651]" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {visibleCount < allItems.length && (
                                <div className="mt-12 flex justify-center">
                                    <button type="button" onClick={() => setVisibleCount((prev) => prev + 30)} className="inline-flex items-center gap-2 border border-black px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white">Load More</button>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
            <style jsx global>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 40s linear infinite; }`}</style>
        </div>
    );
}
