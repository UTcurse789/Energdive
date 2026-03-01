"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Issue } from "@/types";
import { slugify } from "@/lib/utils";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ShareButton } from "@/components/ui/share-button";

interface IssueDetailClientProps {
    issue: Issue;
}

/* ── Color-coded badge config per content type ── */
const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    opinion: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    editorial: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    news: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    reports: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    report: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    analysis: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    feature: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const DEFAULT_BADGE = { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };

function getTypeBadgeColors(contentType: string | null | undefined) {
    if (!contentType) return DEFAULT_BADGE;
    return CONTENT_TYPE_COLORS[contentType.toLowerCase()] ?? DEFAULT_BADGE;
}

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
    return (
        <main className="min-h-screen bg-white pb-20">
            <ScrollProgress />
            {/* Hero Section */}
            <div className="bg-gray-50 border-b">
                <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-10 md:py-20">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-10 md:items-center">
                        <div className="relative w-full max-w-[240px] sm:max-w-[300px] aspect-[3/4] bg-gray-200 shadow-xl overflow-hidden self-center md:self-start">
                            <Image
                                src={issue.coverImage}
                                alt={issue.title}
                                fill
                                className="object-fill"
                                priority
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#003B5C] mb-2">
                                Digital Edition
                            </p>
                            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2">
                                {issue.month} {issue.year}
                            </h2>
                            {issue.subTitle && (
                                <p className="text-base sm:text-lg md:text-xl font-serif italic text-gray-600 mb-4">
                                    {issue.subTitle}
                                </p>
                            )}
                            {/* <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4">
                                {issue.title}
                            </h1> */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 uppercase tracking-widest">
                                <span>Volume {issue.volume}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>Number {issue.Issue}</span>
                            </div>
                            {issue.description && (
                                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
                                    {issue.description}
                                </p>
                            )}
                            <div className="mt-6 flex justify-center md:justify-start">
                                <ShareButton
                                    title={`${issue.month} ${issue.year} Issue`}
                                    text={issue.description}
                                    className="text-gray-500 hover:text-teal-600 font-medium text-sm border border-gray-200 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contents Section */}
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6 pt-12 md:pt-16">
                {issue.sections.map((section, idx) => (
                    <div key={idx} className="mb-12 md:mb-16">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 border-b pb-4">{section.title}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-10 sm:gap-y-12">
                            {section.articles.map((article) => {
                                const badge = getTypeBadgeColors(article.contentType);

                                return (
                                    <article key={article.id} className="group">
                                        <Link href={article.href ?? "#"} className="block">
                                            {/* Image */}
                                            {article.image && (
                                                <div className="relative aspect-[16/10] mb-4 overflow-hidden bg-gray-100 rounded-lg">
                                                    <Image
                                                        src={article.image}
                                                        alt={article.title}
                                                        fill
                                                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>
                                            )}

                                            {/* Content Type Badge + Sector Tags */}
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {article.contentType && (
                                                    <span className={`inline-flex items-center text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                                        {article.contentType}
                                                    </span>
                                                )}
                                                {!article.contentType && (
                                                    <span className="inline-flex items-center text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                                                        Article
                                                    </span>
                                                )}
                                                {(article.sectors ?? []).slice(0, 2).map((s, i) => (
                                                    <span key={i} className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-[#003B5C] bg-[#003B5C]/5 px-2 py-0.5 rounded">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-[#003B5C] transition-colors leading-snug">
                                                {article.title}
                                            </h3>

                                            {/* Excerpt */}
                                            {article.excerpt && (
                                                <p className="text-gray-600 text-xs sm:text-sm line-clamp-3 mb-3 leading-relaxed">
                                                    {article.excerpt}
                                                </p>
                                            )}

                                            {/* Author */}
                                            {article.author && (
                                                <p className="text-[12px] sm:text-xs font-bold text-gray-500">
                                                    {article.author.name}
                                                </p>
                                            )}
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export default IssueDetailClient;
