"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdBanner } from "@/components/ads/AdBanner";

const STRAPI_URL = "http://206.189.132.187:1337";

interface Issue {
    id: number;
    slug: string;
    title: string;
    month: string;
    year: string;
    volume: string;
    number: string;
    coverImage: string;
}

export default function IssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // ================= FETCH ISSUES =================
    useEffect(() => {
        async function fetchIssues() {
            try {
                // Bust cache with timestamp
                const res = await fetch(`${STRAPI_URL}/api/issues?populate=CoverImage&t=${Date.now()}`);
                const json = await res.json();

                console.log("DEBUG: Issues Raw Data:", json);

                if (!json.data || !Array.isArray(json.data)) {
                    console.error("DEBUG: json.data is not an array", json);
                    return;
                }

                const formatted: Issue[] = json.data.map((item: any) => {
                    const dataObj = item.attributes || item;

                    // PARANOID EXTRACTION: try all possible casing and nesting
                    const month = dataObj.Month || dataObj.month || item.Month || item.month || "";
                    const year = dataObj.Year || dataObj.year || item.Year || item.year || "";
                    const slugField = dataObj.slug || dataObj.Slug || item.slug || item.Slug || "";

                    const finalSlug = (month && year)
                        ? `${String(month).toLowerCase().trim()}-${String(year).trim()}`
                        : (slugField || "undefined");

                    // CoverImage paranoid extraction
                    const coverImageData = dataObj.CoverImage?.data?.attributes ||
                        dataObj.CoverImage?.[0] ||
                        dataObj.CoverImage ||
                        item.CoverImage;

                    const rawUrl = coverImageData?.url;

                    const coverImage = rawUrl
                        ? rawUrl.startsWith("http")
                            ? rawUrl
                            : STRAPI_URL + rawUrl
                        : "/Energdive-Logo.png";

                    return {
                        id: item.id,
                        slug: finalSlug,
                        title: dataObj.Title || dataObj.title || `${month} ${year}` || "Untitled Issue",
                        month: String(month),
                        year: String(year),
                        volume: (dataObj.Volume || dataObj.volume || "")?.toString(),
                        number: (dataObj.IssueNumber || dataObj.issueNumber || dataObj.Number || "")?.toString(),
                        coverImage,
                    };
                });

                console.log("DEBUG: Formatted Issues:", formatted);
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
        <main className="min-h-screen bg-white pt-10 pb-20">
            <div className="mx-auto max-w-[1100px] px-6">

                {/* HEADER */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl mb-8 font-black uppercase tracking-tight">Issue Archive</h1>

                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by year, title..."
                        className="border px-6 py-2 w-full max-w-xl"
                    />
                </div>

                {/* Magazine Hero Ad Banner */}
                <div className="mb-8">
                    <AdBanner placement="magazine_hero" variant="banner" className="flex justify-center" />
                </div>

                {/* GRID */}
                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-16">
                        {filteredIssues.map((issue) => (
                            <Link
                                key={issue.id}
                                href={`/issues/${issue.slug}`}
                                className="group block"
                            >
                                <div className="relative aspect-[3/4] bg-gray-100 mb-6 overflow-hidden">
                                    <Image
                                        src={issue.coverImage}
                                        alt={issue.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>

                                <h3 className="text-xl font-bold">
                                    {issue.month} {issue.year}
                                </h3>

                                <p className="text-xs uppercase text-gray-400">
                                    Volume {issue.volume}, Number {issue.number}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}