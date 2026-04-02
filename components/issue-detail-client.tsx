"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Issue } from "@/types";
import { ScrollProgress } from "@/components/ui/scroll-progress";

interface IssueDetailClientProps {
    issue: Issue;
}

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
    return (
        <main className="min-h-screen bg-white text-black font-serif selection:bg-red-500/30">
            <ScrollProgress />

            <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-12 py-16 md:py-24">

                {/* 2-Column Grid Layout */}
                <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 relative">

                    {/* Left Column: Content (70%) */}
                    <div className="flex-1 lg:max-w-[700px]">

                        {/* Issue Header */}
                        <div className="mb-16">
                            <h1 className="text-4xl sm:text-5xl md:text-[54px] leading-[1.1] mb-4 text-[#1a1a1a]">
                                {issue.month} {itemYearFallback(issue.year)}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 tracking-wide font-sans">
                                Volume {issue.volume}, Issue {String(issue.Issue || "").replace(/number/i, '').trim()}
                            </p>
                            {issue.subTitle && (
                                <p className="mt-6 text-3xl md:text-4xl text-[#1a1a1a] italic leading-snug">
                                    {issue.subTitle}
                                </p>
                            )}
                        </div>

                        {/* Sections & Articles */}
                        <div className="space-y-16">
                            {issue.sections.map((section, idx) => (
                                <div key={idx}>

                                    {/* Section Title (Red, Italic, Serif) */}
                                    <h2 className="text-2xl sm:text-[28px] italic text-[#00A651] mb-6 font-serif">
                                        {section.title}
                                    </h2>

                                    {/* Divider */}
                                    <div className="border-b border-gray-200 mb-8" />

                                    {/* Articles List */}
                                    <div className="space-y-8">
                                        {section.articles.map((article, aIdx) => (
                                            <React.Fragment key={article.id}>

                                                <article className="group flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">

                                                    {/* Article Info (Left Side) - Now title goes inside link area properly linked to title & excerpt */}
                                                    <div className="flex-1 min-w-0">
                                                        <Link href={article.href ?? "#"} className="block group-hover:opacity-80 transition-opacity">
                                                            <h3 className="text-[22px] sm:text-[26px] leading-[1.25] text-[#1a1a1a] mb-2 font-serif">
                                                                {article.title}
                                                            </h3>
                                                            {article.excerpt && (
                                                                <p className="text-gray-600 text-sm sm:text-[15px] font-sans mb-3 line-clamp-2 leading-relaxed">
                                                                    {article.excerpt}
                                                                </p>
                                                            )}
                                                        </Link>
                                                        {article.author && (
                                                            <p className="text-[#1a1a1a] text-[15px] font-serif mt-3">
                                                                {article.author.name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Article Thumbnail (Right Side) */}
                                                    {article.image && (
                                                        <Link href={article.href ?? "#"} className="flex-shrink-0 block w-[140px] sm:w-[160px] md:w-[200px] overflow-hidden">
                                                            <div className="relative w-full aspect-[16/10]">
                                                                <Image
                                                                    src={article.image}
                                                                    alt={article.title}
                                                                    fill
                                                                    sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 200px"
                                                                    className="object-contain transition-transform duration-700 group-hover:scale-105"
                                                                />
                                                            </div>
                                                        </Link>
                                                    )}
                                                </article>

                                                {/* Article Divider */}
                                                {aIdx < section.articles.length - 1 && (
                                                    <div className="border-b border-gray-100 my-8" />
                                                )}

                                            </React.Fragment>
                                        ))}
                                    </div>

                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Right Column: Sticky Cover (30%) */}
                    <div className="hidden lg:block w-[320px] xl:w-[380px] flex-shrink-0">
                        <div className="sticky top-[100px]">

                            {/* Magazine Cover */}
                            <div className="relative w-full aspect-[3/4] shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white flex items-center justify-center mb-8 border border-gray-200 p-2">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={issue.coverImage}
                                        alt={`${issue.month} ${issue.year} Cover`}
                                        fill
                                        sizes="(max-width: 1280px) 320px, 380px"
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Optional Links Below Cover (Like "Browse the Full Archive") */}
                            <div className="text-gray-600 font-serif text-[17px] space-y-6 px-1">
                                <Link href="/issues" className="hover:text-black transition-colors flex items-center gap-2">
                                    Browse the Full Archive <span className="font-sans">→</span>
                                </Link>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </main>
    );
}

// Small helper since Foreign Affairs format shows "March/April 2026", 
// but we just have single month and year. We'll format what we have.
function itemYearFallback(year: string): string {
    return year;
}

export default IssueDetailClient;
