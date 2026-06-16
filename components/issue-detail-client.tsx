"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Issue } from "@/types";
import { ScrollProgress } from "@/components/ui/scroll-progress";

interface IssueDetailClientProps {
    issue: Issue;
}

const PORTRAIT_SECTION_TITLES = new Set(["Editorial", "Interview", "Opinion"]);

function IssueArticleThumbnail({
    href,
    image,
    title,
    preferPortrait = false,
}: {
    href?: string;
    image: string;
    title: string;
    preferPortrait?: boolean;
}) {
    const [isPortrait, setIsPortrait] = React.useState(preferPortrait);

    const wrapperClassName = isPortrait
        ? "block w-full max-w-[190px] self-start sm:w-[120px] md:w-[140px] sm:max-w-none"
        : "block w-full max-w-[240px] self-start sm:w-[190px] md:w-[210px] sm:max-w-none";

    const frameClassName = isPortrait
        ? "relative w-full aspect-[4/5] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        : "relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm";

    const imageClassName = isPortrait
        ? "object-cover object-top transition-transform duration-700 group-hover:scale-105"
        : "object-cover transition-transform duration-700 group-hover:scale-105";

    const sizes = isPortrait
        ? "(max-width: 640px) 190px, (max-width: 768px) 120px, 140px"
        : "(max-width: 640px) 240px, (max-width: 768px) 190px, 210px";

    return (
        <Link
            href={href ?? "#"}
            className={wrapperClassName}
        >
            <div className={frameClassName}>
                <Image
                    src={image}
                    alt={title}
                    fill
                    sizes={sizes}
                    className={imageClassName}
                    onLoad={(event) => {
                        const { naturalWidth, naturalHeight } = event.currentTarget;
                        setIsPortrait(naturalHeight > naturalWidth);
                    }}
                />
            </div>
        </Link>
    );
}

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
    return (
        <main className="min-h-screen bg-white text-black font-serif selection:bg-red-500/30">
            <ScrollProgress />

            <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-12 py-8 md:py-12">

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
                        <div className="space-y-12">
                            {issue.sections.map((section, idx) => {
                                const sectionPrefersPortrait = PORTRAIT_SECTION_TITLES.has(section.title);

                                return (
                                    <div key={idx}>
                                        {/* Section Title (Red, Italic, Serif) */}
                                        <h2 className="text-xl sm:text-[24px] italic text-[#00A651] mb-5 font-serif">
                                            {section.title}
                                        </h2>

                                        {/* Divider */}
                                        <div className="border-b border-gray-200 mb-6" />

                                        {/* Articles List */}
                                        <div className="space-y-6">
                                            {section.articles.map((article, aIdx) => (
                                                <React.Fragment key={article.id}>

                                                    <article className="group grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-7">

                                                        {/* Article Info (Left Side) - Now title goes inside link area properly linked to title & excerpt */}
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={article.href ?? "#"} className="block group-hover:opacity-80 transition-opacity">
                                                                <h3 className="text-[20px] sm:text-[23px] leading-[1.22] text-[#1a1a1a] mb-2 font-serif">
                                                                    {article.title}
                                                                </h3>
                                                                {article.excerpt && (
                                                                    <p className="text-gray-600 text-sm font-sans mb-3 line-clamp-2 leading-relaxed">
                                                                        {article.excerpt}
                                                                    </p>
                                                                )}
                                                            </Link>
                                                            {article.author && (
                                                                <p className="text-[#1a1a1a] text-sm font-serif mt-3">
                                                                    {article.author.name}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Article Thumbnail (Right Side) */}
                                                        {article.image && (
                                                            <IssueArticleThumbnail
                                                                href={article.href}
                                                                image={article.image}
                                                                title={article.title}
                                                                preferPortrait={sectionPrefersPortrait}
                                                            />
                                                        )}
                                                    </article>

                                                    {/* Article Divider */}
                                                    {aIdx < section.articles.length - 1 && (
                                                        <div className="border-b border-gray-100 my-6" />
                                                    )}

                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>

                    {/* Right Column: Sticky Cover (30%) */}
                    <div className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0">
                        <div className="sticky top-[120px] pb-10">

                            {/* Magazine Cover */}
                            <div className="relative w-full aspect-[3/4] shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white flex items-center justify-center mb-8 border border-gray-200 p-2">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={issue.coverImage}
                                        alt={`${issue.month} ${issue.year} Cover`}
                                        fill
                                        sizes="(max-width: 1280px) 280px, 320px"
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>

                            {/* Browse the Full Archive */}
                            <div className="text-gray-600 font-serif text-[17px] mb-6 px-1">
                                <Link href="/issues" className="hover:text-black transition-colors flex items-center gap-2">
                                    Browse the Full Archive <span className="font-sans">→</span>
                                </Link>
                            </div>

                            {issue.pdfUrl && (
                                <div className="border-t border-gray-200 pt-4 mb-5 px-1 font-serif text-[16px] text-gray-600">
                                    <span>Download:</span>
                                    <a
                                        href={`/issues/${issue.slug}/download`}
                                        className="ml-2 underline underline-offset-4 transition-colors hover:text-black"
                                    >
                                        PDF
                                    </a>
                                </div>
                            )}

                            {/* CTA Buttons */}
                            <div className="flex flex-col gap-2.5">
                                <Link
                                    href="/subscribe"
                                    className="block w-full rounded-md bg-[#00A651] px-4 py-2.5 text-center font-sans text-[13px] font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-[#008c44]"
                                >
                                    Subscribe ENERGDIVE Magazine
                                </Link>
                                <a
                                    href="https://www.energdive.com/advertise-with-us"
                                    target="_blank"
                                    rel="noopener"
                                    className="block w-full rounded-md border border-[#00A651] px-4 py-2.5 text-center font-sans text-[13px] font-semibold tracking-wide text-[#00A651] transition-colors duration-200 hover:bg-[#00A651] hover:text-white"
                                >
                                    Advertisement Enquiry
                                </a>
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
