"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdBanner } from "@/components/ads/AdBanner";

const STRAPI_URL = "https://cms.energdive.com";

interface Issue {
    id: number;
    slug: string;
    title: string;
    subTitle: string;
    description: string;
    month: string;
    year: string;
    volume: string;
    number: string;
    coverImage: string;
    isCurrentIssue: boolean;
}

export default function IssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // ================= FETCH ISSUES =================
    useEffect(() => {
        async function fetchIssues() {
            try {
                const res = await fetch(`${STRAPI_URL}/api/issues?populate=CoverImage`, { cache: "no-store" });
                const json = await res.json();

                console.log("DEBUG: Issues Raw Data:", json);

                if (!json.data || !Array.isArray(json.data)) {
                    console.error("DEBUG: json.data is not an array", json);
                    return;
                }

                const formatted: Issue[] = json.data.map((item: any) => {
                    // Strapi v5 often returns flat data, but handle both for safety
                    const d = item.attributes || item;

                    const month = String(d.Month || d.month || "").trim();
                    const year = String(d.Year || d.year || "").trim();
                    
                    const coverImg = d.CoverImage?.[0]?.url || d.CoverImage?.url || "/Energdive-Logo.png";
                    const finalCoverImage = coverImg.startsWith("http") ? coverImg : `${STRAPI_URL}${coverImg}`;

                    return {
                        id: item.id,
                        slug: d.slug || `${month.toLowerCase()}-${year}`,
                        title: d.Title || `${month} ${year}`,
                        subTitle: String(d.sub_title || d.subTitle || ""),
                        description: String(d.Discription || d.Description || ""),
                        month,
                        year,
                        volume: String(d.Volume || ""),
                        number: String(d.IssueNumber || d.Number || ""),
                        coverImage: finalCoverImage,
                        isCurrentIssue: d.is_current_issue === true || d.is_current_issue === "true",
                    };
                });

                // Month mapping for sorting
                const monthOrder: Record<string, number> = {
                    january: 1, february: 2, fbruary: 2, march: 3, april: 4, may: 5, june: 6,
                    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
                };

                formatted.sort((a, b) => {
                    // 1. Current Always First
                    const valA = a.isCurrentIssue ? 1 : 0;
                    const valB = b.isCurrentIssue ? 1 : 0;
                    if (valA !== valB) return valB - valA;

                    // 2. Year Desc
                    const yA = parseInt(a.year, 10) || 0;
                    const yB = parseInt(b.year, 10) || 0;
                    if (yA !== yB) return yB - yA;

                    // 3. Month Desc
                    const mA = monthOrder[a.month.toLowerCase()] || 0;
                    const mB = monthOrder[b.month.toLowerCase()] || 0;
                    return mB - mA;
                });

                console.log("DEBUG: Issues Sorted List:");
                console.table(formatted.map(i => ({ Title: i.title, Current: i.isCurrentIssue, Month: i.month, Year: i.year })));
                
                setIssues(formatted);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchIssues();
    }, []);

    // ================= FILTER =================
    const filteredIssues = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return issues.filter((i) =>
            `${i.title} ${i.month} ${i.year}`.toLowerCase().includes(q)
        );
    }, [issues, searchQuery]);

    return (
        <main className="min-h-screen bg-white pt-6 sm:pt-10 pb-16 sm:pb-20">
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6">

                {/* HEADER */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl mb-5 sm:mb-8 font-black uppercase tracking-tight">Issue Archive</h1>

                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by year, title..."
                        className="border px-4 sm:px-6 py-2.5 w-full max-w-xl text-sm sm:text-base rounded-lg"
                    />
                </div>

                {/* Magazine Hero Ad Banner */}
                <div className="mb-6 sm:mb-8">
                    <AdBanner placement="magazine_hero" variant="banner" className="flex justify-center" />
                </div>

                {/* GRID */}
                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 sm:gap-x-8 md:gap-x-12 gap-y-10 sm:gap-y-14 md:gap-y-16">
                        {filteredIssues.map((issue) => (
                            <Link
                                key={issue.id}
                                href={`/issues/${issue.slug}`}
                                className="group block"
                            >
                                <div className="relative aspect-[3/4] bg-white mb-4 sm:mb-6 overflow-hidden border border-gray-100 rounded-sm">
                                    <Image
                                        src={issue.coverImage}
                                        alt={issue.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-contain"
                                    />
                                </div>

                                <h3 className="text-lg sm:text-xl font-bold">
                                    {issue.month} {issue.year}
                                </h3>

                                {issue.subTitle && (
                                    <p className="text-sm font-serif italic text-gray-600 mt-1">
                                        {issue.subTitle}
                                    </p>
                                )}

                                <p className="text-xs uppercase text-gray-400 mt-1">
                                    Volume {issue.volume}, Issue {issue.number.replace(/number/i, '').trim()}
                                </p>

                                {issue.description && (
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                        {issue.description}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
