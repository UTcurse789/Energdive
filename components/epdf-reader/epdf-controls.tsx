"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/hooks/use-auth-modal";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Download,
    Fullscreen,
    Minimize,
    ZoomIn,
    ZoomOut,
    Layers,
    BookOpen,
    FileText,
    HelpCircle,
} from "lucide-react";

interface EpdfTopBarProps {
    issueSlug: string;
    issueTitle: string;
    issueVolume?: string | number;
    issueNumber?: string | number;
    issueDate?: string;
    isSpread: boolean;
    onToggleSpread: () => void;
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onToggleThumbnails: () => void;
    isThumbnailsOpen: boolean;
    onOpenShortcuts: () => void;
    hasPdf: boolean;
}

export function EpdfTopBar({
    issueSlug,
    issueTitle,
    issueVolume,
    issueNumber,
    issueDate,
    isSpread,
    onToggleSpread,
    scale,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    isFullscreen,
    onToggleFullscreen,
    onToggleThumbnails,
    isThumbnailsOpen,
    onOpenShortcuts,
    hasPdf,
}: EpdfTopBarProps) {
    const { isSignedIn, isLoaded } = useUser();
    const { openAuthModal } = useAuthModal();
    const isLoggedIn = isLoaded && isSignedIn === true;

    const handleDownloadClick = (e: React.MouseEvent) => {
        if (!isLoggedIn) {
            e.preventDefault();
            openAuthModal(`/issues/${issueSlug}?download=true`);
        }
    };

    return (
        <header className="w-full bg-[#FFFFFF] border-b border-gray-200 text-gray-900 sticky top-0 z-40 select-none shadow-xs font-sans px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            {/* Left: Back Link & Document Metadata */}
            <div className="flex items-center gap-3 min-w-0">
                <Link
                    href={`/issues/${issueSlug}`}
                    className="flex items-center gap-1.5 font-medium text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all px-2.5 py-1.5 rounded-lg shrink-0 border border-gray-200 bg-white"
                    title="Return to Issue Overview"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
                    <span className="hidden sm:inline">Back to Issue</span>
                </Link>

                <div className="h-4 w-[1px] bg-gray-300 hidden sm:block shrink-0" />

                {/* Document Metadata */}
                <div className="min-w-0 flex items-center gap-2 truncate">
                    <span className="font-serif font-bold text-gray-900 text-xs sm:text-sm tracking-tight truncate">
                        {issueTitle.toLowerCase().includes("energdive") ? issueTitle : `ENERGDIVE — ${issueTitle}`}
                    </span>
                    {(issueVolume || issueNumber) && (
                        <span className="hidden md:inline text-[11px] text-gray-500 font-sans truncate">
                            {[
                                issueVolume ? `Vol. ${issueVolume}` : null,
                                issueNumber ? `Issue ${String(issueNumber).replace(/number/i, '').trim()}` : null,
                            ].filter(Boolean).join(" • ")}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#059669]/10 text-[#059669] border border-[#059669]/20 shrink-0">
                        ePDF Reader
                    </span>
                </div>
            </div>

            {/* Right: Viewer Controls (Spread, Thumbnails, Zoom, Fullscreen, Download) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Thumbnails Drawer Toggle */}
                <button
                    onClick={onToggleThumbnails}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isThumbnailsOpen
                            ? "bg-[#059669]/10 text-[#059669] border-[#059669]/30"
                            : "text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border-gray-200"
                    }`}
                    title="Toggle Page Drawer (T)"
                    aria-label="Toggle Page Thumbnails"
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Pages</span>
                </button>

                {/* Spread Mode Toggle (Desktop) */}
                <button
                    onClick={onToggleSpread}
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-all cursor-pointer border border-gray-200"
                    title={isSpread ? "Switch to 1-Page Mode (S)" : "Switch to 2-Page Spread (S)"}
                    aria-label="Toggle Spread Layout"
                >
                    {isSpread ? (
                        <>
                            <BookOpen className="w-3.5 h-3.5 text-[#059669]" />
                            <span>2-Page Spread</span>
                        </>
                    ) : (
                        <>
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            <span>1-Page View</span>
                        </>
                    )}
                </button>

                <div className="h-4 w-[1px] bg-gray-300 hidden sm:block" />

                {/* Zoom Stepper */}
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                        onClick={onZoomOut}
                        disabled={scale <= 0.6}
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        title="Zoom Out (-)"
                        aria-label="Zoom Out"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onResetZoom}
                        className="px-2 py-0.5 text-[11px] font-sans font-mono font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        title="Fit / Reset Zoom (0)"
                        aria-label="Reset Zoom"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button
                        onClick={onZoomIn}
                        disabled={scale >= 2.5}
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        title="Zoom In (+)"
                        aria-label="Zoom In"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Fullscreen Toggle */}
                <button
                    onClick={onToggleFullscreen}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-sans font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 transition-all flex items-center gap-1.5 cursor-pointer border border-gray-200"
                    title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                    aria-label="Toggle Fullscreen"
                >
                    {isFullscreen ? (
                        <Minimize className="w-3.5 h-3.5" />
                    ) : (
                        <Fullscreen className="w-3.5 h-3.5" />
                    )}
                </button>

                {/* Shortcuts Info */}
                <button
                    onClick={onOpenShortcuts}
                    className="hidden sm:flex p-1.5 rounded-lg text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 transition-all items-center justify-center cursor-pointer border border-gray-200"
                    title="Keyboard Shortcuts (?)"
                    aria-label="Keyboard Shortcuts"
                >
                    <HelpCircle className="w-3.5 h-3.5" />
                </button>

                {/* Download PDF Action */}
                {hasPdf && (
                    <a
                        href={isLoggedIn ? `/issues/${issueSlug}/download` : "#"}
                        onClick={handleDownloadClick}
                        className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all shadow-xs hover:shadow-[#059669]/20 cursor-pointer ml-1"
                        title={isLoggedIn ? "Download PDF Edition" : "Sign in to Download PDF"}
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download PDF</span>
                    </a>
                )}
            </div>
        </header>
    );
}

// Export alias for backward compatibility
export const EpdfDualTierHeader = EpdfTopBar;

interface EpdfBottomBarProps {
    currentPage: number;
    totalPages: number;
    isSpread: boolean;
    onPrev: () => void;
    onNext: () => void;
    onGoToPage: (page: number) => void;
}

export function EpdfBottomBar({
    currentPage,
    totalPages,
    isSpread,
    onPrev,
    onNext,
    onGoToPage,
}: EpdfBottomBarProps) {
    const [inputVal, setInputVal] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [scrubValue, setScrubValue] = useState<number | null>(null);

    const hasPrev = currentPage > 1;
    const hasNext = isSpread
        ? currentPage === 1
            ? totalPages > 1
            : currentPage + 2 <= totalPages || (currentPage + 1 <= totalPages && (currentPage + 1) % 2 === 0)
        : currentPage < totalPages;

    const displayPageString = () => {
        if (!isSpread || currentPage === 1 || totalPages <= 1) {
            return `${currentPage}`;
        }
        const rightPage = currentPage + 1 <= totalPages ? currentPage + 1 : null;
        return rightPage ? `${currentPage}–${rightPage}` : `${currentPage}`;
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseInt(inputVal, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
            onGoToPage(num);
        }
        setIsEditing(false);
        setInputVal("");
    };

    const progressPercentage = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

    return (
        <>
            {/* Reading Progress Line */}
            <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 z-50 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[#059669] to-[#10B981] transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Floating Persistent Toolbar in Translucent White */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 select-none max-w-[95vw]">
                <div className="flex items-center gap-1.5 sm:gap-2.5 bg-white/92 backdrop-blur-xl border border-gray-200 text-gray-800 px-3 sm:px-4 py-1.5 rounded-full shadow-xl shadow-gray-400/20 ring-1 ring-black/5">
                    {/* First Page */}
                    <button
                        onClick={() => onGoToPage(1)}
                        disabled={!hasPrev}
                        className="hidden md:flex p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                        aria-label="First Page"
                        title="First Page (Home)"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Prev Button */}
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="p-1.5 sm:p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                        aria-label="Previous Page"
                        title="Previous Page (Left Arrow)"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Page Range & Jump Box */}
                    <div className="flex items-center gap-2 px-1 sm:px-2 text-xs font-sans font-medium text-gray-700">
                        {isEditing ? (
                            <form onSubmit={handleFormSubmit} className="inline-flex items-center gap-1">
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    onBlur={() => setIsEditing(false)}
                                    autoFocus
                                    className="w-12 text-center bg-gray-50 text-gray-900 rounded-md px-1.5 py-0.5 text-xs outline-none border border-[#059669] shadow-inner font-mono font-bold"
                                />
                                <span className="text-gray-400 font-mono">/ {totalPages}</span>
                            </form>
                        ) : (
                            <button
                                onClick={() => {
                                    setInputVal(String(currentPage));
                                    setIsEditing(true);
                                }}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-all cursor-pointer font-mono font-medium group"
                                title="Click to jump to page"
                            >
                                <span className="text-gray-600 group-hover:text-gray-900 font-sans">
                                    {isSpread && currentPage > 1 ? "Pages" : "Page"}
                                </span>
                                <span className="text-gray-900 font-bold text-xs bg-gray-100 px-2 py-0.5 rounded-sm group-hover:bg-[#059669]/10 group-hover:text-[#059669] transition-colors border border-gray-200">
                                    {displayPageString()}
                                </span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-500">{totalPages}</span>
                            </button>
                        )}

                        {/* Interactive Range Slider (Tablet/Desktop) */}
                        {totalPages > 1 && (
                            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 relative">
                                <input
                                    type="range"
                                    min={1}
                                    max={totalPages}
                                    value={scrubValue !== null ? scrubValue : currentPage}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setScrubValue(val);
                                    }}
                                    onMouseUp={() => {
                                        if (scrubValue !== null) {
                                            onGoToPage(scrubValue);
                                            setScrubValue(null);
                                        }
                                    }}
                                    onTouchEnd={() => {
                                        if (scrubValue !== null) {
                                            onGoToPage(scrubValue);
                                            setScrubValue(null);
                                        }
                                    }}
                                    className="w-20 sm:w-28 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                                    title="Drag to scrub through pages"
                                />
                                {scrubValue !== null && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-lg">
                                        Page {scrubValue}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="p-1.5 sm:p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                        aria-label="Next Page"
                        title="Next Page (Right Arrow)"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => onGoToPage(totalPages)}
                        disabled={!hasNext}
                        className="hidden md:flex p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                        aria-label="Last Page"
                        title="Last Page (End)"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );
}
