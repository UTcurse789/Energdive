"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ISSUES } from "@/data/dummy";
import { Issue } from "@/types";

export default function IssuesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Logic: Filter issues (Search + Decade logic combined)
    const filteredIssues = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        return ISSUES.filter((issue) => {
            const searchStr = `${issue.month} ${issue.year} Vol ${issue.volume} No ${issue.number}`.toLowerCase();
            return searchStr.includes(query);
        }).sort((a, b) => {
            // Newest first sorting
            const yearA = parseInt(a.year || "0", 10);
            const yearB = parseInt(b.year || "0", 10);
            if (yearB !== yearA) return yearB - yearA;
            return 0;
        });
    }, [searchQuery]);

    return (
        <main className="min-h-screen bg-white text-black pt-10 pb-20 font-serif selection:bg-teal-50">
            <div className="mx-auto px-6 max-w-[1100px]">

                {/* 1. MAIN HEADER: Foreign Affairs Style */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-medium mb-8 tracking-tight">Browse the Archive</h1>

                    <div className="max-w-2xl mx-auto relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by year, topic, author..."
                            className="w-full border border-gray-300 py-2.5 px-10 text-lg font-sans focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                </div>

                {/* 2. DECADE TABS: Acts as a month/year filter */}
                <nav className="flex justify-center flex-wrap gap-x-6 gap-y-2 border-b border-gray-100 pb-6 mb-12 font-sans text-[10px] uppercase tracking-[0.2em] font-black text-gray-400">
                    <span className="text-black/30">Browse by Decade:</span>
                    {['2020s', '2010s', '2000s', '1990s', '1980s'].map(decade => (
                        <button
                            key={decade}
                            onClick={() => setSearchQuery(decade.slice(0, 3))}
                            className={`hover:text-teal-900 transition-colors ${searchQuery === decade.slice(0, 3) ? 'text-teal-900' : ''}`}
                        >
                            {decade}
                        </button>
                    ))}
                </nav>

                {/* 3. MONTH-WISE GRID: No Year Headings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-16">
                    {filteredIssues.length > 0 ? (
                        filteredIssues.map((issue: Issue) => (
                            <Link key={issue.slug} href={`/issues/${issue.slug}`} className="group block">
                                {/* Cover Image with consistent aspect ratio */}
                                <div className="relative aspect-3/4 w-full bg-gray-50 border border-gray-100 mb-6 overflow-hidden shadow-sm transition-all group-hover:shadow-md">
                                    <Image
                                        src={issue.coverImage}
                                        alt={issue.month || issue.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                </div>

                                {/* Month Heading - Tight Alignment */}
                                <div className="text-left space-y-1">
                                    <h3 className="text-xl font-bold leading-tight group-hover:underline decoration-1 underline-offset-4">
                                        {issue.month} {issue.year}
                                    </h3>
                                    <p className="font-sans text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                        Volume {issue.volume}, Number {issue.number}
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 italic text-gray-400 text-xl">
                            No issues found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}