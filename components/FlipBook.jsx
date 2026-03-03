'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import styles from './FlipBook.module.css';

// ── Individual page component (must forward ref for react-pageflip) ──
const Page = forwardRef(function Page({ pageNumber, src }, ref) {
    return (
        <div className={styles.page} ref={ref}>
            <img
                src={src}
                alt={`Page ${pageNumber}`}
                className={styles.pageImage}
                draggable={false}
            />
        </div>
    );
});

// ── Main FlipBook component ──
export default function FlipBook() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 700, height: 990 });
    const bookRef = useRef(null);

    // ── Load PDF using pdfjs-dist (runs only on client) ──
    useEffect(() => {
        let cancelled = false;

        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);

                // Dynamically import pdfjs-dist to avoid SSR issues
                const pdfjsLib = await import('pdfjs-dist');

                // Configure worker — pinned to installed version to prevent mismatch
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const loadingTask = pdfjsLib.getDocument('/magazine.pdf');
                const pdf = await loadingTask.promise;

                if (cancelled) return;
                setTotalPages(pdf.numPages);

                // Render scale — 1.5 balances quality vs speed
                const scale = 1.5;

                // Render pages in parallel batches for speed
                const BATCH_SIZE = 6;
                const pageImages = new Array(pdf.numPages);

                for (let batch = 0; batch < pdf.numPages; batch += BATCH_SIZE) {
                    const batchEnd = Math.min(batch + BATCH_SIZE, pdf.numPages);
                    const promises = [];

                    for (let i = batch; i < batchEnd; i++) {
                        promises.push(
                            (async (pageIdx) => {
                                const page = await pdf.getPage(pageIdx + 1);
                                const viewport = page.getViewport({ scale });

                                const canvas = document.createElement('canvas');
                                canvas.width = viewport.width;
                                canvas.height = viewport.height;

                                const ctx = canvas.getContext('2d');
                                await page.render({ canvasContext: ctx, viewport }).promise;

                                const dataUrl = canvas.toDataURL('image/jpeg', 0.80);

                                // Clean up
                                canvas.width = 0;
                                canvas.height = 0;

                                pageImages[pageIdx] = dataUrl;
                            })(i)
                        );
                    }

                    await Promise.all(promises);

                    // Show pages progressively after first batch
                    if (!cancelled && batch === 0) {
                        setPages([...pageImages.filter(Boolean)]);
                        setLoading(false);
                    }
                }

                if (!cancelled) {
                    setPages([...pageImages]);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Failed to load PDF:', err);
                    setError(
                        'Unable to load the document. Please check your connection and try again.'
                    );
                    setLoading(false);
                }
            }
        };

        loadPdf();
        return () => {
            cancelled = true;
        };
    }, []);

    // ── Responsive book dimensions — much larger, near full-page ──
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            if (w < 480) {
                const bw = w - 24;
                setDimensions({ width: bw, height: Math.round(bw * 1.414) });
            } else if (w < 768) {
                const bw = w - 40;
                setDimensions({ width: bw, height: Math.round(bw * 1.414) });
            } else if (w < 1024) {
                const bh = h - 160;
                const bw = Math.round(bh / 1.414);
                setDimensions({ width: Math.min(bw, w - 80), height: bh });
            } else {
                // Desktop: use most of the viewport height
                const bh = h - 160;
                const bw = Math.round(bh / 1.414);
                setDimensions({ width: Math.min(bw, 750), height: bh });
            }
        };

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // ── Page-flip callback ──
    const onFlip = useCallback((e) => {
        setCurrentPage(e.data);
    }, []);

    const goToPrev = () => bookRef.current?.pageFlip()?.flipPrev();
    const goToNext = () => bookRef.current?.pageFlip()?.flipNext();

    // ── Loading state ──
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Loading document…</p>
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorIcon}>⚠️</div>
                <p className={styles.errorText}>{error}</p>
                <button
                    className={styles.retryBtn}
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>
            </div>
        );
    }

    // ── Flipbook ──
    return (
        <div className={styles.flipbookWrapper}>
            <div className={styles.bookContainer}>
                <HTMLFlipBook
                    ref={bookRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    size="stretch"
                    minWidth={280}
                    maxWidth={900}
                    minHeight={400}
                    maxHeight={1200}
                    showCover={true}
                    mobileScrollSupport={true}
                    onFlip={onFlip}
                    className={styles.flipbook}
                    flippingTime={800}
                    usePortrait={dimensions.width < 500}
                    startZIndex={0}
                    autoSize={true}
                    maxShadowOpacity={0.5}
                    drawShadow={true}
                >
                    {pages.map((src, i) => (
                        <Page key={i} pageNumber={i + 1} src={src} />
                    ))}
                </HTMLFlipBook>
            </div>

            <div className={styles.controls}>
                <button
                    className={styles.navBtn}
                    onClick={goToPrev}
                    disabled={currentPage === 0}
                    aria-label="Previous page"
                >
                    ‹
                </button>

                <span className={styles.pageIndicator}>
                    Page {currentPage + 1} of {totalPages}
                </span>

                <button
                    className={styles.navBtn}
                    onClick={goToNext}
                    disabled={currentPage >= totalPages - 1}
                    aria-label="Next page"
                >
                    ›
                </button>
            </div>
        </div>
    );
}
