"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
                const res = await fetch(`${STRAPI_URL}/api/issues?populate=CoverImage`);
                const json = await res.json();

                const formatted: Issue[] = json.data.map((item: any) => {
                    // 👇 CoverImage is ARRAY
                    const rawUrl = item.CoverImage?.[0]?.url;

                    const coverImage = rawUrl
                        ? rawUrl.startsWith("http")
                            ? rawUrl
                            : STRAPI_URL + rawUrl
                        : "/Energdive-Logo.png";

                    return {
                        id: item.id,
                        slug: item.slug,
                        title: item.Title,
                        month: item.Month,
                        year: item.Year?.toString(),
                        volume: item.Volume?.toString(),
                        number: item.IssueNumber?.toString(),
                        coverImage,
                    };
                });

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
                    <h1 className="text-4xl mb-8">Browse the Archive</h1>

                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by year, title..."
                        className="border px-6 py-2 w-full max-w-xl"
                    />
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