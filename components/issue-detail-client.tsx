"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Issue } from "@/types";
import { slugify } from "@/lib/utils";

export function IssueDetailClient({ issue }: { issue: Issue }) {
    // Deep Brand Green for subtle anchors
    const BRAND_GREEN = "text-teal-900";

    return (
        <main className="min-h-screen bg-white text-black pt-8 pb-24 font-serif selection:bg-teal-50">
            {/* 1. HARD-LOCKED CONTAINER: Matches FA's precise width */}
            <div className="mx-auto px-6 max-w-[1100px]">

                {/* 2. HEADER: Anchored Top Bar */}
                <header className="mb-10 border-t-[3px] border-black pt-4">
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">
                            {issue.month} <span className="font-light text-gray-300">/</span> {issue.year}
                        </h1>
                        <div className="font-sans text-[10px] uppercase tracking-[0.25em] font-black text-gray-900">
                            Vol. {issue.volume}, No. {issue.number}
                        </div>
                    </div>
                </header>

                {/* 3. ALIGNED GRID: 60/40 Split */}
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-x-16 items-start">

                    {/* LEFT SIDE: Content List */}
                    <div className="space-y-12">
                        {issue.sections?.map((section) => (
                            <section key={section.title}>
                                <div className="border-b border-gray-100 mb-5">
                                    <h3 className={`${BRAND_GREEN} italic text-lg font-medium pb-1.5`}>
                                        {section.title}
                                    </h3>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {section.articles?.map((article) => (
                                        <article key={article.id} className="py-6 first:pt-0 group cursor-pointer">
                                            <div className="flex justify-between items-start gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/news/${article.slug}`} className="block">
                                                        <h4 className="text-xl md:text-[22px] font-bold leading-[1.1] mb-1 group-hover:underline decoration-1 underline-offset-2">
                                                            {article.title}
                                                        </h4>
                                                        <p className="text-gray-600 italic text-[15px] leading-snug line-clamp-2">
                                                            {article.excerpt}
                                                        </p>
                                                    </Link>
                                                    <div className="font-sans text-[9px] uppercase tracking-widest font-bold text-gray-400 mt-2">
                                                        {article.author?.name && (
                                                            <Link href={`/author/${slugify(article.author.name)}`} className="hover:text-[#09B697] transition-colors">
                                                                {article.author.name}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>

                                                {article.image && (
                                                    <div className="w-[120px] h-[80px] relative overflow-hidden shrink-0 border border-gray-50 bg-gray-50 grayscale-[0.2]">
                                                        <Image src={article.image} alt="" fill className="object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* RIGHT SIDE: Sidebar (Fixed alignment issue) */}
                    <aside className="border-l border-gray-100 pl-10 h-full">
                        <div className="sticky top-10 flex flex-col items-start">

                            {/* Cover Art - Slightly larger for balance */}
                            <div className="w-full max-w-[300px] mb-8">
                                <div className="relative aspect-3/4 w-full shadow-lg border border-gray-100 group overflow-hidden">
                                    <Image
                                        src={issue.coverImage}
                                        alt="Issue Cover"
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Action Links - Aligned Left within the 40% column */}
                            <div className="w-full max-w-[300px] space-y-6">
                                <Link href="/issues" className="flex items-center justify-between font-sans text-[10px] uppercase tracking-[0.25em] font-black border-y border-gray-100 py-4 hover:text-teal-900 transition-colors group">
                                    Browse Full Archive
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>

                        </div>
                    </aside>

                </div>
            </div>
        </main>
    );
}