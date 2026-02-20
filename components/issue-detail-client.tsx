"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { Issue, Section } from "@/types";

interface IssueDetailClientProps {
    issue: Issue;
}

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
    return (
        <main className="min-h-screen bg-white pb-20">
            {/* Hero Section */}
            <div className="bg-gray-50 border-b">
                <div className="mx-auto max-w-[1100px] px-6 py-12 md:py-20">
                    <div className="flex flex-col md:flex-row gap-10 md:items-center">
                        <div className="relative w-full max-w-[300px] aspect-[3/4] bg-gray-200 shadow-xl overflow-hidden self-center md:self-start">
                            <Image
                                src={issue.coverImage}
                                alt={issue.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-sm font-bold uppercase tracking-widest text-[#003B5C] mb-2">
                                Digital Edition
                            </p>
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">
                                {issue.month} {issue.year}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 uppercase tracking-widest">
                                <span>Volume {issue.volume}</span>
                                <span className="hidden md:inline">•</span>
                                <span>Number {issue.number}</span>
                            </div>
                            {issue.description && (
                                <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl">
                                    {issue.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contents Section */}
            <div className="mx-auto max-w-[1100px] px-6 pt-16">
                {issue.sections.map((section, idx) => (
                    <div key={idx} className="mb-16">
                        <h2 className="text-3xl font-bold mb-8 border-b pb-4">{section.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            {section.articles.map((article) => (
                                <article key={article.id} className="group">
                                    <Link href={article.href} className="block">
                                        {article.image && (
                                            <div className="relative aspect-video mb-4 overflow-hidden bg-gray-100">
                                                <Image
                                                    src={article.image}
                                                    alt={article.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-2">
                                            {article.contentType && (
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600">
                                                    {article.contentType}
                                                </span>
                                            )}
                                            {article.sectors.map((s, i) => (
                                                <span key={i} className="text-[10px] uppercase font-bold tracking-wider text-[#003B5C]">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-[#003B5C] transition-colors">
                                            {article.title}
                                        </h3>
                                        {article.excerpt && (
                                            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                                                {article.excerpt}
                                            </p>
                                        )}
                                        {article.author && (
                                            <p className="text-xs font-medium text-gray-500">
                                                By {article.author.name}
                                            </p>
                                        )}
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export default IssueDetailClient;
