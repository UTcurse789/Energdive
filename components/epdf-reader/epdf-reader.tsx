"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Issue } from "@/types";
import { EpdfCanvasPage } from "./epdf-canvas-page";
import { EpdfTopBar, EpdfBottomBar } from "./epdf-controls";
import { EpdfThumbnails } from "./epdf-thumbnails";
import { EpdfShortcutsModal } from "./epdf-shortcuts-modal";
import {
    AlertCircle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    BookOpen,
} from "lucide-react";

interface EpdfReaderProps {
    issue: Issue;
}

export default function EpdfReader({ issue }: EpdfReaderProps) {
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isSpread, setIsSpread] = useState<boolean>(true);
    const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
        width: 1000,
        height: 750,
    });

    const readerContainerRef = useRef<HTMLDivElement | null>(null);
    const readingAreaRef = useRef<HTMLDivElement | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    // ── 1. Load PDF document with complete OpenJPEG (JPX/JPEG2000) & CMYK decoders ──
    useEffect(() => {
        let isCancelled = false;

        async function loadPdf() {
            setLoading(true);
            setError(null);

            try {
                // Dynamically import legacy build with full fallback decoders
                const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

                // Point to local same-origin worker
                pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

                // Stream URL through local same-origin preview route to bypass CORS
                const streamUrl = `/api/issues/${issue.slug}/preview`;

                const loadingTask = pdfjs.getDocument({
                    url: streamUrl,
                    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                    wasmUrl: "/pdfjs/wasm/",
                    iccUrl: "/pdfjs/iccs/",
                    enableXfa: false,
                });

                const loadedDoc = await loadingTask.promise;

                if (!isCancelled) {
                    setPdfDoc(loadedDoc);
                    setTotalPages(loadedDoc.numPages);
                    setLoading(false);
                }
            } catch (err: any) {
                if (!isCancelled) {
                    console.error("[EpdfReader] Failed to load PDF stream:", err);

                    // Fallback to direct pdfUrl if available
                    if (issue.pdfUrl) {
                        try {
                            const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
                            pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
                            const fallbackTask = pdfjs.getDocument({
                                url: issue.pdfUrl,
                                cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
                                cMapPacked: true,
                                standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                                wasmUrl: "/pdfjs/wasm/",
                                iccUrl: "/pdfjs/iccs/",
                                enableXfa: false,
                            });
                            const loadedDoc = await fallbackTask.promise;
                            if (!isCancelled) {
                                setPdfDoc(loadedDoc);
                                setTotalPages(loadedDoc.numPages);
                                setLoading(false);
                                return;
                            }
                        } catch (fallbackErr) {
                            console.error("[EpdfReader] Direct fallback also failed:", fallbackErr);
                        }
                    }

                    setError(
                        "Unable to load this issue's ePDF edition. Please check your internet connection or try again."
                    );
                    setLoading(false);
                }
            }
        }

        loadPdf();

        return () => {
            isCancelled = true;
        };
    }, [issue.slug, issue.pdfUrl]);

    // ── 2. Responsive view adjustment (Spread vs Single) ──
    useEffect(() => {
        const handleResize = () => {
            if (typeof window === "undefined") return;
            const w = window.innerWidth;
            if (w < 1024) {
                setIsSpread(false);
            } else {
                setIsSpread(true);
            }

            if (readingAreaRef.current) {
                const rect = readingAreaRef.current.getBoundingClientRect();
                setContainerSize({
                    // Account for side navigation buttons in container size calculation
                    width: Math.max(rect.width - 120, 300),
                    height: Math.max(rect.height - 80, 350),
                });
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ResizeObserver for reading area
    useEffect(() => {
        if (!readingAreaRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    setContainerSize({
                        width: Math.max(entry.contentRect.width - 120, 300),
                        height: Math.max(entry.contentRect.height - 80, 350),
                    });
                }
            }
        });
        observer.observe(readingAreaRef.current);
        return () => observer.disconnect();
    }, [loading]);

    // ── 3. Page Navigation Logic ──
    const goToPrev = useCallback(() => {
        setCurrentPage((prev) => {
            if (prev <= 1) return 1;
            if (isSpread) {
                if (prev === 2 || prev === 3) return 1;
                return Math.max(1, prev - 2);
            }
            return Math.max(1, prev - 1);
        });
    }, [isSpread]);

    const goToNext = useCallback(() => {
        setCurrentPage((prev) => {
            if (prev >= totalPages) return prev;
            if (isSpread) {
                if (prev === 1) return 2;
                return Math.min(totalPages, prev + 2);
            }
            return Math.min(totalPages, prev + 1);
        });
    }, [isSpread, totalPages]);

    const goToPage = useCallback((pageNum: number) => {
        if (pageNum < 1 || pageNum > totalPages) return;
        if (isSpread && pageNum > 1 && pageNum % 2 !== 0) {
            setCurrentPage(pageNum - 1);
        } else {
            setCurrentPage(pageNum);
        }
    }, [isSpread, totalPages]);

    // ── 4. Zoom Controls ──
    const handleZoomIn = () => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))));
    const handleZoomOut = () => setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))));
    const handleResetZoom = () => setScale(1.0);

    // ── 5. Fullscreen Toggle ──
    const toggleFullscreen = async () => {
        if (!readerContainerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await readerContainerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (e) {
            console.warn("Fullscreen API failed:", e);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // ── 6. Keyboard Shortcuts ──
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (e.key) {
                case "ArrowLeft":
                case "PageUp":
                    e.preventDefault();
                    goToPrev();
                    break;
                case "ArrowRight":
                case "PageDown":
                case " ":
                    e.preventDefault();
                    goToNext();
                    break;
                case "Home":
                    e.preventDefault();
                    setCurrentPage(1);
                    break;
                case "End":
                    e.preventDefault();
                    setCurrentPage(totalPages);
                    break;
                case "+":
                case "=":
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case "-":
                case "_":
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case "0":
                    e.preventDefault();
                    handleResetZoom();
                    break;
                case "f":
                case "F":
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case "t":
                case "T":
                    e.preventDefault();
                    setIsThumbnailsOpen((prev) => !prev);
                    break;
                case "s":
                case "S":
                    e.preventDefault();
                    setIsSpread((prev) => !prev);
                    break;
                case "?":
                    e.preventDefault();
                    setIsShortcutsOpen((prev) => !prev);
                    break;
                case "Escape":
                    if (isThumbnailsOpen) {
                        setIsThumbnailsOpen(false);
                    }
                    if (isShortcutsOpen) {
                        setIsShortcutsOpen(false);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrev, totalPages, isThumbnailsOpen, isShortcutsOpen]);

    // ── 7. Touch Swipes (Mobile) ──
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || e.changedTouches.length !== 1) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            if (deltaX < 0) {
                goToNext();
            } else {
                goToPrev();
            }
        }
        touchStartRef.current = null;
    };

    // ── 8. Render States ──

    // Error State
    if (error) {
        return (
            <main className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col items-center justify-center p-6 select-none font-sans">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xl">
                    <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                        Unable to View ePDF
                    </h2>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        {error}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                            Try Again
                        </button>
                        <Link
                            href={`/issues/${issue.slug}`}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Issue
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Loading State
    if (loading) {
        return (
            <main className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col items-center justify-center p-6 select-none font-sans">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-gray-200 border-t-[#059669] animate-spin" />
                        <BookOpen className="w-6 h-6 text-[#059669] absolute inset-0 m-auto" />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-gray-900 tracking-wide">
                            {issue.title.toLowerCase().includes("energdive") ? issue.title : `ENERGDIVE — ${issue.title}`}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 font-sans">
                            Opening digital edition...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // Spread determination
    const showSpread = isSpread && currentPage > 1 && totalPages > 1;
    const leftPage = showSpread ? currentPage : currentPage;
    const rightPage = showSpread && currentPage + 1 <= totalPages ? currentPage + 1 : null;
    const hasNext = (isSpread && (currentPage === 1 ? totalPages > 1 : currentPage + 2 <= totalPages || (rightPage !== null && rightPage < totalPages))) || (!isSpread && currentPage < totalPages);

    return (
        <div
            ref={readerContainerRef}
            className="h-screen w-screen bg-[#F4F4F6] flex flex-col overflow-hidden relative font-sans select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* ── Reader Top Toolbar (Clean Sticky Header) ── */}
            <EpdfTopBar
                issueSlug={issue.slug}
                issueTitle={issue.title}
                issueVolume={issue.volume}
                issueNumber={issue.Issue}
                issueDate={issue.date}
                isSpread={isSpread}
                onToggleSpread={() => setIsSpread(!isSpread)}
                scale={scale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onToggleThumbnails={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
                isThumbnailsOpen={isThumbnailsOpen}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
                hasPdf={Boolean(issue.pdfUrl)}
            />

            {/* ── Thumbnails Sidebar Drawer ── */}
            <EpdfThumbnails
                isOpen={isThumbnailsOpen}
                onClose={() => setIsThumbnailsOpen(false)}
                pdfDoc={pdfDoc}
                totalPages={totalPages}
                currentPage={currentPage}
                onSelectPage={goToPage}
            />

            {/* ── Keyboard Shortcuts Modal ── */}
            <EpdfShortcutsModal
                isOpen={isShortcutsOpen}
                onClose={() => setIsShortcutsOpen(false)}
            />

            {/* ── Main Stage (Document Canvas with External Side Arrows) ── */}
            <div
                ref={readingAreaRef}
                className="flex-1 w-full relative flex items-center justify-center p-3 sm:p-6 pb-20 sm:pb-24 overflow-auto"
                style={{
                    backgroundColor: "#F4F4F6",
                    backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            >
                {/* Flex row containing Left Arrow, Magazine Container, and Right Arrow */}
                <div className="flex items-center justify-center gap-3 sm:gap-6 my-auto max-w-full">
                    {/* Left Navigation Arrow Button (Outside Magazine) */}
                    <div className="hidden md:flex shrink-0 w-11 h-11 items-center justify-center">
                        {currentPage > 1 && (
                            <button
                                onClick={goToPrev}
                                className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#059669] border border-gray-200/90 shadow-lg shadow-gray-300/40 flex items-center justify-center transition-all cursor-pointer hover:scale-105 group"
                                aria-label="Previous page (Left Arrow)"
                                title="Previous (←)"
                            >
                                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                            </button>
                        )}
                    </div>

                    {/* Magazine Print Publication Container */}
                    <div className="flex items-center justify-center relative shadow-2xl shadow-neutral-400/35 rounded-xs">
                        {/* Left Page (or Single Page / Cover) */}
                        <EpdfCanvasPage
                            pdfDoc={pdfDoc}
                            pageNumber={leftPage}
                            scale={scale}
                            containerHeight={containerSize.height}
                            containerWidth={containerSize.width}
                            isSpread={showSpread}
                            isRightPage={false}
                            className={showSpread ? "rounded-l-xs rounded-r-none border-r border-neutral-200" : "rounded-xs"}
                        />

                        {/* Center Spine Crease Divider (Spread Mode only) */}
                        {showSpread && rightPage && (
                            <div className="w-[2px] self-stretch bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 z-20 shrink-0" />
                        )}

                        {/* Right Page (Spread View only) */}
                        {showSpread && rightPage && (
                            <EpdfCanvasPage
                                pdfDoc={pdfDoc}
                                pageNumber={rightPage}
                                scale={scale}
                                containerHeight={containerSize.height}
                                containerWidth={containerSize.width}
                                isSpread={true}
                                isRightPage={true}
                                className="rounded-r-xs rounded-l-none"
                            />
                        )}
                    </div>

                    {/* Right Navigation Arrow Button (Outside Magazine) */}
                    <div className="hidden md:flex shrink-0 w-11 h-11 items-center justify-center">
                        {hasNext && (
                            <button
                                onClick={goToNext}
                                className="w-11 h-11 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#059669] border border-gray-200/90 shadow-lg shadow-gray-300/40 flex items-center justify-center transition-all cursor-pointer hover:scale-105 group"
                                aria-label="Next page (Right Arrow)"
                                title="Next (→)"
                            >
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Floating Persistent Pagination Toolbar & Progress Line ── */}
            <EpdfBottomBar
                currentPage={currentPage}
                totalPages={totalPages}
                isSpread={showSpread}
                onPrev={goToPrev}
                onNext={goToNext}
                onGoToPage={goToPage}
            />
        </div>
    );
}
