"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Issue } from "@/types";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { BookOpen, Download } from "lucide-react";

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

function IssueActionButtons({ slug, hasPdf }: { slug: string; hasPdf: boolean }) {
    const { isSignedIn, isLoaded } = useUser();
    const { openAuthModal } = useAuthModal();
    const isLoggedIn = isLoaded && isSignedIn === true;

    return (
        <div className="border-t border-gray-200 pt-5 mb-6 px-1">
            <div className="flex flex-col gap-2.5">
                {/* 1. View ePDF (Public, no login required) */}
                <Link
                    href={`/issues/${slug}/epdf`}
                    className="flex items-center justify-center gap-2 w-full rounded-md bg-[#00A651] px-4 py-2.5 text-center font-sans text-[14px] font-semibold tracking-wide text-white transition-colors duration-200 hover:bg-[#008c44] shadow-xs"
                >
                    <BookOpen className="w-4 h-4" />
                    <span>View ePDF</span>
                </Link>

                {/* 2. Download PDF (Requires authentication) */}
                {hasPdf && (
                    <div className="text-center">
                        {isLoggedIn ? (
                            <a
                                href={`/issues/${slug}/download`}
                                className="flex items-center justify-center gap-2 w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-center font-sans text-[13px] font-medium tracking-wide text-neutral-700 transition-colors duration-200 hover:border-neutral-900 hover:text-black"
                            >
                                <Download className="w-4 h-4 text-neutral-500" />
                                <span>Download PDF</span>
                            </a>
                        ) : (
                            <button
                                onClick={() => openAuthModal(`/issues/${slug}?download=true`)}
                                className="flex items-center justify-center gap-2 w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-center font-sans text-[13px] font-medium tracking-wide text-neutral-700 transition-colors duration-200 hover:border-neutral-900 hover:text-black cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-neutral-500" />
                                <span>Download PDF</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Detects ?download=true in the URL and auto-triggers the PDF download
 * once the user is authenticated and onboarding is completed.
 */
function AutoDownloadTrigger({ slug }: { slug: string }) {
    const searchParams = useSearchParams();
    const { user, isSignedIn, isLoaded } = useUser();
    const { openAuthModal } = useAuthModal();
    const hasTriggered = React.useRef(false);
    const downloadRequested = searchParams.get("download") === "true";
    const clerkOnboardingCompleted = user?.publicMetadata?.onboarding_completed === true;

    React.useEffect(() => {
        if (!isLoaded || hasTriggered.current || !downloadRequested) return;

        const startDownload = () => {
            if (hasTriggered.current) return;
            hasTriggered.current = true;
            // Clean the URL to prevent re-triggering on refresh.
            window.history.replaceState({}, "", `/issues/${slug}`);
            window.location.href = `/issues/${slug}/download`;
        };

        if (isSignedIn) {
            if (clerkOnboardingCompleted) {
                startDownload();
                return;
            }

            let cancelled = false;

            (async () => {
                try {
                    const res = await fetch("/api/onboarding/status", { cache: "no-store" });
                    if (!res.ok) {
                        console.warn("[AutoDownloadTrigger] Onboarding status check failed:", res.status);
                        return;
                    }

                    const data = await res.json();
                    if (!cancelled && data.signedIn && data.onboardingCompleted) {
                        startDownload();
                    } else {
                        console.log("[AutoDownloadTrigger] User is signed in but onboarding is not completed yet. Waiting...");
                    }
                } catch (error) {
                    console.warn("[AutoDownloadTrigger] Onboarding status check failed:", error);
                }
            })();

            return () => {
                cancelled = true;
            };
        }

        hasTriggered.current = true;
        openAuthModal(`/issues/${slug}?download=true`);
    }, [clerkOnboardingCompleted, downloadRequested, isLoaded, isSignedIn, slug, openAuthModal]);

    return null;
}

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
    const hasPdf = Boolean(issue.pdfUrl);

    return (
        <main className="min-h-screen bg-white text-black font-serif selection:bg-red-500/30">
            <AutoDownloadTrigger slug={issue.slug} />
            <ScrollProgress />

            <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-12 py-8 md:py-12">

                {/* 2-Column Grid Layout */}
                <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 relative">

                    {/* Left Column: Content (70%) */}
                    <div className="flex-1 lg:max-w-[700px]">

                        {/* Issue Header */}
                        <div className="mb-10 sm:mb-16">
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

                            {/* Mobile action bar for quick reading access */}
                            <div className="mt-6 lg:hidden flex flex-wrap items-center gap-3">
                                <Link
                                    href={`/issues/${issue.slug}/epdf`}
                                    className="inline-flex items-center gap-2 rounded-md bg-[#00A651] px-5 py-2.5 text-center font-sans text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#008c44] shadow-xs"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    <span>View ePDF</span>
                                </Link>

                                {hasPdf && (
                                    <PdfDownloadMobileButton slug={issue.slug} />
                                )}
                            </div>
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

                                                        {/* Article Info (Left Side) */}
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
                            <div className="relative w-full aspect-[3/4] shadow-[0_10px_30px_rgba(0,0,0,0.15)] bg-white flex items-center justify-center mb-6 border border-gray-200 p-2 group">
                                <Link href={`/issues/${issue.slug}/epdf`} className="relative w-full h-full block" title="Read digital ePDF edition">
                                    <Image
                                        src={issue.coverImage}
                                        alt={`${issue.month} ${issue.year} Cover`}
                                        fill
                                        sizes="(max-width: 1280px) 280px, 320px"
                                        className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xs">
                                        <span className="bg-white text-neutral-900 font-sans text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5 text-[#00A651]" />
                                            Read ePDF
                                        </span>
                                    </div>
                                </Link>
                            </div>

                            {/* Browse the Full Archive */}
                            <div className="text-gray-600 font-serif text-[16px] mb-4 px-1">
                                <Link href="/issues" className="hover:text-black transition-colors flex items-center gap-2">
                                    Browse the Full Archive <span className="font-sans">→</span>
                                </Link>
                            </div>

                            {/* Actions: View ePDF & Download PDF */}
                            <IssueActionButtons slug={issue.slug} hasPdf={hasPdf} />

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

function PdfDownloadMobileButton({ slug }: { slug: string }) {
    const { isSignedIn, isLoaded } = useUser();
    const { openAuthModal } = useAuthModal();
    const isLoggedIn = isLoaded && isSignedIn === true;

    if (isLoggedIn) {
        return (
            <a
                href={`/issues/${slug}/download`}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-center font-sans text-[14px] font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-black"
            >
                <Download className="w-4 h-4 text-neutral-500" />
                <span>Download PDF</span>
            </a>
        );
    }

    return (
        <button
            onClick={() => openAuthModal(`/issues/${slug}?download=true`)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-center font-sans text-[14px] font-medium text-neutral-700 transition-colors hover:border-neutral-900 hover:text-black cursor-pointer"
        >
            <Download className="w-4 h-4 text-neutral-500" />
            <span>Download PDF</span>
        </button>
    );
}

function itemYearFallback(year: string): string {
    return year;
}

export default IssueDetailClient;
